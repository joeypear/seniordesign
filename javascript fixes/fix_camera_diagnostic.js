// Diagnostic: when camera opens, dump the computed body/html background
// colors and body's direct children via console.log. These land in Logcat
// under the "WebConsole" tag (MainActivity.onConsoleMessage) so we can see
// whether our !important transparency rule actually applied or something
// else is painting dark navy.
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

replaceAll(
  '_S.textContent="html,body{background:transparent!important;background-color:transparent!important}#root{visibility:hidden!important}";document.head.appendChild(_S);}}',
  '_S.textContent="html,body{background:transparent!important;background-color:transparent!important}#root{visibility:hidden!important}";document.head.appendChild(_S);}console.log("[camDiag] body bg="+getComputedStyle(document.body).backgroundColor+" html bg="+getComputedStyle(document.documentElement).backgroundColor+" rootViz="+(document.getElementById("root")&&getComputedStyle(document.getElementById("root")).visibility)+" bodyChildren="+Array.from(document.body.children).map(function(c){return c.tagName+"#"+c.id+"."+c.className.slice(0,40)}).join("|"));}',
  'add camera diagnostic console.log',
  1
);

fs.writeFileSync(path, code);
console.log('\nDone!');
