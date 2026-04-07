#!/usr/bin/env python3
"""
Export the trained ConvNeXt-Tiny DR checkpoint to ONNX for on-device inference.

This mirrors the model construction in ``test_model_v1.py`` /
``inference/run_model.py`` so the exported graph is byte-for-byte equivalent
to what PyTorch used during training/eval:

    model = convnext_tiny(weights=DEFAULT)
    model.classifier[2] = nn.Linear(model.classifier[2].in_features, 1)
    model.load_state_dict(checkpoint['model_state_dict'])
    model.eval()

The exported ONNX has:
    input  : float32[1, 3, 224, 224]   (NCHW, min-max normalized to [0, 1])
    output : float32[1, 1]              (raw logit; sigmoid on the client)

Usage
-----
    python scripts/export_onnx.py \
        --checkpoint ../lucky-sweep-2/ConvNeXt-Tiny_best.pth \
        --output public/model/model.onnx

Optionally, run the ORT dynamic-quantization step afterwards to produce a
~4× smaller int8 model that still runs on the WASM backend:

    python scripts/export_onnx.py --checkpoint ... --output public/model/model.onnx --quantize
"""
from __future__ import annotations

import argparse
import os
import sys

import torch
import torch.nn as nn
from torchvision import models


def build_model() -> nn.Module:
    # Architecture identical to test_model_v1.py's ConvNeXt-Tiny branch.
    model = models.convnext_tiny(weights=models.ConvNeXt_Tiny_Weights.DEFAULT)
    in_features = model.classifier[2].in_features
    model.classifier[2] = nn.Linear(in_features, 1)
    return model


def load_checkpoint(model: nn.Module, checkpoint_path: str) -> None:
    ckpt = torch.load(checkpoint_path, map_location="cpu", weights_only=False)
    state = ckpt["model_state_dict"] if isinstance(ckpt, dict) and "model_state_dict" in ckpt else ckpt
    model.load_state_dict(state)


def export(model: nn.Module, output_path: str, opset: int = 17) -> None:
    os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)
    dummy = torch.zeros(1, 3, 224, 224, dtype=torch.float32)
    model.eval()
    with torch.no_grad():
        torch.onnx.export(
            model,
            dummy,
            output_path,
            input_names=["input"],
            output_names=["logit"],
            opset_version=opset,
            do_constant_folding=True,
            # Fixed batch=1 is fine for the app and produces a smaller, faster graph.
            dynamic_axes=None,
        )
    print(f"[export] wrote {output_path} ({os.path.getsize(output_path) / 1e6:.1f} MB)")


def quantize_int8(input_path: str) -> str:
    try:
        from onnxruntime.quantization import QuantType, quantize_dynamic
    except ImportError as exc:  # pragma: no cover
        print(
            "[quantize] onnxruntime is required for --quantize. "
            "Install with: pip install onnxruntime onnx",
            file=sys.stderr,
        )
        raise SystemExit(1) from exc

    out_path = input_path.replace(".onnx", ".int8.onnx")
    quantize_dynamic(
        model_input=input_path,
        model_output=out_path,
        weight_type=QuantType.QInt8,
    )
    print(f"[quantize] wrote {out_path} ({os.path.getsize(out_path) / 1e6:.1f} MB)")
    return out_path


def sanity_check(onnx_path: str) -> None:
    try:
        import onnxruntime as ort
        import numpy as np
    except ImportError:
        print("[check] onnxruntime not installed — skipping sanity check.")
        return
    sess = ort.InferenceSession(onnx_path, providers=["CPUExecutionProvider"])
    x = np.random.rand(1, 3, 224, 224).astype("float32")
    logit = sess.run(None, {sess.get_inputs()[0].name: x})[0]
    prob = 1.0 / (1.0 + np.exp(-logit))
    print(f"[check] random input → logit={float(logit.ravel()[0]):+.4f}  prob={float(prob.ravel()[0]):.4f}")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--checkpoint", required=True, help="Path to .pth checkpoint")
    ap.add_argument(
        "--output",
        default="public/model/model.onnx",
        help="Output ONNX path (default: public/model/model.onnx)",
    )
    ap.add_argument("--opset", type=int, default=17)
    ap.add_argument("--quantize", action="store_true", help="Also produce int8 dynamic-quantized model")
    args = ap.parse_args()

    model = build_model()
    load_checkpoint(model, args.checkpoint)
    export(model, args.output, opset=args.opset)
    sanity_check(args.output)

    if args.quantize:
        q_path = quantize_int8(args.output)
        sanity_check(q_path)


if __name__ == "__main__":
    main()
