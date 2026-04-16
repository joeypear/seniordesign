const fs = require('fs');
const path = 'C:/apk/android/app/src/main/assets/public/assets/index-BatkhIs-.js';
let code = fs.readFileSync(path, 'utf8');

const OLD_PORTAL = fs.readFileSync('C:/apk/portal_current.txt', 'utf8');

// Build the fixed portal
const NEW_PORTAL =
`const ce=M&&pl.createPortal(b.jsxs("div",{style:{position:"fixed",inset:0,zIndex:9999,background:"black",display:"flex",flexDirection:"column"},children:[` +
  // ── Preview area ──────────────────────────────────────────────────────────
  `b.jsxs("div",{style:{flex:1,position:"relative",overflow:"hidden"},children:[` +

    // Video — CSS scale zoom applied here so it works regardless of hardware support
    `b.jsx("video",{ref:g,autoPlay:!0,playsInline:!0,muted:!0,` +
      `style:{width:"100%",height:"100%",objectFit:"cover",transform:"scale("+qZ+")",transformOrigin:"center center",transition:"transform 0.1s ease"},` +
      `onTouchStart:qTS,onTouchMove:qTM,onTouchEnd:qTE,onClick:qTP}),` +

    // Focus ring
    `qF&&b.jsx("div",{style:{position:"absolute",left:qF.x-32,top:qF.y-32,width:64,height:64,border:"2px solid rgba(255,210,0,0.9)",borderRadius:6,pointerEvents:"none",transition:"opacity .4s ease",boxShadow:"0 0 0 1px rgba(0,0,0,0.3)"}}),` +

    // Recording indicator (top-left)
    `T&&b.jsxs("div",{style:{position:"absolute",top:16,left:16,display:"flex",alignItems:"center",gap:8,background:"rgba(0,0,0,0.55)",borderRadius:999,padding:"4px 12px"},children:[` +
      `b.jsx("div",{style:{width:8,height:8,borderRadius:"50%",background:"#ef4444",animation:"pulse 1s infinite"}}),` +
      `b.jsx("span",{style:{color:"white",fontSize:12,fontWeight:500},children:l("recording")})` +
    `]}),` +

    // Torch toggle + zoom indicator (top-right)
    `b.jsxs("div",{style:{position:"absolute",top:16,right:16,display:"flex",gap:8,alignItems:"center"},children:[` +
      `b.jsx("button",{onClick:()=>qAT(!qT),style:{background:qT?"rgba(255,210,0,0.85)":"rgba(0,0,0,0.55)",border:"none",borderRadius:999,width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:18},children:"\u26a1"}),` +
      `b.jsx("div",{style:{background:"rgba(0,0,0,0.55)",borderRadius:999,padding:"4px 10px",color:"white",fontSize:13,fontWeight:600},children:qZ.toFixed(1)+"x"})` +
    `]}),` +

    // Exposure slider (left edge) — FIXED: uses rotate(-90deg) instead of writingMode
    // which loses touch events after first drag on Android WebView
    `!T&&b.jsxs("div",{style:{position:"absolute",left:0,top:"50%",transform:"translateY(-50%)",display:"flex",flexDirection:"column",alignItems:"center",gap:10,padding:"16px 0",background:"rgba(0,0,0,0.45)",borderRadius:"0 14px 14px 0",minWidth:54},children:[` +
      `b.jsx("span",{style:{color:"#fbbf24",fontSize:20,lineHeight:1},children:"\u2600\ufe0f"}),` +
      // Container sized to hold the rotated slider — width=54 height=180
      // The input is 180px wide then rotated -90deg so it appears 180px tall
      `b.jsx("div",{style:{position:"relative",width:44,height:180,flexShrink:0},children:` +
        `b.jsx("input",{type:"range",` +
          `min:qEC.current.min,max:qEC.current.max,step:qEC.current.step,` +
          `value:qE,` +
          `onInput:_e=>qAE(parseFloat(_e.target.value)),` +
          `onChange:_e=>qAE(parseFloat(_e.target.value)),` +
          `style:{position:"absolute",top:"50%",left:"50%",` +
            `width:180,height:44,` +
            `transform:"translate(-50%,-50%) rotate(-90deg)",` +
            `cursor:"pointer",accentColor:"#fbbf24",` +
            `background:"transparent",margin:0,padding:0}})` +
      `)` +
    `]}),` +

    // Zoom preset buttons — always show 1x/2x/3x, CSS scale works on all devices
    `!T&&b.jsxs("div",{style:{position:"absolute",bottom:112,left:0,right:0,display:"flex",justifyContent:"center",gap:8},children:[` +
      `[1,2,3].map(_z=>` +
        `b.jsx("button",{key:_z,onClick:()=>qAZ(_z),` +
          `style:{background:Math.abs(qZ-_z)<.15?"rgba(255,255,255,0.9)":"rgba(0,0,0,0.5)",` +
            `color:Math.abs(qZ-_z)<.15?"black":"white",` +
            `border:"1px solid rgba(255,255,255,0.4)",` +
            `borderRadius:999,padding:"6px 18px",fontSize:14,fontWeight:600,cursor:"pointer",minWidth:52},` +
          `children:_z+"x"})` +
      `)` +
    `]})` +

  `]}),` +
  // ── Bottom controls bar ───────────────────────────────────────────────────
  `b.jsxs("div",{style:{background:"rgba(0,0,0,0.85)",paddingBottom:"env(safe-area-inset-bottom,0px)",paddingTop:24,paddingLeft:32,paddingRight:32,display:"flex",justifyContent:"space-between",alignItems:"center"},children:[` +
    `b.jsx("button",{onClick:H,style:{background:"rgba(255,255,255,0.12)",border:"1px solid rgba(255,255,255,0.25)",color:"white",borderRadius:9999,padding:"8px 20px",fontSize:14,cursor:"pointer",minWidth:72},children:l("cancel")}),` +
    `b.jsx("button",{onClick:T?O:ee,style:{width:72,height:72,borderRadius:"50%",border:"4px solid white",background:"transparent",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",padding:0},children:` +
      `b.jsx("div",{style:{width:T?28:54,height:T?28:54,borderRadius:T?6:"50%",background:"#ef4444",transition:"all 0.2s ease"}})}),` +
    `b.jsx("div",{style:{minWidth:72}})` +
  `]})` +
