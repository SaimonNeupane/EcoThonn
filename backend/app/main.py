from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import torch
import torchvision
from torchvision import transforms
from PIL import Image
import io
# or simply, since main.py and RAG/ are in the same folder:
from RAG.pipeline import ask, SoilSenseInput

app = FastAPI(title="Soil Inference API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── model setup ──────────────────────────────────────────
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = torchvision.models.efficientnet_b0()
model.classifier[1] = torch.nn.Linear(in_features=1280, out_features=7)
model.load_state_dict(torch.load("SoilClassification.pth", map_location=device))
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

# ── soil property lookup (moved outside endpoint) ────────
SOIL_PROFILES = {
    "Alluvial_Soil":  {"pH_range": "6.5 - 8.4", "Nitrogen_N": "Low to Medium",  "Phosphorus_P": "Low",            "Potassium_K": "High"},
    "Arid_Soil":      {"pH_range": "7.0 - 9.0", "Nitrogen_N": "Very Low",        "Phosphorus_P": "Normal to High", "Potassium_K": "Adequate"},
    "Black_Soil":     {"pH_range": "7.2 - 8.5", "Nitrogen_N": "Low",             "Phosphorus_P": "Low",            "Potassium_K": "High"},
    "Laterite_Soil":  {"pH_range": "4.5 - 6.5", "Nitrogen_N": "Low",             "Phosphorus_P": "Low",            "Potassium_K": "Low"},
    "Mountain_Soil":  {"pH_range": "5.5 - 6.5", "Nitrogen_N": "High",            "Phosphorus_P": "Low",            "Potassium_K": "Low"},
    "Red_Soil":       {"pH_range": "5.5 - 7.5", "Nitrogen_N": "Low",             "Phosphorus_P": "Low",            "Potassium_K": "Medium"},
    "Yellow_Soil":    {"pH_range": "5.5 - 6.5", "Nitrogen_N": "Low",             "Phosphorus_P": "Low",            "Potassium_K": "Medium"},
}


@app.post("/infer")
async def run_inference(
    file: UploadFile = File(...),
    # Pass these from the frontend (GPS / weather data)
    location: str = "Kathmandu, Nepal",
    elevation_m: float = 1340,
    temp_celsius: float = 25,
    humidity_percent: float = 70,
    rainfall_last_7d_mm: float = 0,
    rainfall_forecast_14d_mm: float = 0,
    season: str = "Unknown",
    days_since_last_rain: int = 0,
    query: str = "What crops should I grow and what soil treatments are needed?",
):
    # ── 1. classify the image ────────────────────────────
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

    print(f"Predicted: {soil_type} | Confidence: {conf_score*100:.2f}%", flush=True)

    # ── 2. low confidence → return early, skip RAG ───────
    if conf_score <= 0.40:
        return {
            "success": False,
            "prediction": "Unknown",
            "confidence_score": round(conf_score * 100, 2),
            "error": "Image quality too low to identify soil type. Try better lighting.",
            "rag_advice": None,
        }

    # ── 3. high confidence → run RAG ─────────────────────
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

    # ── 4. return everything to the frontend ──────────────
    return {
        "success": True,
        "prediction": soil_type,
        "confidence_score": round(conf_score * 100, 2),
        "low_confidence": conf_score < 0.50,   # warn but don't block
        "soil_properties": soil_props,
        "rag_advice": rag_advice,               # bullet-point string from Qwen
    }