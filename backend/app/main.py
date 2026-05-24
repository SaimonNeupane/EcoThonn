from fastapi import FastAPI, UploadFile, File
import torch
import torchvision
from torchvision import transforms
from PIL import Image
import io

app = FastAPI(title="Soil Inference API")

# 1. Setup Device & Architecture
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = torchvision.models.efficientnet_b0()
model.classifier[1] = torch.nn.Linear(in_features=1280, out_features=7)

# 2. Load your saved weights
# Make sure "soilClassification.pth" is in the same directory as this file
model.load_state_dict(torch.load("SoilClassification.pth", map_location=device))
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
async def run_inference(file: UploadFile = File(...)):
    # Read image from the incoming API request
    image_bytes = await file.read()
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    # Transform into tensor and add batch dimension: shape becomes [1, 3, 224, 224]
    input_tensor = transform(image).unsqueeze(0).to(device)

    # Run the actual inference
    # Run the actual inference
    with torch.inference_mode():
        outputs = model(input_tensor)
        probabilities = torch.softmax(outputs, dim=1)
        confidence, predicted_idx = torch.max(probabilities, 1)

    # 1. Use .item() to extract the float/int from the tensor
    # 2. Multiply by 100 to get the percentage
    # 3. Use flush=True to bypass the Uvicorn buffer and print to the terminal instantly
    print(
        f"Predicted Index: {predicted_idx.item()} ({class_names[predicted_idx.item()]})",
        flush=True,
    )
    print(f"Confidence: {confidence.item() * 100:.2f}%", flush=True)
    properties = SoilPropertyEstimator()

    # In main.py — replace the confidence check block:

    if confidence.item() > 0.40:  # lowered from 0.40
        props = properties.predict_properties(class_names[predicted_idx.item()])
        return {
            "prediction": class_names[predicted_idx.item()],
            "confidence_score": round(confidence.item() * 100, 2),
            "props": props,
            "success": True,
            "low_confidence": confidence.item() < 0.50,  # warn but don't block
        }
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
