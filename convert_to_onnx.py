"""
Convert ConvNeXt-Tiny_best.pth  →  public/model/model.onnx

Usage:
    python convert_to_onnx.py --pth path/to/ConvNeXt-Tiny_best.pth

Requirements:
    pip install torch torchvision onnx
"""

import argparse
import torch
import torch.nn as nn
from torchvision import models
from pathlib import Path


def convert(pth_path: str, out_path: str = "public/model/model.onnx"):
    pth = Path(pth_path)
    if not pth.exists():
        raise FileNotFoundError(f"Checkpoint not found: {pth}")

    print(f"Loading checkpoint: {pth}")
    model = models.convnext_tiny(weights=None)
    model.classifier[2] = nn.Linear(model.classifier[2].in_features, 1)

    checkpoint = torch.load(pth, map_location="cpu", weights_only=False)
    model.load_state_dict(checkpoint["model_state_dict"])
    model.eval()
    print("Model loaded successfully.")

    out = Path(out_path)
    out.parent.mkdir(parents=True, exist_ok=True)

    dummy = torch.zeros(1, 3, 224, 224)
    print(f"Exporting to ONNX: {out}")
    torch.onnx.export(
        model,
        dummy,
        str(out),
        input_names=["input"],
        output_names=["output"],
        dynamic_axes={"input": {0: "batch"}, "output": {0: "batch"}},
        opset_version=17,
    )
    print(f"Done! ONNX model saved to: {out.resolve()}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--pth", required=True, help="Path to ConvNeXt-Tiny_best.pth")
    parser.add_argument(
        "--out",
        default="public/model/model.onnx",
        help="Output path (default: public/model/model.onnx)",
    )
    args = parser.parse_args()
    convert(args.pth, args.out)
