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
const files = fs.readdirSync(src).filter((f) => f.endsWith('.wasm'));
for (const f of files) {
  fs.copyFileSync(path.join(src, f), path.join(dst, f));
}
console.log(`[copy-wasm] copied ${files.length} wasm file(s) → public/ort-wasm/`);
