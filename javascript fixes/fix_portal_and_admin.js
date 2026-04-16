const fs = require('fs');
const crypto = require('crypto');
const path = 'C:/apk/android/app/src/main/assets/public/assets/index-BatkhIs-.js';
let code = fs.readFileSync(path, 'utf8');

function rep(o, n, label) {
  if (!code.includes(o)) { console.error('NOT FOUND: ' + label); process.exit(1); }
  if (code.split(o).length > 2) console.warn('MULTI-MATCH: ' + label);
  code = code.replace(o, n);
  console.log('OK: ' + label);
}

// ─── 1. Fix the broken portal (children passed as extra args) ─────────────────

const BROKEN_PORTAL = fs.readFileSync('C:/apk/portal_broken.txt', 'utf8');

// Correct portal — all children in children:[] arrays, no extra function arguments
const FIXED_PORTAL =
`const ce=M&&pl.createPortal(b.jsxs("div",{style:{position:"fixed",inset:0,zIndex:9999,background:"black",display:"flex",flexDirection:"column"},children:[` +
  // ── Preview area ──
  `b.jsxs("div",{style:{flex:1,position:"relative",overflow:"hidden"},children:[` +
    // Video
    `b.jsx("video",{ref:g,autoPlay:!0,playsInline:!0,muted:!0,style:{width:"100%",height:"100%",objectFit:"cover"},onTouchStart:qTS,onTouchMove:qTM,onTouchEnd:qTE,onClick:qTP}),` +
    // Focus ring
    `qF&&b.jsx("div",{style:{position:"absolute",left:qF.x-32,top:qF.y-32,width:64,height:64,border:"2px solid rgba(255,210,0,0.9)",borderRadius:6,pointerEvents:"none",transition:"opacity .4s ease",boxShadow:"0 0 0 1px rgba(0,0,0,0.3)"}}),` +
    // Recording indicator (top-left) — always a sibling, not a parent
    `T&&b.jsxs("div",{style:{position:"absolute",top:16,left:16,display:"flex",alignItems:"center",gap:8,background:"rgba(0,0,0,0.55)",borderRadius:999,padding:"4px 12px"},children:[b.jsx("div",{style:{width:8,height:8,borderRadius:"50%",background:"#ef4444",animation:"pulse 1s infinite"}}),b.jsx("span",{style:{color:"white",fontSize:12,fontWeight:500},children:l("recording")})]}),` +
    // Torch toggle + zoom indicator (top-right) — sibling, not a child of recording indicator
    `b.jsxs("div",{style:{position:"absolute",top:16,right:16,display:"flex",gap:8,alignItems:"center"},children:[` +
      `b.jsx("button",{onClick:()=>qAT(!qT),style:{background:qT?"rgba(255,210,0,0.85)":"rgba(0,0,0,0.55)",border:"none",borderRadius:999,width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:18},children:"\u26a1"}),` +
      `b.jsx("div",{style:{background:"rgba(0,0,0,0.55)",borderRadius:999,padding:"4px 10px",color:"white",fontSize:13,fontWeight:600},children:qZ.toFixed(1)+"x"})` +
    `]}),` +
    // Exposure slider (left edge, vertical) — hidden while recording
    `!T&&qEC.current.max>qEC.current.min&&b.jsxs("div",{style:{position:"absolute",left:0,top:"50%",transform:"translateY(-50%)",display:"flex",flexDirection:"column",alignItems:"center",gap:6,padding:"12px 8px",background:"rgba(0,0,0,0.3)",borderRadius:"0 12px 12px 0"},children:[` +
      `b.jsx("span",{style:{color:"#fbbf24",fontSize:16,userSelect:"none"},children:"\u2600\ufe0f"}),` +
      `b.jsx("input",{type:"range",min:qEC.current.min,max:qEC.current.max,step:qEC.current.step,value:qE,onChange:_e=>qAE(parseFloat(_e.target.value)),style:{writingMode:"vertical-lr",direction:"rtl",width:4,height:120,accentColor:"#fbbf24",cursor:"pointer"}})` +
    `]}),` +
    // Zoom preset buttons (bottom of preview, above record button) — hidden while recording
    `!T&&b.jsxs("div",{style:{position:"absolute",bottom:112,left:0,right:0,display:"flex",justifyContent:"center",gap:8},children:[` +
      `[1,2,3].filter(_z=>_z<=qZC.current.max).map(_z=>` +
        `b.jsx("button",{key:_z,onClick:()=>qAZ(_z),style:{background:Math.abs(qZ-_z)<.15?"rgba(255,255,255,0.9)":"rgba(0,0,0,0.5)",color:Math.abs(qZ-_z)<.15?"black":"white",border:"1px solid rgba(255,255,255,0.4)",borderRadius:999,padding:"4px 14px",fontSize:13,fontWeight:600,cursor:"pointer",minWidth:44},children:_z+"x"})` +
      `)` +
    `]})` +
  `]}),` +
  // ── Bottom controls bar ──
  `b.jsxs("div",{style:{background:"rgba(0,0,0,0.85)",paddingBottom:"env(safe-area-inset-bottom,0px)",paddingTop:24,paddingLeft:32,paddingRight:32,display:"flex",justifyContent:"space-between",alignItems:"center"},children:[` +
    `b.jsx("button",{onClick:H,style:{background:"rgba(255,255,255,0.12)",border:"1px solid rgba(255,255,255,0.25)",color:"white",borderRadius:9999,padding:"8px 20px",fontSize:14,cursor:"pointer",minWidth:72},children:l("cancel")}),` +
    `b.jsx("button",{onClick:T?O:ee,style:{width:72,height:72,borderRadius:"50%",border:"4px solid white",background:"transparent",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",padding:0},children:b.jsx("div",{style:{width:T?28:54,height:T?28:54,borderRadius:T?6:"50%",background:"#ef4444",transition:"all 0.2s ease"}})}),` +
    `b.jsx("div",{style:{minWidth:72}})` +
  `]})` +
`]}),document.body)`;

if (!code.includes(BROKEN_PORTAL)) {
  console.error('NOT FOUND: broken portal');
  process.exit(1);
}
code = code.replace(BROKEN_PORTAL, FIXED_PORTAL);
console.log('OK: portal structure fixed');

// ─── 2. Inject admin account into Vg() (getUsers) ────────────────────────────
// Hash: SHA-256("password" + "adminsalt12345678") — pre-computed
const ADMIN_HASH = crypto.createHash('sha256').update('password' + 'adminsalt12345678').digest('hex');
const ADMIN_USER = `{id:"00000000-0000-0000-0000-000000000001",email:"admin",username:"admin",passwordHash:"${ADMIN_HASH}",salt:"adminsalt12345678",created_date:"2024-01-01T00:00:00.000Z"}`;

rep(
  'function Vg(){try{return JSON.parse(localStorage.getItem(BN)||"[]")}catch{return[]}}',
  `function Vg(){try{const _u=JSON.parse(localStorage.getItem(BN)||"[]");if(!_u.some(_x=>_x.email==="admin"))_u.unshift(${ADMIN_USER});return _u;}catch{return[${ADMIN_USER}];}}`,
  'inject admin account into Vg()'
);

fs.writeFileSync(path, code);
console.log('\nDone! Admin credentials: email=admin  password=password');
console.log('Hash used:', ADMIN_HASH);
