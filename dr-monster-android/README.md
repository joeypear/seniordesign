# DR Monster — Android (fully local)

A clean rewrite of the DR Monster diabetic retinopathy screening app. Runs a
ConvNeXt-Tiny classifier **entirely on-device** using CPU inference via
`onnxruntime-web` (WASM backend, single-threaded). **Zero network calls** — no
CDN, no API, no fonts from Google, no telemetry. The app works with airplane
mode on.

Built with Vite + React and packaged as an Android APK via Capacitor, so you
can open, build, and sign it in Android Studio like any other native project.

---

## Architecture

```
dr-monster-android/
├── index.html                 strict CSP, self only
├── vite.config.js             relative base, wasm/ort chunk split
├── capacitor.config.json      app id, android scheme
├── package.json
├── scripts/
│   ├── copy-wasm.js           copies ORT .wasm → public/ort-wasm/ (postinstall)
│   └── export_onnx.py         PyTorch checkpoint → ONNX (ConvNeXt-Tiny head)
├── public/
│   ├── model/                 drop model.onnx here (see public/model/README.md)
│   └── ort-wasm/              filled by copy-wasm.js after `npm install`
└── src/
    ├── main.jsx
    ├── App.jsx                tab state, inference orchestration
    ├── index.css              single stylesheet, system fonts
    ├── lib/
    │   ├── inference.js       ORT session + preprocessing (matches test_model_v1.py)
    │   ├── storage.js         IndexedDB scan history (blobs + metadata)
    │   └── camera.js          Capacitor Camera w/ browser fallback
    └── components/
        ├── Header.jsx         inline SVG logo, brand gradient
        ├── BottomNav.jsx      scan / history / account tabs
        ├── ImagePicker.jsx
        ├── ScanPreview.jsx
        ├── HistoryList.jsx
        ├── ScanDetail.jsx
        ├── Settings.jsx       dark mode, clear history
        └── InfoModal.jsx      model / mission / contact info
```

## Preprocessing — exactly matching `test_model_v1.py`

The Python training transform for ConvNeXt-Tiny is:

```python
transforms.Compose([
    transforms.Resize(236, interpolation=BILINEAR),
    transforms.CenterCrop(224),
    transforms.Lambda(lambda x: (x - x.min()) / (x.max() - x.min() + 1e-8)),
])
```

`src/lib/inference.js` replicates this in-browser:

1. Decode the selected image into an `HTMLImageElement`.
2. Resize the shorter side to 236 and center-crop 224×224 in a single
   `ctx.drawImage(...)` call, with `imageSmoothingQuality = 'high'` so the
   canvas's bilinear sampler does the resize.
3. Copy RGB into a planar NCHW `Float32Array`, tracking the **global**
   min/max across all three channels.
4. Apply `(x - min) / (max - min + 1e-8)` in a second pass — the same
   semantics as PyTorch's Lambda, which operates on the entire tensor (not
   per-channel, not the naive `/255`).

The resulting `[1, 3, 224, 224]` tensor is fed into the ORT session. The
model returns a single raw logit; the app applies `sigmoid(logit) * 100` and
thresholds at 40 / 60 for Normal / Abnormal / Inconclusive.

## How the model gets into memory (and stays there)

`preloadModel()` in `src/lib/inference.js` is called once on app mount. It
creates an `ort.InferenceSession` against `./model/model.onnx` with:

```js
{
  executionProviders: ['wasm'],   // CPU WASM — no WebGPU, no JSEP
  graphOptimizationLevel: 'all',
  enableMemPattern: true,
  enableCpuMemArena: true,
}
```

The session promise is cached module-side, so every subsequent scan reuses
the loaded weights without reallocating. On the Android WebView, this keeps
the model resident in the process's heap as long as the app is foregrounded.

## Setup

### 1. Export an ONNX model from your PyTorch checkpoint

```bash
cd dr-monster-android
python scripts/export_onnx.py \
  --checkpoint ../lucky-sweep-2/ConvNeXt-Tiny_best.pth \
  --output public/model/model.onnx
# optional: also produce an int8 version
python scripts/export_onnx.py \
  --checkpoint ../lucky-sweep-2/ConvNeXt-Tiny_best.pth \
  --output public/model/model.onnx --quantize
```

### 2. Install JS dependencies

```bash
npm install
```

`postinstall` copies the ORT WASM binaries out of `node_modules` and into
`public/ort-wasm/` so they are bundled into the APK (no runtime CDN fetch).

### 3. Run in the browser for local iteration

```bash
npm run dev
```

On desktop Chrome this uses the standard file picker; Capacitor camera calls
fall back to `<input type="file" capture="environment">`.

### 4. Build the Android project and open it in Android Studio

Add the native Android shell (only needed the first time):

```bash
npm run build
npx cap add android
```

On every subsequent change:

```bash
npm run sync       # build + cap sync android
npm run android    # also opens Android Studio
```

Inside Android Studio, select a device / emulator and click Run. From there
you can build a signed APK / AAB exactly like any other native app.

### 5. Permissions

Capacitor's Camera plugin registers `CAMERA` and `READ_MEDIA_IMAGES`
permissions automatically during `cap sync`. No `INTERNET` permission is
requested or needed — you can confirm by checking
`android/app/src/main/AndroidManifest.xml` after syncing.

## Verifying zero network calls

1. Put the device into airplane mode.
2. Cold-start the app. Load the model, pick an image, run analysis.
3. Optional: enable `webContentsDebuggingEnabled` temporarily, attach Chrome
   DevTools to the WebView, and confirm the Network tab is empty other than
   the asset:// loads from the APK.

Everything the app needs — HTML, JS, CSS, WASM, ONNX model, logo — is either
inline or served from `file:///android_asset/public/` via Capacitor's
`https://localhost` scheme mapping.

## What was intentionally left out

Compared to the legacy `seniordesign` app, the following were removed
because they require network access or add complexity that doesn't serve the
"fully local, simple rewrite" goal:

- Base44 SDK, HuggingFace calls, Stripe, auth context
- react-query, framer-motion, tailwind, radix-ui, lucide-react
- Multi-language i18n plumbing
- Video frame selector, image cropper
- PDF / html2canvas export

If any of these are needed later, they can be layered back in without
touching the inference pipeline.
