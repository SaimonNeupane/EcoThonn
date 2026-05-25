from fastapi import FastAPI, UploadFile, File, Depends
from fastapi.middleware.cors import CORSMiddleware
import torch
import torchvision
from torchvision import transforms
from PIL import Image
import io
import os
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.db.database import get_db
from app.api.v1 import api_router
from app.models.soil_scan import SoilScanCreate, SoilHealthStatus
from app.services.soil_scan_service import SoilScanService

app = FastAPI(
    title="EcoThonn Soil Analysis API",
    description="AI-powered soil scanning and analysis platform",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router)

# 1. Setup Device & Architecture
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = torchvision.models.efficientnet_b0()
model.classifier[1] = torch.nn.Linear(in_features=1280, out_features=7)

# 2. Load your saved weights
# Make sure "soilClassification.pth" is in the same directory as this file
model_path = os.path.join(os.path.dirname(__file__), "SoilClassification.pth")
model.load_state_dict(torch.load(model_path, map_location=device))
model.to(device)
model.eval()  # Set to evaluation mode!

# 3. Exact Test Transforms
transform = transforms.Compose(
    [
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ]
)

# Must match the exact order from your PyTorch datasets.ImageFolder
class_names = [
    "Alluvial_Soil",
    "Arid_Soil",
    "Black_Soil",
    "Laterite_Soil",
    "Mountain_Soil",
    "Red_Soil",
    "Yellow_Soil",
]


