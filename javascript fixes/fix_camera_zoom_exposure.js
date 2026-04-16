// Fixes two camera bugs in the bundled JS:
//   1. Exposure slider: only the first change takes effect.
//      Cause: applyConstraints sets exposureMode:"manual" alongside
//      exposureCompensation. Per spec, compensation is ignored when mode is
//      "manual" (that mode locks exposureTime). Fix: use "continuous".
//   2. Zoom not visible while scrubbing in the frame selector.
//      Cause: the <video> in GD is rendered without any zoom transform, so
//      the unzoomed recorded stream is shown. The final capture already
//      applies a center-crop by _gz, so the exported frame IS zoomed, but
//      the scrub preview lies about what you'll get. Fix: apply a CSS
//      transform:scale(_gz) to the scrub <video> so it matches the crop.
const fs = require('fs');
const path = 'C:/apk/android/app/src/main/assets/public/assets/index-BatkhIs-.js';
let code = fs.readFileSync(path, 'utf8');

function rep(o, n, label) {
  if (!code.includes(o)) { console.error('NOT FOUND: ' + label); process.exit(1); }
  if (code.split(o).length > 2) { console.error('MULTI-MATCH: ' + label); process.exit(1); }
  code = code.replace(o, n);
  console.log('OK: ' + label);
}

// ─── 1. Exposure: drop exposureMode:"manual" — it locks exposureTime and
//       makes subsequent exposureCompensation values no-ops on most devices.
//       "continuous" keeps auto-exposure running with the offset applied.
rep(
  '{exposureCompensation:_v,exposureMode:"manual"}',
  '{exposureCompensation:_v,exposureMode:"continuous"}',
  'exposure mode manual -> continuous'
);

// ─── 2. Frame-selector scrub video: apply CSS zoom so the user sees the
//       same crop that "Use this frame" will export.
rep(
  'preload:"auto",playsInline:!0,className:"w-full h-full object-contain"',
  'preload:"auto",playsInline:!0,className:"w-full h-full object-contain",style:{transform:"scale("+(_gz||1)+")",transformOrigin:"center center"}',
  'scrub video zoom transform'
);

fs.writeFileSync(path, code);
console.log('\nDone!');
