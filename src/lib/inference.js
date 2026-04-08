import * as ort from 'onnxruntime-web/wasm';

// WASM files are at the root of /public
ort.env.wasm.wasmPaths = '/';
// Single-threaded — works on all browsers without SharedArrayBuffer headers
ort.env.wasm.numThreads = 1;

// Thresholds matching inference.py exactly
const LOW_THRESHOLD  = 40.0; // below → normal
const HIGH_THRESHOLD = 60.0; // above → abnormal
                              // between → no_result (low confidence)

let _session = null;

async function getSession() {
  if (!_session) {
    _session = await ort.InferenceSession.create('/model/model.onnx', {
      executionProviders: ['wasm'],
    });
  }
  return _session;
}

// Preprocessing matching inference.py:
// Resize(236, BILINEAR) → CenterCrop(224) → ToTensor() [0–1, no normalization]
function preprocessImage(blob) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      try {
        const W = img.naturalWidth;
        const H = img.naturalHeight;

        const scale  = 236 / Math.min(W, H);
        const rW     = Math.round(W * scale);
        const rH     = Math.round(H * scale);
        const cropX  = Math.floor((rW - 224) / 2);
        const cropY  = Math.floor((rH - 224) / 2);

        const canvas = document.createElement('canvas');
        canvas.width  = 224;
        canvas.height = 224;
        const ctx = canvas.getContext('2d');

        ctx.drawImage(
          img,
          cropX / scale, cropY / scale,
          224   / scale, 224  / scale,
          0, 0, 224, 224
        );

        const { data } = ctx.getImageData(0, 0, 224, 224);
        const pixels   = 224 * 224;
        const tensor   = new Float32Array(3 * pixels);

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

/**
 * Run DR classification on a retinal image blob entirely in the browser.
 * Returns null if inference fails (caller should save scan as 'pending').
 */
export async function runDRInference(imageBlob) {
  try {
    const session    = await getSession();
    const tensorData = await preprocessImage(imageBlob);

    const inputTensor = new ort.Tensor('float32', tensorData, [1, 3, 224, 224]);
    const output      = await session.run({ [session.inputNames[0]]: inputTensor });
    const logit       = output[session.outputNames[0]].data[0];

    const confidence = (1 / (1 + Math.exp(-logit))) * 100;

    if (confidence < LOW_THRESHOLD) {
      return {
        result:     'normal',
        confidence: Math.round(confidence * 100) / 100,
        message:    'No signs of diabetic retinopathy detected. Routine follow-up screenings are still recommended.',
      };
    } else if (confidence > HIGH_THRESHOLD) {
      return {
        result:     'abnormal',
        confidence: Math.round(confidence * 100) / 100,
        message:    'Potential signs of diabetic retinopathy detected. Please consult a clinician for further evaluation.',
      };
    } else {
      return {
        result:     'no_result',
        confidence: Math.round(confidence * 100) / 100,
        message:    'Confidence too low to determine a result. Please retake the image.',
      };
    }
  } catch (err) {
    console.error('[inference] runDRInference failed:', err);
    return null;
  }
}
