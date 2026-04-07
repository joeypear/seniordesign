// Copies the prebuilt ONNX Runtime Web WASM binaries from the installed
// `onnxruntime-web` package into `public/ort-wasm/` so they are bundled
// into the APK and served from the app's own origin at runtime. No CDN, ever.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot  = path.resolve(__dirname, '..');
const src       = path.join(repoRoot, 'node_modules', 'onnxruntime-web', 'dist');
const dst       = path.join(repoRoot, 'public', 'ort-wasm');

if (!fs.existsSync(src)) {
  console.warn('[copy-wasm] onnxruntime-web is not installed yet — skipping.');
  process.exit(0);
}

fs.mkdirSync(dst, { recursive: true });
// Only copy the runtime glue files (ort-wasm-simd-threaded.*), not the ORT
// bundle/entry .mjs files which belong in node_modules, not in public/.
// ORT's extern-wasm build dynamically imports ort-wasm-simd-threaded.mjs from
// wasmPaths at runtime — without it the session fails with "Failed to fetch
// dynamically imported module".
const files = fs.readdirSync(src).filter(
  (f) => f.startsWith('ort-wasm-simd-threaded') && (f.endsWith('.wasm') || f.endsWith('.mjs'))
);
for (const f of files) {
  fs.copyFileSync(path.join(src, f), path.join(dst, f));
}
console.log(`[copy-wasm] copied ${files.length} file(s) (.wasm + .mjs) → public/ort-wasm/`);
