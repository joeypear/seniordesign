// Follow-up to fix_camera_hide_root.js: the inline
// `document.body.style.background="transparent"` isn't enough when the app's
// CSS sets a body/html background-color with !important (or a Tailwind dark
// class that wins specificity). We instead inject a <style> tag on camera
// open that forces html, body, and #root to be transparent/hidden with
// !important, and remove it on camera close. Belt-and-suspenders: we keep
// the existing inline style changes (harmless if duplicated).
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

// On camera start: after setting the inline body/html styles and hiding #root,
// also inject a <style> tag whose rules beat any app CSS via !important.
replaceAll(
  'document.body.style.background="transparent";document.documentElement.style.background="transparent";{const _R=document.getElementById("root");if(_R)_R.style.visibility="hidden";}',
  'document.body.style.background="transparent";document.documentElement.style.background="transparent";{const _R=document.getElementById("root");if(_R)_R.style.visibility="hidden";}{let _S=document.getElementById("__camera_transparency");if(!_S){_S=document.createElement("style");_S.id="__camera_transparency";_S.textContent="html,body{background:transparent!important;background-color:transparent!important}#root{visibility:hidden!important}";document.head.appendChild(_S);}}',
  'inject !important transparency <style> on camera start',
  1
);

// On camera stop/cancel/error: remove the injected <style> tag.
replaceAll(
  'document.body.style.background="";document.documentElement.style.background="";{const _R=document.getElementById("root");if(_R)_R.style.visibility="";}',
  'document.body.style.background="";document.documentElement.style.background="";{const _R=document.getElementById("root");if(_R)_R.style.visibility="";}{const _S=document.getElementById("__camera_transparency");if(_S)_S.remove();}',
  'remove !important transparency <style> on camera stop',
  4
);

fs.writeFileSync(path, code);
console.log('\nDone!');
