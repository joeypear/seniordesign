// ─────────────────────────────────────────────────────────────────────────────
// inference.js — fully-local DR classification
//
// Runs ConvNeXt-Tiny on-device via onnxruntime-web (WASM, single-threaded,
// CPU only). No network calls, no SharedArrayBuffer, no workers beyond what
// ORT bundles locally in /public/ort-wasm/.
//
// Preprocessing mirrors test_model_v1.py (the pipeline used by gradcam.ipynb
// and the most recent training runs):
//
//   1. Decode image → RGB tensor in (C, H, W)
//   2. transforms.Resize(resize_size, BILINEAR)    — shorter side → 236
//   3. transforms.CenterCrop(224)                   — centered 224×224
//   4. Lambda min-max squeeze to [0, 1]:
//        x → (x - x.min()) / (x.max() - x.min() + 1e-8)
//      Computed over the ENTIRE tensor (all 3 channels together) exactly as
//      the PyTorch Lambda does — NOT per-channel, NOT the naive /255.
//
// The model is ConvNeXt-Tiny with a single-logit head (BCEWithLogitsLoss).
// Confidence = sigmoid(logit) * 100  (probability of "abnormal" class).
// ─────────────────────────────────────────────────────────────────────────────
// IMPORTANT: import the CPU-only WASM entry point, NOT the default
// `onnxruntime-web` bundle. The default bundle registers JSEP (WebGPU/WebNN)
// and tries to dynamically import `ort-wasm-simd-threaded.jsep.mjs` even when
// you only ask for the `wasm` execution provider. The `/wasm` subpath is the
// pure-CPU build and is the right one for Capacitor on Android.
import * as ort from 'onnxruntime-web/wasm';

// Serve WASM + .mjs glue from the app's own origin, bundled into the APK.
ort.env.wasm.wasmPaths = new URL('./ort-wasm/', document.baseURI).href;
ort.env.wasm.numThreads = 1;     // single-threaded, CPU-only
ort.env.wasm.simd = true;        // SIMD is safe on all modern Android ARM devices
ort.env.logLevel = 'warning';

// Thresholds — matches the legacy app and training notebook conventions.
const LOW_THRESHOLD  = 40.0; // < 40  → normal
const HIGH_THRESHOLD = 60.0; // > 60  → abnormal
                              // 40–60 → inconclusive (no_result)

// ConvNeXt-Tiny transform constants (see test_model_v1.py lines 46–55).
const RESIZE_SIZE = 236;
const CROP_SIZE   = 224;

// ─── Session cache ──────────────────────────────────────────────────────────
// The ONNX model (~100 MB for ConvNeXt-Tiny) is loaded exactly once per app
// launch and kept resident in device memory for low-latency re-inference.
let _sessionPromise = null;

export function preloadModel() {
  if (!_sessionPromise) {
    _sessionPromise = ort.InferenceSession.create(
      new URL('./model/model.onnx', document.baseURI).href,
      {
        executionProviders: ['wasm'], // CPU-only WASM backend
        graphOptimizationLevel: 'all',
        enableMemPattern: true,
        enableCpuMemArena: true,
      }
    ).catch((err) => {
      _sessionPromise = null; // allow retry next time
      throw err;
    });
  }
  return _sessionPromise;
}

export function isModelLoaded() {
  return _sessionPromise !== null;
}

// ─── Preprocessing ──────────────────────────────────────────────────────────

/**
 * Decode an image source (Blob, data URL, or object URL) into an HTMLImageElement.
 */
function loadImageElement(source) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const isBlob = source instanceof Blob;
    const url = isBlob ? URL.createObjectURL(source) : source;
    img.onload = () => {
      if (isBlob) URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      if (isBlob) URL.revokeObjectURL(url);
      reject(new Error('Failed to decode image'));
    };
    img.src = url;
  });
}

/**
 * Match torchvision.transforms.Resize(size, BILINEAR) semantics:
 *   resize the shorter side to `size`, preserving aspect ratio.
 * Then CenterCrop(crop) from the resized image.
 *
 * We rasterize directly into a `crop × crop` canvas, letting the 2D context's
 * built-in bilinear sampler do the interpolation in a single drawImage call.
 * This is equivalent to Resize → CenterCrop up to sub-pixel rounding, and is
 * how the legacy app (inference.js) matched the Python pipeline.
 */