@app.post("/infer")
async def run_inference(
    file: UploadFile = File(...),
    user_id: str = None,
    field_name: str = None,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Perform soil inference on an uploaded image and optionally save results to database.
    
    Parameters:
    - file: Image file to analyze
    - user_id: Optional user ID to save scan results (if provided, results will be saved to database)
    - field_name: Optional field name for the scan
    """
    # Read image from the incoming API request
    image_bytes = await file.read()
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    # Transform into tensor and add batch dimension: shape becomes [1, 3, 224, 224]
    input_tensor = transform(image).unsqueeze(0).to(device)

    # Run the actual inference
    with torch.inference_mode():
        outputs = model(input_tensor)
        probabilities = torch.softmax(outputs, dim=1)
        confidence, predicted_idx = torch.max(probabilities, 1)

    # Print results
    print(
        f"Predicted Index: {predicted_idx.item()} ({class_names[predicted_idx.item()]})",
        flush=True,
    )
    print(f"Confidence: {confidence.item() * 100:.2f}%", flush=True)
    
    properties = SoilPropertyEstimator()

    if confidence.item() > 0.40:  # lowered from 0.40
        props = properties.predict_properties(class_names[predicted_idx.item()])
        soil_type = class_names[predicted_idx.item()]
        confidence_score = round(confidence.item() * 100, 2)
        
        response = {
            "prediction": soil_type,
            "confidence_score": confidence_score,
            "props": props,
            "success": True,
            "low_confidence": confidence.item() < 0.50,  # warn but don't block
        }
        
        # Save to database if user_id is provided
        if user_id:
            try:
                service = SoilScanService(db)
                
                # Determine health status based on confidence and properties
                health_status = determine_health_status(props, confidence.item())
                
                # Create scan record
                scan_data = SoilScanCreate(
                    user_id=user_id,
                    soil_type=soil_type,
                    confidence_score=confidence_score,
                    ph_range=props.get("pH_range"),
                    npk_values={
                        "nitrogen": props.get("Nitrogen_N"),
                        "phosphorus": props.get("Phosphorus_P"),
                        "potassium": props.get("Potassium_K"),
                    },
                    health_status=health_status,
                    quality_score=calculate_quality_score(confidence.item()),
                    recommendations=generate_recommendations(soil_type, props),
                    field_name=field_name,
                )
                
                # Save to database
                saved_scan = await service.create_soil_scan(scan_data)
                response["scan_id"] = saved_scan.id
                response["saved"] = True
                
            except Exception as e:
                print(f"Error saving scan to database: {str(e)}", flush=True)
                response["saved"] = False
                response["save_error"] = str(e)
        
        return response
    else:
        return {
            "prediction": "Unknown",
            "error": "Image quality too low to identify soil type. Try better lighting.",
            "success": False,
        }


class SoilPropertyEstimator:
    def __init__(self):
        # Baseline inherent properties for Indian/Subcontinental soil types
        self.soil_profiles = {
            "Alluvial_Soil": {
                "pH_range": "6.5 - 8.4 (Slightly Acidic to Alkaline)",
                "Nitrogen_N": "Low to Medium",
                "Phosphorus_P": "Low",
                "Potassium_K": "High",
            },
            "Arid_Soil": {
                "pH_range": "7.0 - 9.0 (Alkaline)",
                "Nitrogen_N": "Very Low",
                "Phosphorus_P": "Normal to High",
                "Potassium_K": "Adequate",
            },
            "Black_Soil": {
                "pH_range": "7.2 - 8.5 (Neutral to Alkaline)",
                "Nitrogen_N": "Low",
                "Phosphorus_P": "Low",
                "Potassium_K": "High (Also rich in Calcium and Magnesium)",
            },
            "Laterite_Soil": {
                "pH_range": "4.5 - 6.5 (Acidic)",
                "Nitrogen_N": "Low",
                "Phosphorus_P": "Low",
                "Potassium_K": "Low (Highly leached)",
            },
            "Mountain_Soil": {
                "pH_range": "5.5 - 6.5 (Acidic)",
                "Nitrogen_N": "High (Rich in organic humus)",
                "Phosphorus_P": "Low",
                "Potassium_K": "Low",
            },
            "Red_Soil": {
                "pH_range": "5.5 - 7.5 (Acidic to Neutral)",
                "Nitrogen_N": "Low",
                "Phosphorus_P": "Low",
                "Potassium_K": "Medium",
            },
            "Yellow_Soil": {
                "pH_range": "5.5 - 6.5 (Acidic)",
                "Nitrogen_N": "Low",
                "Phosphorus_P": "Low",
                "Potassium_K": "Medium",
            },
        }

    def predict_properties(self, soil_class_name):
        """
        Takes the predicted class string from the PyTorch model and
        returns a dictionary of estimated pH and NPK values.
        """
        if soil_class_name in self.soil_profiles:
            return self.soil_profiles[soil_class_name]
        else:
            return {"Error": f"Soil type '{soil_class_name}' not found in database."}


def determine_health_status(props: dict, confidence: float) -> str:
    """
    Determine soil health status based on properties and confidence.
    """
    if confidence < 0.5:
        return SoilHealthStatus.POOR
    
    ph_range = props.get("pH_range", "")
    
    # Excellent: Black soil, Mountain soil with high nitrogen
    if "7.2 - 8.5" in ph_range or ("High" in str(props.get("Nitrogen_N", ""))):
        return SoilHealthStatus.EXCELLENT
    
    # Good: Most soils with decent nutrients
    if confidence > 0.7:
        return SoilHealthStatus.GOOD
    
    # Fair: Moderate confidence and nutrients
    if confidence > 0.55:
        return SoilHealthStatus.FAIR
    
    # Poor: Low nitrogen or phosphorus
    if "Very Low" in str(props.get("Nitrogen_N", "")):
        return SoilHealthStatus.POOR
    
    return SoilHealthStatus.FAIR


def calculate_quality_score(confidence: float) -> float:
    """Calculate quality score based on model confidence."""
    # Convert 0-1 confidence to 0-100 quality score
    return round(min(confidence * 100 * 1.1, 100), 2)


def generate_recommendations(soil_type: str, props: dict) -> list:
    """Generate farming recommendations based on soil type and properties."""
    recommendations = []
    
    nitrogen = props.get("Nitrogen_N", "")
    phosphorus = props.get("Phosphorus_P", "")
    potassium = props.get("Potassium_K", "")
    
    # Nitrogen recommendations
    if "Low" in str(nitrogen) or "Very Low" in str(nitrogen):
        recommendations.append("Add nitrogen-rich fertilizer or nitrogen-fixing crops")
    
    # Phosphorus recommendations
    if "Low" in str(phosphorus):
        recommendations.append("Apply phosphorus fertilizer for better root development")
    
    # Potassium recommendations
    if "Low" in str(potassium):
        recommendations.append("Add potassium fertilizer to improve crop yield")
    
    # Soil type specific recommendations
    if soil_type == "Laterite_Soil":
        recommendations.append("Laterite soil is acidic - consider lime treatment")
        recommendations.append("Add organic matter regularly to improve fertility")
    elif soil_type == "Arid_Soil":
        recommendations.append("Install irrigation system for moisture management")
        recommendations.append("Use mulch to reduce water evaporation")
    elif soil_type == "Black_Soil":
        recommendations.append("Well-suited for cotton, sugarcane, and pulses")
    
    if not recommendations:
        recommendations.append("Soil appears healthy - maintain current management practices")
    
    return recommendations
