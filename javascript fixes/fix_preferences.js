const fs = require('fs');
const path = 'C:/apk/android/app/src/main/assets/public/assets/index-BatkhIs-.js';
let code = fs.readFileSync(path, 'utf8');

// Helper: find matching closing paren for b.jsxs( at given start position
function findJsxEnd(str, start) {
  // str[start] should be 'b' of b.jsxs or b.jsx
  // find the opening '(' and count parens
  let parenDepth = 0;
  for (let i = start; i < str.length; i++) {
    if (str[i] === '(') parenDepth++;
    else if (str[i] === ')') {
      parenDepth--;
      if (parenDepth === 0) return i;
    }
  }
  return -1;
}

// Container starts at 522769 (b.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"10px"}
const CONTAINER_START = 522769;

// Find children:[ start within container
const containerSrc = code.slice(CONTAINER_START, CONTAINER_START + 5000);
const childrenBracketOffset = containerSrc.indexOf('children:[', 70);
const childrenStart = CONTAINER_START + childrenBracketOffset + 'children:['.length;

// Card starts (absolute)
const cardStarts = [522850, 523991, 524711, 525239];

// Find end of each card using paren counting
function findCardEnd(absoluteStart) {
  return CONTAINER_START + findJsxEnd(containerSrc, absoluteStart - CONTAINER_START);
}

const card1End = findCardEnd(cardStarts[0]);
const card2End = findCardEnd(cardStarts[1]);
const card3End = findCardEnd(cardStarts[2]);
const card4End = findCardEnd(cardStarts[3]);

console.log('Card ends:', card1End, card2End, card3End, card4End);

// Verify with start of next card
console.log('C1 end +2:', JSON.stringify(code.slice(card1End, card1End+5)));
console.log('C2 end +2:', JSON.stringify(code.slice(card2End, card2End+5)));
console.log('C3 end +2:', JSON.stringify(code.slice(card3End, card3End+5)));
console.log('C4 end +2:', JSON.stringify(code.slice(card4End, card4End+5)));

// Extract card texts
let card1 = code.slice(cardStarts[0], card1End + 1);
let card2 = code.slice(cardStarts[1], card2End + 1);
let card3 = code.slice(cardStarts[2], card3End + 1);
let card4 = code.slice(cardStarts[3], card4End + 1);

console.log('C1 label:', card1.includes('e("appearance")') ? 'Appearance' : '?');
console.log('C2 label:', card2.includes('e("downloadFormat")') ? 'DownloadFormat' : '?');
console.log('C3 label:', card3.includes('e("permissions")') ? 'Permissions' : '?');
console.log('C4 label:', card4.includes('e("language")') ? 'Language' : '?');

// ==========================================
// MODIFY card3 (Permissions):
// 1. Change icon from pL (Globe) to hp (Check)
// 2. Style the button like the select trigger
// ==========================================

// Change icon - only in card3 (to avoid changing Language card which also uses pL)
card3 = card3.replace(
  'b.jsx(pL,{size:16}),e("permissions")',
  'b.jsx(hp,{size:16}),e("permissions")'
);
console.log('Permission icon changed to hp (Check):', card3.includes('b.jsx(hp,{size:16})') ? 'OK' : 'FAIL');

// Style Grant Access button to match select trigger look
card3 = card3.replace(
  'b.jsx("button",{className:"as-action-btn",style:{width:"auto",padding:"8px 14px",fontSize:"13px"},onClick:()=>{window.AndroidBridge&&window.AndroidBridge.requestCameraPermission()},children:e("grantCameraAccess")})',
  'b.jsx("button",{className:"as-select-trigger",style:{minWidth:"130px"},onClick:()=>{window.AndroidBridge&&window.AndroidBridge.requestCameraPermission()},children:e("grantCameraAccess")})'
);
console.log('Grant Access button restyled:', card3.includes('"as-select-trigger"') ? 'OK' : 'FAIL');

// ==========================================
// REORDER: Language first, then Appearance, DownloadFormat, Permissions
// ==========================================
const newOrder = [card4, card1, card2, card3];
const newCardsBlock = newOrder.join(',');

// Find the old cards block (from card1 start to card4 end)
const oldCardsBlock = code.slice(cardStarts[0], card4End + 1);
console.log('Old block length:', oldCardsBlock.length);
console.log('New block length:', newCardsBlock.length);

if (!code.includes(oldCardsBlock)) {
  console.error('ERROR: Could not find old cards block in code!');
  process.exit(1);
}

code = code.replace(oldCardsBlock, newCardsBlock);
console.log('Reorder: OK');

fs.writeFileSync(path, code);
console.log('\nDone! File written.');
