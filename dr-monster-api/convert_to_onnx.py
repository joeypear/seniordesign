"""
Convert the fine-tuned ConvNeXt-Tiny DR model from PyTorch (.pth) to ONNX.

Usage (from the repo root):
    python dr-monster-api/convert_to_onnx.py

Prerequisites:
    pip install torch torchvision

Input:  dr-monster-api/model/ConvNeXt-Tiny_best.pth
Output: public/model/ConvNeXt-Tiny_best.onnx
"""

import torch
import torch.nn as nn
from torchvision import models
from pathlib import Path

MODEL_PATH  = Path(__file__).parent / "model" / "ConvNeXt-Tiny_best.pth"
OUTPUT_PATH = Path(__file__).parent.parent / "public" / "model" / "ConvNeXt-Tiny_best.onnx"


def load_model() -> nn.Module:
    # Recreate the exact architecture from inference.py
    model = models.convnext_tiny(weights=None)
    model.classifier[2] = nn.Linear(model.classifier[2].in_features, 1)

    checkpoint = torch.load(MODEL_PATH, map_location="cpu", weights_only=False)
    model.load_state_dict(checkpoint["model_state_dict"])
    model.eval()
    return model


if __name__ == "__main__":
    if not MODEL_PATH.exists():
        raise SystemExit(
            f"\n[ERROR] Model not found at {MODEL_PATH}\n"
            "Place ConvNeXt-Tiny_best.pth inside dr-monster-api/model/ and re-run."
        )

    print(f"Loading model from {MODEL_PATH} ...")
    model = load_model()

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)

    dummy_input = torch.zeros(1, 3, 224, 224)

    print(f"Exporting to ONNX at {OUTPUT_PATH} ...")
    torch.onnx.export(
        model,
        dummy_input,
        str(OUTPUT_PATH),
        input_names=["input"],
        output_names=["output"],
        dynamic_axes={"input": {0: "batch_size"}, "output": {0: "batch_size"}},
        opset_version=17,
    )

    size_mb = OUTPUT_PATH.stat().st_size / (1024 * 1024)
    print(f"Done! ONNX model saved to: {OUTPUT_PATH}  ({size_mb:.1f} MB)")
    print("\nNext steps:")
    print("  1. npm install              (if not done already)")
    print("  2. Copy WASM runtime files into public/:")
    print("       macOS/Linux:  cp node_modules/onnxruntime-web/dist/*.wasm public/")
    print("       Windows:      copy node_modules\\onnxruntime-web\\dist\\*.wasm public\\")
    print("  3. npm run dev              (the app will use local inference)")
