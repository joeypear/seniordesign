import torch
import torch.nn as nn
from torchvision import transforms, models
from PIL import Image
from huggingface_hub import hf_hub_download

# ─── Configuration ────────────────────────────────────────────────────────────

MODEL_REPO     = "joeypear/dr-monster-model"
MODEL_FILE     = "updated-ConvenXt-4-6-2026.pth"

LOW_THRESHOLD  = 40.0
HIGH_THRESHOLD = 60.0

TRANSFORM = transforms.Compose([
    transforms.Resize(236, interpolation=Image.BILINEAR),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
])

# ─── Model loading ────────────────────────────────────────────────────────────

def _load_model() -> nn.Module:
    print(f"[INFO] Downloading model from {MODEL_REPO}...")
    model_path = hf_hub_download(repo_id=MODEL_REPO, filename=MODEL_FILE)

    model = models.convnext_tiny(weights=models.ConvNeXt_Tiny_Weights.DEFAULT)
    model.classifier[2] = torch.nn.Linear(model.classifier[2].in_features, 1)

    checkpoint = torch.load(model_path, map_location="cpu", weights_only=False)
    model.load_state_dict(checkpoint["model_state_dict"])
    model.eval()

    return model


try:
    _model = _load_model()
    _model_loaded = True
except Exception as e:
    print(f"[WARNING] Model failed to load: {e}")
    _model = None
    _model_loaded = False

# ─── Inference ────────────────────────────────────────────────────────────────

def run_inference(image: Image.Image) -> dict:
    if not _model_loaded or _model is None:
        return {
            "result":     "no_result",
            "label":      "No Result",
            "confidence": None,
            "message":    "Model is not available. Please contact support.",
        }

    try:
        image = image.convert("RGB")
        tensor = TRANSFORM(image).unsqueeze(0)

        with torch.no_grad():
            output = _model(tensor)

        confidence = torch.sigmoid(output).detach().numpy().item() * 100

    except Exception as e:
        print(f"[ERROR] Inference failed: {e}")
        return {
            "result":     "no_result",
            "label":      "No Result",
            "confidence": None,
            "message":    "An error occurred during analysis. Please try again.",
        }

    if confidence < LOW_THRESHOLD:
        return {
            "result":     "normal",
            "label":      "Normal",
            "confidence": round(confidence, 2),
            "message":    "No signs of diabetic retinopathy detected.",
        }
    elif confidence > HIGH_THRESHOLD:
        return {
            "result":     "abnormal",
            "label":      "Abnormal",
            "confidence": round(confidence, 2),
            "message":    "Potential signs of diabetic retinopathy detected. Please consult a clinician.",
        }
    else:
        return {
            "result":     "no_result",
            "label":      "No Result",
            "confidence": round(confidence, 2),
            "message":    "Confidence too low to determine a result. Please retake the image.",
        }