function resizeAndCrop(img, resizeSize, cropSize) {
  const W = img.naturalWidth;
  const H = img.naturalHeight;
  const scale = resizeSize / Math.min(W, H);
  const rW = W * scale;
  const rH = H * scale;

  // Center-crop window in resized coordinates → translate back to original coords.
  const cropXResized = (rW - cropSize) / 2;
  const cropYResized = (rH - cropSize) / 2;
  const srcX = cropXResized / scale;
  const srcY = cropYResized / scale;
  const srcW = cropSize / scale;
  const srcH = cropSize / scale;

  const canvas = document.createElement('canvas');
  canvas.width  = cropSize;
  canvas.height = cropSize;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high'; // browsers use bilinear/bicubic for 'high'
  ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, cropSize, cropSize);

  return ctx.getImageData(0, 0, cropSize, cropSize);
}

/**
 * Build the NCHW float32 input tensor with the min-max normalization from
 * test_model_v1.py:
 *
 *     data = torch.tensor(x).permute(0, 3, 1, 2)     # NHWC → NCHW, int
 *     data = (data - data.min()) / (data.max() - data.min() + 1e-8)
 *
 * IMPORTANT: the min/max are taken over the ENTIRE tensor (all 3 channels
 * together), not per-channel. We replicate that behavior exactly — any other
 * interpretation would shift the model's input distribution.
 */
function buildInputTensor(imageData, cropSize) {
  const { data } = imageData;                // Uint8ClampedArray, RGBA
  const pixels = cropSize * cropSize;
  const out = new Float32Array(3 * pixels);

  // Single pass: copy RGB into planar NCHW while tracking global min/max.
  let minVal = 255;
  let maxVal = 0;
  for (let i = 0; i < pixels; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    out[i]              = r;
    out[i + pixels]     = g;
    out[i + 2 * pixels] = b;
    if (r < minVal) minVal = r;
    if (g < minVal) minVal = g;
    if (b < minVal) minVal = b;
    if (r > maxVal) maxVal = r;
    if (g > maxVal) maxVal = g;
    if (b > maxVal) maxVal = b;
  }

  // Second pass: apply (x - min) / (max - min + 1e-8).
  const range = maxVal - minVal + 1e-8;
  for (let i = 0; i < out.length; i++) {
    out[i] = (out[i] - minVal) / range;
  }
  return out;
}

export async function preprocess(imageSource) {
  const img = await loadImageElement(imageSource);
  const imageData = resizeAndCrop(img, RESIZE_SIZE, CROP_SIZE);
  const tensorData = buildInputTensor(imageData, CROP_SIZE);
  return new ort.Tensor('float32', tensorData, [1, 3, CROP_SIZE, CROP_SIZE]);
}

// ─── Inference ──────────────────────────────────────────────────────────────

/**
 * Classify a retinal image.
 *
 * @param {Blob|string} imageSource  Blob, data URL, or object URL
 * @returns {Promise<{result: 'normal'|'abnormal'|'no_result', confidence: number, message: string, logit: number}>}
 */
export async function runDRInference(imageSource) {
  const session = await preloadModel();
  const inputTensor = await preprocess(imageSource);

  const feeds = { [session.inputNames[0]]: inputTensor };
  const outputs = await session.run(feeds);
  const logit = outputs[session.outputNames[0]].data[0];
  const confidence = (1 / (1 + Math.exp(-logit))) * 100;

  let result, message;
  if (confidence < LOW_THRESHOLD) {
    result  = 'normal';
    message = 'No signs of diabetic retinopathy detected.';
  } else if (confidence > HIGH_THRESHOLD) {
    result  = 'abnormal';
    message = 'Potential signs of diabetic retinopathy detected. Please consult a clinician.';
  } else {
    result  = 'no_result';
    message = 'Confidence too low to determine a result. Please retake the image.';
  }

  return {
    result,
    confidence: Math.round(confidence * 100) / 100,
    logit,
    message,
  };
}
