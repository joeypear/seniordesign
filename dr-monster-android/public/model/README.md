# Model directory

Drop your exported `model.onnx` here. The app loads it from
`./model/model.onnx` relative to the page base URL, which resolves to
`file:///android_asset/public/model/model.onnx` inside the APK.

## Export from a PyTorch checkpoint

From the project root:

```bash
python scripts/export_onnx.py \
  --checkpoint ../lucky-sweep-2/ConvNeXt-Tiny_best.pth \
  --output public/model/model.onnx
```

The export script builds a ConvNeXt-Tiny with a single-logit head —
identical to the architecture in `test_model_v1.py` — and writes a fixed
`[1, 3, 224, 224]` float32 input graph.

## Optional: int8 quantization

A dynamically-quantized model is roughly 4× smaller and usually ~2× faster
on mobile CPUs at negligible accuracy cost:

```bash
python scripts/export_onnx.py \
  --checkpoint ../lucky-sweep-2/ConvNeXt-Tiny_best.pth \
  --output public/model/model.onnx \
  --quantize
```

This writes an additional `public/model/model.int8.onnx`. To use it in the
app, either rename it to `model.onnx` or change the path in
`src/lib/inference.js`.

## Why ship the model inside the APK?

Bundling `model.onnx` in `public/` is the whole point: the app loads it
from its own origin at runtime with no network I/O. If you need to swap
models, rebuild and resync:

```bash
npm run sync
```
