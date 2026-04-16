// Follow-up to fix_camera_native.js: when the native CameraPreview opens,
// hide the #root React tree so the transparent WebView reveals the native
// PreviewView rendered behind it. Without this, the DR Monster home-screen
// HTML (rendered inside #root) paints over the entire WebView surface, and
// the native preview is never visible — only the transparent portal's
// controls show up on top of the home-screen background.
//
// The camera portal is mounted via React createPortal into document.body as
// a sibling of #root, so hiding #root does NOT hide the portal.
const fs = require('fs');
const path = 'C:/apk/android/app/src/main/assets/public/assets/index-BatkhIs-.js';
let code = fs.readFileSync(path, 'utf8');

function replaceAll(o, n, label, expected) {
  const parts = code.split(o);
  const count = parts.length - 1;
  if (count === 0) { console.error('NOT FOUND: ' + label); process.exit(1); }
  if (expected != null && count !== expected) {
    console.error('UNEXPECTED COUNT for ' + label + ': got ' + count + ', expected ' + expected);
    process.exit(1);
  }
  code = parts.join(n);
  console.log('OK (' + count + 'x): ' + label);
}

// Set transparent (only in z()): also hide #root so home-screen HTML stops
// painting over the native preview.
replaceAll(
  'document.body.style.background="transparent";document.documentElement.style.background="transparent";',
  'document.body.style.background="transparent";document.documentElement.style.background="transparent";{const _R=document.getElementById("root");if(_R)_R.style.visibility="hidden";}',
  'hide #root on camera start',
  1
);

// Restore (in z()-catch, O()-try, O()-catch, H()): un-hide #root.
replaceAll(
  'document.body.style.background="";document.documentElement.style.background="";',
  'document.body.style.background="";document.documentElement.style.background="";{const _R=document.getElementById("root");if(_R)_R.style.visibility="";}',
  'restore #root on camera stop',
  4
);

fs.writeFileSync(path, code);
console.log('\nDone!');
