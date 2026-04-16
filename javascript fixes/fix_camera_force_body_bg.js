// The camDiag output showed body bg = rgb(22, 27, 46) despite our !important
// <style> rule — something with equal/higher specificity is winning. Two
// changes here:
//
//   1. Raise our selector specificity to "html body" (0-0-2) and move the
//      injected <style> to be the LAST child of <head>, so it wins source
//      order against any equal-specificity !important rule.
//
//   2. Also call body.style.setProperty("background", "transparent",
//      "important") directly — inline styles with !important beat stylesheet
//      !important of equal specificity, so this is the belt to the
//      stylesheet's suspenders.
//
//   3. Beefed-up diagnostic that dumps body.style.cssText, body.className,
//      and the number / sizes of <style> tags in <head> so we can see if
//      something is reinjecting.
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

// 1. Raise specificity + force last-in-head + inline setProperty with !important.
replaceAll(
  '_S.textContent="html,body{background:transparent!important;background-color:transparent!important}#root{visibility:hidden!important}";document.head.appendChild(_S);',
  '_S.textContent="html,body,html body,html.dark body{background:transparent!important;background-color:transparent!important;background-image:none!important}html #root,body #root{visibility:hidden!important}";}document.head.appendChild(_S);document.body.style.setProperty("background","transparent","important");document.body.style.setProperty("background-color","transparent","important");document.body.style.setProperty("background-image","none","important");document.documentElement.style.setProperty("background","transparent","important");',
  'stronger specificity + inline !important body bg',
  1
);

// 2. Upgrade the diagnostic.
replaceAll(
  'console.log("[camDiag] body bg="+getComputedStyle(document.body).backgroundColor+" html bg="+getComputedStyle(document.documentElement).backgroundColor+" rootViz="+(document.getElementById("root")&&getComputedStyle(document.getElementById("root")).visibility)+" bodyChildren="+Array.from(document.body.children).map(function(c){return c.tagName+"#"+c.id+"."+c.className.slice(0,40)}).join("|"));',
  'setTimeout(function(){var cs=getComputedStyle(document.body);console.log("[camDiag] body bg="+cs.backgroundColor+" bg-img="+cs.backgroundImage+" html bg="+getComputedStyle(document.documentElement).backgroundColor+" rootViz="+(document.getElementById("root")&&getComputedStyle(document.getElementById("root")).visibility)+" bodyInline="+document.body.style.cssText.slice(0,200)+" bodyClass="+document.body.className.slice(0,200)+" styleTags="+document.head.querySelectorAll("style").length+" bodyChildren="+Array.from(document.body.children).map(function(c){return c.tagName+"#"+c.id+"."+c.className.slice(0,40)}).join("|"));},50);',
  'diagnostic v2 with inline/class/styletag counts',
  1
);

fs.writeFileSync(path, code);
console.log('\nDone!');
