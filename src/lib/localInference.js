/**
 * localInference.js
 * Run the DR Monster ConvNeXt-Tiny model entirely in the browser using
 * ONNX Runtime Web — no network call required.
 *
 * Prerequisites (one-time setup):
 *   1. python dr-monster-api/convert_to_onnx.py
 *      → produces public/model/ConvNeXt-Tiny_best.onnx
 *   2. npm install
 *   3. cp node_modules/onnxruntime-web/dist/*.wasm public/
 */

import * as ort from 'onnxruntime-web';

// WASM runtime files live in public/ (copied manually after npm install)
ort.env.wasm.wasmPaths = '/';

// Single-threaded mode — avoids the SharedArrayBuffer COOP/COEP header
// requirement and is sufficient for interactive inference.
ort.env.wasm.numThreads = 1;

const MODEL_URL = '/model/ConvNeXt-Tiny_best.onnx';

// Thresholds match inference.py exactly
const LOW_THRESHOLD  = 40.0;
const HIGH_THRESHOLD = 60.0;

// Lazy-loaded singleton session
let _session = null;

async function getSession() {
  if (!_session) {
    _session = await ort.InferenceSession.create(MODEL_URL, {
      executionProviders: ['wasm'],
    });
  }
  return _session;
}

/**
 * Preprocess an image URL to match the Python transform pipeline:
 *   Resize(236, BILINEAR) → CenterCrop(224) → ToTensor() (/255, no ImageNet norm)
 *
 * Returns a Float32Array of shape (1, 3, 224, 224) in CHW order.
 */
function preprocessImage(imageUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      // Step 1: resize shortest edge to 236, maintaining aspect ratio
      const scale = 236 / Math.min(img.width, img.height);
      const scaledW = Math.round(img.width * scale);
      const scaledH = Math.round(img.height * scale);

      const resizeCanvas = document.createElement('canvas');
      resizeCanvas.width  = scaledW;
      resizeCanvas.height = scaledH;
      resizeCanvas.getContext('2d').drawImage(img, 0, 0, scaledW, scaledH);

      // Step 2: center crop 224×224
      const cropX = Math.floor((scaledW - 224) / 2);
      const cropY = Math.floor((scaledH - 224) / 2);

      const cropCanvas = document.createElement('canvas');
      cropCanvas.width  = 224;
      cropCanvas.height = 224;
      cropCanvas.getContext('2d').drawImage(
        resizeCanvas, cropX, cropY, 224, 224, 0, 0, 224, 224
      );

      // Step 3: ToTensor — RGBA uint8 → float32 [0,1] in CHW order
      const rgba = cropCanvas.getContext('2d').getImageData(0, 0, 224, 224).data;
      const chw  = new Float32Array(3 * 224 * 224);
      const pixels = 224 * 224;

      for (let i = 0; i < pixels; i++) {
        chw[i]           = rgba[i * 4]     / 255.0; // R
        chw[pixels + i]  = rgba[i * 4 + 1] / 255.0; // G
        chw[2*pixels + i]= rgba[i * 4 + 2] / 255.0; // B
      }

      resolve(chw);
    };

    img.onerror = () => reject(new Error('Failed to load image for inference'));
    img.src = imageUrl;
  });
}

/**
 * Run local inference on a single image URL.
 *
 * Returns an object matching the FastAPI response shape:
 *   { result, confidence, message }
 */
export async function runInference(imageUrl) {
  try {
    const session   = await getSession();
    const chw       = await preprocessImage(imageUrl);
    const tensor    = new ort.Tensor('float32', chw, [1, 3, 224, 224]);
    const feeds     = { [session.inputNames[0]]: tensor };
    const output    = await session.run(feeds);
    const logit     = output[session.outputNames[0]].data[0];

    // The model outputs a raw logit — apply sigmoid then scale to 0-100
    const confidence = (1 / (1 + Math.exp(-logit))) * 100;

    if (confidence < LOW_THRESHOLD) {
      return {
        result:     'normal',
        confidence: Math.round(confidence * 100) / 100,
        message:    'No signs of diabetic retinopathy detected.',
      };
    } else if (confidence > HIGH_THRESHOLD) {
      return {
        result:     'abnormal',
        confidence: Math.round(confidence * 100) / 100,
        message:    'Potential signs of diabetic retinopathy detected. Please consult a clinician.',
      };
    } else {
      return {
        result:     'no_result',
        confidence: Math.round(confidence * 100) / 100,
        message:    'Confidence too low to determine a result. Please retake the image.',
      };
    }
  } catch (err) {
    console.error('[localInference] Error:', err);
    return {
      result:     'no_result',
      confidence: undefined,
      message:    'An error occurred during analysis. Please try again.',
    };
  }
}
