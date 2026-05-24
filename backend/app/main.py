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
    with torch.inference_mode():
        outputs = model(input_tensor)
        probabilities = torch.softmax(outputs, dim=1)
        confidence, predicted_idx = torch.max(probabilities, 1)

    return {
        "prediction": class_names[predicted_idx.item()],
        "confidence_score": float(confidence.item()),
    }
