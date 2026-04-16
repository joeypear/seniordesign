const fs = require('fs');
const path = 'C:/apk/android/app/src/main/assets/public/assets/index-BatkhIs-.js';
let code = fs.readFileSync(path, 'utf8');

function rep(o, n, label) {
  if (!code.includes(o)) { console.error('NOT FOUND: ' + label); process.exit(1); }
  if (code.split(o).length > 2) console.warn('MULTI-MATCH: ' + label);
  code = code.replace(o, n);
  console.log('OK: ' + label);
}

// ─── 1. Add new state/refs after existing state declarations ─────────────────
// Insert: zoom state, exposure state, focus-ring state, and 3 refs
rep(
  ',[B,ie]=_.useState(r||null);',
  ',[B,ie]=_.useState(r||null),[qZ,qZs]=_.useState(1),[qE,qEs]=_.useState(0),[qF,qFs]=_.useState(null);const qZC=_.useRef({min:1,max:1,step:.1}),qEC=_.useRef({min:-2,max:2,step:.5}),qPZ=_.useRef(null);',
  'add zoom/exposure/focus state and refs'
);

// ─── 2. Modify startCamera (z) to query capabilities after stream opens ──────
rep(
  'h.current=ae,V(!0),setTimeout',
  'h.current=ae;const _tr=ae.getVideoTracks()[0];if(_tr){const _cp=_tr.getCapabilities&&_tr.getCapabilities();if(_cp){if(_cp.zoom&&_cp.zoom.max>1){qZC.current={min:_cp.zoom.min,max:Math.min(_cp.zoom.max,10),step:_cp.zoom.step||.1};}if(_cp.exposureCompensation){qEC.current={min:_cp.exposureCompensation.min,max:_cp.exposureCompensation.max,step:_cp.exposureCompensation.step||.5};}}}V(!0),setTimeout',
  'query camera capabilities'
);

// ─── 3. Add applyZoom / applyExposure / pinch / tap handlers before portal ───
rep(
  'if(B)return b.jsx(yM,',
  // applyZoom
  'const qAZ=_v=>{const _tr=h.current&&h.current.getVideoTracks()[0];if(_tr){_tr.applyConstraints({advanced:[{zoom:_v}]}).catch(()=>{});}qZs(_v)};'
  // applyExposure
  + 'const qAE=_v=>{const _tr=h.current&&h.current.getVideoTracks()[0];if(_tr){_tr.applyConstraints({advanced:[{exposureCompensation:_v,exposureMode:"manual"}]}).catch(()=>{});}qEs(_v)};'
  // pinch start
  + 'const qTS=_e=>{if(_e.touches.length===2){const _dx=_e.touches[0].clientX-_e.touches[1].clientX,_dy=_e.touches[0].clientY-_e.touches[1].clientY;qPZ.current={d:Math.hypot(_dx,_dy),z:qZ};}};'
  // pinch move
  + 'const qTM=_e=>{if(_e.touches.length===2&&qPZ.current){const _dx=_e.touches[0].clientX-_e.touches[1].clientX,_dy=_e.touches[0].clientY-_e.touches[1].clientY,_d=Math.hypot(_dx,_dy),_nz=Math.min(qZC.current.max,Math.max(qZC.current.min,qPZ.current.z*(_d/qPZ.current.d)));qAZ(_nz);}};'
  // pinch end
  + 'const qTE=_e=>{if(_e.touches.length<2)qPZ.current=null;};'
  // tap to focus
  + 'const qTP=_e=>{if(!h.current)return;const _rect=_e.currentTarget.getBoundingClientRect(),_x=(_e.clientX-_rect.left)/_rect.width,_y=(_e.clientY-_rect.top)/_rect.height;qFs({x:_e.clientX-_rect.left,y:_e.clientY-_rect.top});setTimeout(()=>qFs(null),1000);const _tr=h.current.getVideoTracks()[0];if(_tr){_tr.applyConstraints({advanced:[{pointOfInterest:{x:_x,y:_y},focusMode:"manual",exposureMode:"auto"}]}).catch(()=>{});}};'
  + 'if(B)return b.jsx(yM,',
  'add camera control handlers'
);

// ─── 4. Replace the portal with the full native-like camera UI ───────────────
const OLD_PORTAL =
`const ce=M&&pl.createPortal(b.jsxs("div",{style:{position:"fixed",inset:0,zIndex:9999,background:"black",display:"flex",flexDirection:"column"},children:[b.jsx("video",{ref:g,autoPlay:!0,playsInline:!0,muted:!0,style:{flex:1,width:"100%",objectFit:"cover"}}),T&&b.jsxs("div",{style:{position:"absolute",top:16,left:16,display:"flex",alignItems:"center",gap:8,background:"rgba(0,0,0,0.5)",borderRadius:999,padding:"4px 12px"},children:[b.jsx("div",{style:{width:8,height:8,borderRadius:"50%",background:"#ef4444",animation:"pulse 1s infinite"}}),b.jsx("span",{style:{color:"white",fontSize:12,fontWeight:500},children:l("recording")})]}),b.jsxs("div",{style:{position:"absolute",bottom:40,left:0,right:0,display:"flex",justifyContent:"center",alignItems:"center",gap:32},children:[b.jsx("button",{onClick:H,style:{background:"rgba(255,255,255,0.15)",border:"1px solid rgba(255,255,255,0.3)",color:"white",borderRadius:9999,padding:"8px 20px",fontSize:14,cursor:"pointer"},children:l("cancel")}),b.jsx("button",{onClick:T?O:ee,style:{width:72,height:72,borderRadius:"50%",border:"4px solid white",background:"transparent",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",padding:0},children:b.jsx("div",{style:{width:T?28:54,height:T?28:54,borderRadius:T?6:"50%",background:"#ef4444",transition:"all 0.2s ease"}})}),b.jsx("div",{style:{width:72}})]})]}),document.body)`;