`]}),document.body)`;

if (!code.includes(OLD_PORTAL)) {
  console.error('Portal not found in bundle');
  process.exit(1);
}
code = code.replace(OLD_PORTAL, NEW_PORTAL);
console.log('OK: portal replaced');

// Reset zoom to 1 when camera opens (z function — after stream starts)
// so zoom doesn't carry over between sessions
const OLD_VZERO = 'h.current=ae;const _tr=ae.getVideoTracks()[0];';
const NEW_VZERO = 'h.current=ae;qZs(1);qEs(0);const _tr=ae.getVideoTracks()[0];';
if (!code.includes(OLD_VZERO)) { console.error('NOT FOUND: reset zoom'); process.exit(1); }
code = code.replace(OLD_VZERO, NEW_VZERO);
console.log('OK: reset zoom+exposure on camera open');

// Clamp pinch zoom between 1 and 5 (hardware zoom range may be 1-10 but CSS scale >4 is blurry)
const OLD_PINCH = 'Math.min(qZC.current.max,Math.max(qZC.current.min,qPZ.current.z*(_d/qPZ.current.d)))';
const NEW_PINCH = 'Math.min(5,Math.max(1,qPZ.current.z*(_d/qPZ.current.d)))';
if (!code.includes(OLD_PINCH)) { console.error('NOT FOUND: pinch clamp'); process.exit(1); }
code = code.replace(OLD_PINCH, NEW_PINCH);
console.log('OK: pinch zoom clamped 1-5');

fs.writeFileSync(path, code);
console.log('\nDone!');
