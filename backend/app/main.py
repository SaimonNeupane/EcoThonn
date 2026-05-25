from fastapi import FastAPI, UploadFile, File, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
import torch
import torchvision
from torchvision import transforms
from PIL import Image
import io
import os
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.RAG.pipeline import ask, SoilSenseInput

from app.db.database import get_db
from app.api.v1 import api_router
from app.models.soil_scan import SoilScanCreate, SoilHealthStatus
from app.services.soil_scan_service import SoilScanService

app = FastAPI(
    title="EcoThonn Soil Analysis API",
    description="AI-powered soil scanning and analysis platform",
    version="1.0.0"
)

# FIX 1: Single CORS middleware — duplicate was registered twice before
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router)

# ── Model setup ───────────────────────────────────────────────────────────────
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = torchvision.models.efficientnet_b0()
model.classifier[1] = torch.nn.Linear(in_features=1280, out_features=7)

model_path = os.path.join(os.path.dirname(__file__), "SoilClassification.pth")
model.load_state_dict(torch.load(model_path, map_location=device))
model.to(device)
model.eval()

transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])

class_names = [
    "Alluvial_Soil", "Arid_Soil", "Black_Soil", "Laterite_Soil",
    "Mountain_Soil", "Red_Soil", "Yellow_Soil",
]

# ── Soil property lookup ──────────────────────────────────────────────────────
SOIL_PROFILES = {
    "Alluvial_Soil": {"pH_range": "6.5 - 8.4", "Nitrogen_N": "Low to Medium",  "Phosphorus_P": "Low",            "Potassium_K": "High"},
    "Arid_Soil":     {"pH_range": "7.0 - 9.0", "Nitrogen_N": "Very Low",        "Phosphorus_P": "Normal to High", "Potassium_K": "Adequate"},
    "Black_Soil":    {"pH_range": "7.2 - 8.5", "Nitrogen_N": "Low",             "Phosphorus_P": "Low",            "Potassium_K": "High"},
    "Laterite_Soil": {"pH_range": "4.5 - 6.5", "Nitrogen_N": "Low",             "Phosphorus_P": "Low",            "Potassium_K": "Low"},
    "Mountain_Soil": {"pH_range": "5.5 - 6.5", "Nitrogen_N": "High",            "Phosphorus_P": "Low",            "Potassium_K": "Low"},
    "Red_Soil":      {"pH_range": "5.5 - 7.5", "Nitrogen_N": "Low",             "Phosphorus_P": "Low",            "Potassium_K": "Medium"},
    "Yellow_Soil":   {"pH_range": "5.5 - 6.5", "Nitrogen_N": "Low",             "Phosphorus_P": "Low",            "Potassium_K": "Medium"},
}


# FIX 2: All parameters are now properly declared as function arguments.
#         Previously the environmental/RAG params were defined AFTER the
#         opening brace of the body (after the docstring), which is a
#         SyntaxError. They are now Query() params so they can be passed
#         from the frontend as query-string arguments.
# FIX 3: Removed the git merge-conflict marker (<<<<<<< / ======= / >>>>>>>)
#         that was left in the middle of the function body.
# FIX 4: Response shape now matches what api.ts InferenceResult expects:
#         { prediction, confidence_score, props: {pH_range, Nitrogen_N, ...},
#           success, low_confidence, scan_id?, saved? }
@app.post("/infer")
async def run_inference(
    file: UploadFile = File(...),
    user_id: str = Query(default=None),
    field_name: str = Query(default=None),
    # Environmental context — passed as query-string params from the frontend
    location: str = Query(default="Kathmandu, Nepal"),
    elevation_m: float = Query(default=1340),
    temp_celsius: float = Query(default=25),
    humidity_percent: float = Query(default=70),
    rainfall_last_7d_mm: float = Query(default=0),
    rainfall_forecast_14d_mm: float = Query(default=0),
    season: str = Query(default="Unknown"),
    days_since_last_rain: int = Query(default=0),
    query: str = Query(default="What crops should I grow and what soil treatments are needed?"),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Perform soil inference on an uploaded image and optionally save results to database.

    Parameters:
    - file: Image file to analyze
    - user_id: Optional — if provided the scan is saved to the database
    - field_name: Optional label for this scan
    - location / elevation_m / temp_celsius / …: Environmental context for RAG
    """

    # ── 1. Classify the image ─────────────────────────────────────────────────
    image_bytes = await file.read()
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    input_tensor = transform(image).unsqueeze(0).to(device)

    with torch.inference_mode():
        outputs = model(input_tensor)
        probabilities = torch.softmax(outputs, dim=1)
        confidence, predicted_idx = torch.max(probabilities, 1)

    conf_score = confidence.item()
    soil_type = class_names[predicted_idx.item()]
    soil_props = SOIL_PROFILES.get(soil_type, {})

    print(f"Predicted: {soil_type} | Confidence: {conf_score * 100:.2f}%", flush=True)

    # ── 2. Low confidence — return early, skip RAG ────────────────────────────
    if conf_score <= 0.40:
        return {
            "success": False,
            "prediction": "Unknown",
            "confidence_score": round(conf_score * 100, 2),
            "low_confidence": True,
            # FIX 4: keep props key so frontend never crashes on undefined
            "props": {},
            "error": "Image quality too low to identify soil type. Try better lighting.",
            "rag_advice": None,
            "scan_id": None,
            "saved": False,
        }

    # ── 3. High confidence — run RAG ──────────────────────────────────────────
    rag_advice = ask(SoilSenseInput(
        soil_type=soil_type,
        confidence=conf_score,
        location=location,
        elevation_m=elevation_m,
        temp_celsius=temp_celsius,
        humidity_percent=humidity_percent,
        rainfall_last_7d_mm=rainfall_last_7d_mm,
        rainfall_forecast_14d_mm=rainfall_forecast_14d_mm,
        season=season,
        days_since_last_rain=days_since_last_rain,
        query=query,
    ))

    # ── 4. Optionally save to database ────────────────────────────────────────
    scan_id = None
    saved = False

    if user_id:
        try:
            service = SoilScanService(db)
            scan_create = SoilScanCreate(
                user_id=user_id,
                soil_type=soil_type,
                confidence_score=round(conf_score * 100, 2),
                ph_range=soil_props.get("pH_range"),
                npk_values={
                    "nitrogen": soil_props.get("Nitrogen_N"),
                    "phosphorus": soil_props.get("Phosphorus_P"),
                    "potassium": soil_props.get("Potassium_K"),
                },
                health_status=SoilHealthStatus.GOOD if conf_score >= 0.70 else SoilHealthStatus.FAIR,
                quality_score=round(conf_score * 100, 2),
                recommendations=[rag_advice] if rag_advice else [],
                field_name=field_name,
            )
            saved_scan = await service.create_scan(scan_create)
            scan_id = str(saved_scan.id)
            saved = True
        except Exception as e:
            print(f"Warning: failed to save scan to DB: {e}", flush=True)

    # ── 5. Return everything to the frontend ──────────────────────────────────
    # FIX 4: response uses "props" key matching InferenceResult in api.ts
    return {
        "success": True,
        "prediction": soil_type,
        "confidence_score": round(conf_score * 100, 2),
        "low_confidence": conf_score < 0.50,
        "props": soil_props,          # { pH_range, Nitrogen_N, Phosphorus_P, Potassium_K }
        "rag_advice": rag_advice,
        "scan_id": scan_id,
        "saved": saved,
    }