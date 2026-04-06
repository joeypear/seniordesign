import * as ort from 'onnxruntime-web';

// Serve WASM binaries from our own public directory (no CDN needed)
ort.env.wasm.wasmPaths = '/ort-wasm/';
// Single-threaded mode — avoids SharedArrayBuffer requirement, works on all
// mobile browsers (iOS Safari, Android Chrome) without special HTTP headers.
ort.env.wasm.numThreads = 1;

// ─── Preprocessing constants ─────────────────────────────────────────────────
// Standard ImageNet normalization used by most ResNet / EfficientNet models.
// If your model was trained with different values, update these to match your
// HuggingFace Space app.py preprocessing pipeline.
const INPUT_SIZE = 224;
const MEAN = [0.485, 0.456, 0.406];
const STD  = [0.229, 0.224, 0.225];

// ─── Session cache ────────────────────────────────────────────────────────────
let _session = null;

async function getSession() {
  if (!_session) {
    _session = await ort.InferenceSession.create('/model/model.onnx');
  }
  return _session;
}

// ─── Image → Float32 NCHW tensor ─────────────────────────────────────────────
function preprocessImage(blob) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = INPUT_SIZE;
        canvas.height = INPUT_SIZE;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, INPUT_SIZE, INPUT_SIZE);

        const { data } = ctx.getImageData(0, 0, INPUT_SIZE, INPUT_SIZE);
        const pixels = INPUT_SIZE * INPUT_SIZE;
        const tensor = new Float32Array(3 * pixels);

        for (let i = 0; i < pixels; i++) {
          tensor[i]             = (data[i * 4]     / 255 - MEAN[0]) / STD[0]; // R
          tensor[i + pixels]    = (data[i * 4 + 1] / 255 - MEAN[1]) / STD[1]; // G
          tensor[i + 2 * pixels]= (data[i * 4 + 2] / 255 - MEAN[2]) / STD[2]; // B
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

// ─── Softmax helper ───────────────────────────────────────────────────────────
function softmax(logits) {
  const max = Math.max(...logits);
  const exps = logits.map(v => Math.exp(v - max));
  const sum  = exps.reduce((a, b) => a + b, 0);
  return exps.map(v => v / sum);
}

// ─── Public API ───────────────────────────────────────────────────────────────
/**
 * Run DR classification on a retinal image blob.
 *
 * Expected model output: two-class logits or probabilities — index 0 = normal,
 * index 1 = abnormal (DR detected).  If your model outputs a single sigmoid
 * value instead, or uses a different class order, update the output parsing
 * below to match your HuggingFace Space app.py.
 *
 * @param {Blob} imageBlob
 * @returns {Promise<{result: 'normal'|'abnormal', confidence: number, message: null}|null>}
 *   Returns null if inference fails (caller saves scan as 'pending').
 */
export async function runDRInference(imageBlob) {
  try {
    const session = await getSession();
    const tensorData = await preprocessImage(imageBlob);

    const inputTensor = new ort.Tensor('float32', tensorData, [1, 3, INPUT_SIZE, INPUT_SIZE]);
    const feeds = { [session.inputNames[0]]: inputTensor };

    const results = await session.run(feeds);
    const output  = results[session.outputNames[0]];
    const raw     = Array.from(output.data);

    let normalProb, abnormalProb;

    if (raw.length === 1) {
      // Single sigmoid output: value is P(abnormal)
      abnormalProb = raw[0];
      normalProb   = 1 - raw[0];
    } else {
      // Two-class output: apply softmax if values look like logits (>1 or <0)
      const needsSoftmax = raw.some(v => v > 1 || v < 0);
      const probs = needsSoftmax ? softmax(raw) : raw;
      normalProb   = probs[0];
      abnormalProb = probs[1];
    }

    const isAbnormal = abnormalProb > normalProb;
    return {
      result:     isAbnormal ? 'abnormal' : 'normal',
      confidence: Math.max(normalProb, abnormalProb),
      message:    null,
    };
  } catch {
    return null; // caller treats null as 'pending'
  }
}