const NEW_PORTAL =
`const ce=M&&pl.createPortal(b.jsxs("div",{style:{position:"fixed",inset:0,zIndex:9999,background:"black",display:"flex",flexDirection:"column"}},` +
// Full-screen preview area (flex:1, relative)
`b.jsxs("div",{style:{flex:1,position:"relative",overflow:"hidden"},children:[` +
  // Video element — with all touch/click handlers
  `b.jsx("video",{ref:g,autoPlay:!0,playsInline:!0,muted:!0,style:{width:"100%",height:"100%",objectFit:"cover"},onTouchStart:qTS,onTouchMove:qTM,onTouchEnd:qTE,onClick:qTP}),` +
  // Focus ring
  `qF&&b.jsx("div",{style:{position:"absolute",left:qF.x-32,top:qF.y-32,width:64,height:64,border:"2px solid rgba(255,210,0,0.9)",borderRadius:6,pointerEvents:"none",transition:"opacity .4s ease",boxShadow:"0 0 0 1px rgba(0,0,0,0.3)"}}),` +
  // Recording indicator (top-left)
  `T&&b.jsxs("div",{style:{position:"absolute",top:16,left:16,display:"flex",alignItems:"center",gap:8,background:"rgba(0,0,0,0.55)",borderRadius:999,padding:"4px 12px"},children:[b.jsx("div",{style:{width:8,height:8,borderRadius:"50%",background:"#ef4444",animation:"pulse 1s infinite"}}),b.jsx("span",{style:{color:"white",fontSize:12,fontWeight:500},children:l("recording")})]},` +
  // Zoom level indicator (top-right)
  `b.jsx("div",{style:{position:"absolute",top:16,right:16,background:"rgba(0,0,0,0.55)",borderRadius:999,padding:"4px 10px",color:"white",fontSize:13,fontWeight:600}},qZ.toFixed(1)+"x"),` +
  // Exposure slider — left edge, vertical, only when not recording
  `!T&&qEC.current.max>qEC.current.min&&b.jsxs("div",{style:{position:"absolute",left:0,top:"50%",transform:"translateY(-50%)",display:"flex",flexDirection:"column",alignItems:"center",gap:6,padding:"12px 8px",background:"rgba(0,0,0,0.3)",borderRadius:"0 12px 12px 0"},children:[` +
    `b.jsx("span",{style:{color:"#fbbf24",fontSize:16,userSelect:"none"}},"\u2600\ufe0f"),` +
    `b.jsx("input",{type:"range",min:qEC.current.min,max:qEC.current.max,step:qEC.current.step,value:qE,onChange:_e=>qAE(parseFloat(_e.target.value)),style:{writingMode:"vertical-lr",direction:"rtl",width:4,height:120,accentColor:"#fbbf24",cursor:"pointer"}})` +
  `]}),` +
  // Zoom preset buttons — bottom-center above record button, only when not recording
  `!T&&b.jsxs("div",{style:{position:"absolute",bottom:112,left:0,right:0,display:"flex",justifyContent:"center",gap:8},children:[` +
    `[1,2,3].filter(_z=>_z<=qZC.current.max).map(_z=>` +
      `b.jsx("button",{onClick:()=>qAZ(_z),style:{background:Math.abs(qZ-_z)<.15?"rgba(255,255,255,0.9)":"rgba(0,0,0,0.5)",color:Math.abs(qZ-_z)<.15?"black":"white",border:"1px solid rgba(255,255,255,0.4)",borderRadius:999,padding:"4px 14px",fontSize:13,fontWeight:600,cursor:"pointer",minWidth:44}},_z+"x",_z)` +
    `)` +
  `]})` +
`]}),` +
// Bottom controls bar
`b.jsxs("div",{style:{background:"rgba(0,0,0,0.85)",paddingBottom:"env(safe-area-inset-bottom,0px)",paddingTop:24,paddingLeft:32,paddingRight:32,display:"flex",justifyContent:"space-between",alignItems:"center"},children:[` +
  // Cancel
  `b.jsx("button",{onClick:H,style:{background:"rgba(255,255,255,0.12)",border:"1px solid rgba(255,255,255,0.25)",color:"white",borderRadius:9999,padding:"8px 20px",fontSize:14,cursor:"pointer",minWidth:72},children:l("cancel")}),` +
  // Record button
  `b.jsx("button",{onClick:T?O:ee,style:{width:72,height:72,borderRadius:"50%",border:"4px solid white",background:"transparent",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",padding:0},children:b.jsx("div",{style:{width:T?28:54,height:T?28:54,borderRadius:T?6:"50%",background:"#ef4444",transition:"all 0.2s ease"}})}),` +
  // Spacer to balance layout
  `b.jsx("div",{style:{minWidth:72}})` +
`]})`+
`),document.body)`;

rep(OLD_PORTAL, NEW_PORTAL, 'replace portal with native-like camera UI');

fs.writeFileSync(path, code);
console.log('\nDone!');
