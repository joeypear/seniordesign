import torch
import torch.nn as nn
from torchvision import transforms, models
from PIL import Image
from pathlib import Path

# ─── Configuration ────────────────────────────────────────────────────────────

MODEL_PATH = Path(__file__).parent / "model" / "ConvNeXt-Tiny_best.pth"

# Confidence thresholds (as percentages, since confidence is scaled 0–100)
# Below LOW  → normal
# Above HIGH → abnormal
# Between    → no result (low confidence)
LOW_THRESHOLD  = 40.0
HIGH_THRESHOLD = 60.0

# Transform matching run_model.py exactly
TRANSFORM = transforms.Compose([
    transforms.Resize(236, interpolation=Image.BILINEAR),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    # Normalization intentionally excluded to match training pipeline
])

# ─── Model loading ────────────────────────────────────────────────────────────

def _load_model() -> nn.Module:
    if not MODEL_PATH.exists():
        raise FileNotFoundError(
            f"Model checkpoint not found at {MODEL_PATH}. "
            "Ensure the model/ folder is present with ConvNeXt-Tiny_best.pth inside."
        )

    model = models.convnext_tiny(weights=models.ConvNeXt_Tiny_Weights.DEFAULT)
    model.classifier[2] = torch.nn.Linear(model.classifier[2].in_features, 1)

    checkpoint = torch.load(MODEL_PATH, map_location="cpu", weights_only=False)
    model.load_state_dict(checkpoint["model_state_dict"])
    model.eval()

    return model


try:
    _model = _load_model()
    _model_loaded = True
except FileNotFoundError as e:
    print(f"[WARNING] {e}")
    _model = None
    _model_loaded = False

# ─── Inference ────────────────────────────────────────────────────────────────

def run_inference(image: Image.Image) -> dict:
    """
    Run the DR classifier on a PIL image.

    Returns a dict with:
        result     - "normal" | "abnormal" | "no_result"
        label      - human-readable label for the UI
        confidence - percentage (0.0-100.0) or null
        message    - explanation string
    """
    if not _model_loaded or _model is None:
        return {
            "result":     "no_result",
            "label":      "No Result",
            "confidence": None,
            "message":    "Model is not available. Please contact support.",
        }

    try:
        image = image.convert("RGB")
        tensor = TRANSFORM(image).unsqueeze(0)  # (1, 3, 224, 224)

        with torch.no_grad():
            output = _model(tensor)

        confidence = torch.sigmoid(output).detach().numpy().item() * 100  # 0-100

    except Exception as e:
        print(f"[ERROR] Inference failed: {e}")
        return {
            "result":     "no_result",
            "label":      "No Result",
            "confidence": None,
            "message":    "An error occurred during analysis. Please try again.",
        }

    # Threshold bucketing
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
