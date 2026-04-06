import * as ort from 'onnxruntime-web';

// Serve WASM binaries from our own public directory (no CDN needed)
ort.env.wasm.wasmPaths = '/ort-wasm/';
// Single-threaded — works on all mobile browsers without SharedArrayBuffer headers
ort.env.wasm.numThreads = 1;

// ─── Thresholds (matching inference.py exactly) ───────────────────────────────
const LOW_THRESHOLD  = 40.0; // below this → normal
const HIGH_THRESHOLD = 60.0; // above this → abnormal
                              // between   → no_result (low confidence)

// ─── Session cache ────────────────────────────────────────────────────────────
let _session = null;

async function getSession() {
  if (!_session) {
    _session = await ort.InferenceSession.create('/model/model.onnx', {
      // WASM only — prevents onnxruntime from loading the WebGPU/JSEP worker
      // files, which Vite rejects when they live in /public.
      executionProviders: ['wasm'],
    });
  }
  return _session;
}

// ─── Preprocessing (matching inference.py exactly) ───────────────────────────
// transforms.Resize(236, interpolation=BILINEAR) → transforms.CenterCrop(224)
// → transforms.ToTensor()  [scales to 0–1, no normalization]
function preprocessImage(blob) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      try {
        const W = img.naturalWidth;
        const H = img.naturalHeight;

        // Resize so the shorter side = 236, maintaining aspect ratio
        const scale  = 236 / Math.min(W, H);
        const rW     = Math.round(W * scale);
        const rH     = Math.round(H * scale);

        // Center-crop 224×224 from the resized image
        const cropX = Math.floor((rW - 224) / 2);
        const cropY = Math.floor((rH - 224) / 2);

        // Draw directly: map the center-crop region in the original image onto
        // a 224×224 canvas (Canvas bilinear-interpolates, matching BILINEAR).
        const canvas = document.createElement('canvas');
        canvas.width  = 224;
        canvas.height = 224;
        const ctx = canvas.getContext('2d');

        ctx.drawImage(
          img,
          cropX / scale, cropY / scale,   // source origin (original coords)
          224   / scale, 224  / scale,     // source size   (original coords)
          0, 0, 224, 224                   // destination
        );

        const { data } = ctx.getImageData(0, 0, 224, 224);
        const pixels   = 224 * 224;
        const tensor   = new Float32Array(3 * pixels);

        // ToTensor(): scale [0,255] → [0,1], NCHW layout, no normalization
        for (let i = 0; i < pixels; i++) {
          tensor[i]              = data[i * 4]     / 255.0; // R
          tensor[i + pixels]     = data[i * 4 + 1] / 255.0; // G
          tensor[i + 2 * pixels] = data[i * 4 + 2] / 255.0; // B
        }

        resolve(tensor);
      } catch (err) {
        reject(err);
      } finally {
        URL.revokeObjectURL(url);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for preprocessing'));
    };

    img.src = url;
  });
}

// ─── Public API ───────────────────────────────────────────────────────────────
/**
 * Run DR classification on a retinal image blob.
 * Matches the inference.py pipeline exactly:
 *   - ConvNeXt-Tiny with a single linear output (raw logit)
 *   - sigmoid(logit) * 100 = confidence percentage
 *   - < 40  → normal
 *   - > 60  → abnormal
 *   - 40–60 → no_result (low confidence)
 *
 * @param {Blob} imageBlob
 * @returns {Promise<{result: string, confidence: number, message: string}|null>}
 *   Returns null if inference fails (caller saves scan as 'pending').
 */
export async function runDRInference(imageBlob) {
  try {
    const session    = await getSession();
    const tensorData = await preprocessImage(imageBlob);

    const inputTensor = new ort.Tensor('float32', tensorData, [1, 3, 224, 224]);
    const output      = await session.run({ [session.inputNames[0]]: inputTensor });
    const logit       = output[session.outputNames[0]].data[0];

    // sigmoid(logit) * 100  →  confidence as a percentage (matches inference.py)
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
  } catch {
    return null; // caller saves scan as 'pending'
  }
}
