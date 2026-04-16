// Replace the WebView-getUserMedia/MediaRecorder camera with calls to the
// native CameraPreview Capacitor plugin (CameraPreviewPlugin.java).
//
// High-level: the preview now renders as a native SurfaceView beneath a
// transparent WebView. JS only drives UI controls + post-capture flow. The
// heavy canvas captureStream path added in fix_camera_capturestream.js is
// removed (it's what was causing the slowness / crash).
//
// After this patch: GD scrubber + yM cropper + xM data-URL pipeline are
// unchanged. Output is now MP4 (CameraX emits H.264/AAC MP4) which the
// WebView's <video> element handles natively.
const fs = require('fs');
const path = 'C:/apk/android/app/src/main/assets/public/assets/index-BatkhIs-.js';
let code = fs.readFileSync(path, 'utf8');

function rep(o, n, label) {
  if (!code.includes(o)) { console.error('NOT FOUND: ' + label); process.exit(1); }
  if (code.split(o).length > 2) { console.error('MULTI-MATCH: ' + label); process.exit(1); }
  code = code.replace(o, n);
  console.log('OK: ' + label);
}

// ─── 1. Drop canvas-captureStream refs ───────────────────────────────────
rep(
  'const qZC=_.useRef({min:1,max:1,step:.1}),qEC=_.useRef({min:-2,max:2,step:.5}),qPZ=_.useRef(null),qCv=_.useRef(null),qRs=_.useRef(null),qRAF=_.useRef(null),qZR=_.useRef(1),qHW=_.useRef(!1),qSV=_.useRef(null)',
  'const qZC=_.useRef({min:1,max:1,step:.1}),qEC=_.useRef({min:-2,max:2,step:.5}),qPZ=_.useRef(null)',
  'drop canvas-captureStream refs'
);

// ─── 2. Replace z() — open native camera via plugin ──────────────────────
const OLD_Z = ',z=async()=>{const W={video:{width:{ideal:1920,max:1920},height:{ideal:1080,max:1080},frameRate:{min:24,ideal:30},facingMode:{ideal:"environment"}},audio:!1},ae=await navigator.mediaDevices.getUserMedia(W);h.current=ae;qZs(1);qZR.current=1;qEs(0);const _tr=ae.getVideoTracks()[0];let _hwZoom=!1;if(_tr){const _cp0=_tr.getCapabilities&&_tr.getCapabilities();if(_cp0&&_cp0.zoom&&_cp0.zoom.max>1)_hwZoom=!0}qHW.current=_hwZoom;if(!_hwZoom){const _sv=document.createElement("video");_sv.muted=!0;_sv.playsInline=!0;_sv.autoplay=!0;_sv.srcObject=ae;_sv.play().catch(()=>{});qSV.current=_sv;const _cv=document.createElement("canvas");qCv.current=_cv;const _cx=_cv.getContext("2d");let _last=0;const _drawLoop=_t=>{if(!qCv.current)return;qRAF.current=requestAnimationFrame(_drawLoop);if(_t-_last<33)return;_last=_t;const _vw=_sv.videoWidth,_vh=_sv.videoHeight;if(!_vw||!_vh)return;if(_cv.width!==_vw)_cv.width=_vw;if(_cv.height!==_vh)_cv.height=_vh;const _zz=qZR.current||1,_sx=_vw*(1-1/_zz)/2,_sy=_vh*(1-1/_zz)/2,_sw=_vw/_zz,_sh=_vh/_zz;_cx.drawImage(_sv,_sx,_sy,_sw,_sh,0,0,_vw,_vh)};qRAF.current=requestAnimationFrame(_drawLoop);qRs.current=_cv.captureStream(30);qZC.current={min:1,max:5,step:.1}};if(_tr){const _cp=_tr.getCapabilities&&_tr.getCapabilities();if(_cp){if(_cp.zoom&&_cp.zoom.max>1){qZC.current={min:_cp.zoom.min,max:Math.min(_cp.zoom.max,10),step:_cp.zoom.step||.1};}if(_cp.exposureCompensation){qEC.current={min:_cp.exposureCompensation.min,max:_cp.exposureCompensation.max,step:_cp.exposureCompensation.step||.5};}}if(_cp&&_cp.torch){_tr.applyConstraints({advanced:[{torch:!0}]}).catch(()=>{});qTs(!0);}}V(!0),setTimeout(()=>{g.current&&(g.current.srcObject=(qHW.current?ae:(qRs.current||ae)),g.current.play().catch(()=>{}))},50)}';

const NEW_Z = ',z=async()=>{' +
  'const CP=window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.CameraPreview;' +
  'if(!CP){console.error("CameraPreview plugin not available");return}' +
  'try{' +
    'document.body.style.background="transparent";' +
    'document.documentElement.style.background="transparent";' +
    'const _caps=await CP.start({lensFacing:"back"});' +
    'if(_caps&&_caps.zoom)qZC.current={min:_caps.zoom.min||1,max:Math.min(_caps.zoom.max||1,10),step:.1};' +
    'if(_caps&&_caps.exposure&&_caps.exposure.supported)qEC.current={min:_caps.exposure.min,max:_caps.exposure.max,step:_caps.exposure.step||1};' +
    'else qEC.current={min:0,max:0,step:1};' +
    'qZs(1);qEs(0);qTs(!1);' +
    'h.current={native:!0};' +
    'V(!0)' +
  '}catch(_e){' +
    'console.error("CameraPreview.start failed",_e);' +
    'document.body.style.background="";document.documentElement.style.background="";' +
    'h.current=null' +
  '}}';

rep(OLD_Z, NEW_Z, 'replace z() with native plugin start');

// ─── 3. Replace ee() — start native recording ────────────────────────────
const OLD_EE = ',ee=()=>{if(!h.current)return;y.current=[];const W=["video/webm;codecs=h264","video/mp4;codecs=avc1","video/webm;codecs=vp8","video/webm"].find(t=>MediaRecorder.isTypeSupported(t))||"video/webm",ae=new MediaRecorder(qHW.current?h.current:(qRs.current||h.current),{mimeType:W,videoBitsPerSecond:4000000});m.current=ae,ae.ondataavailable=xe=>{xe.data.size>0&&y.current.push(xe.data)},ae.onerror=xe=>{console.error("MediaRecorder error",xe),R(!1),V(!1)},ae.onstop=()=>{var Q;if(y.current.length===0){R(!1),V(!1);return}const xe=ae.mimeType||"video/webm",X=xe.includes("mp4")?"mp4":"webm",D=new Blob(y.current,{type:xe}),K=new File([D],`recording.${X}`,{type:xe});(Q=h.current)==null||Q.getTracks().forEach(fe=>fe.stop()),R(!1),V(!1),x(K)},ae.start(500),R(!0)}';

const NEW_EE = ',ee=async()=>{' +
  'const CP=window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.CameraPreview;' +
  'if(!CP||!h.current)return;' +
  'try{await CP.startRecording();R(!0)}' +
  'catch(_e){console.error("startRecording failed",_e)}' +
  '}';

rep(OLD_EE, NEW_EE, 'replace ee() with native startRecording');

// ─── 4. Replace O() — stop recording, build File, feed existing pipeline ─
const OLD_O = ',O=()=>{var W;(W=m.current)==null||W.stop()}';

const NEW_O = ',O=async()=>{' +
  'const CP=window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.CameraPreview;' +
  'const FS=window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.Filesystem;' +
  'if(!CP||!FS){R(!1);return}' +
  'try{' +
    'const _r=await CP.stopRecording();' +
    'R(!1);' +
    'const _fr=await FS.readFile({path:_r.path,directory:"CACHE"});' +
    'const _blob=await(await fetch("data:video/mp4;base64,"+_fr.data)).blob();' +
    'const _file=new File([_blob],"rec.mp4",{type:"video/mp4"});' +
    'try{await CP.stop()}catch(_){}' +
    'V(!1);' +
    'document.body.style.background="";document.documentElement.style.background="";' +
    'h.current=null;' +
    'x(_file)' +
  '}catch(_e){' +
    'console.error("stopRecording failed",_e);' +
    'R(!1);V(!1);' +
    'try{await CP.stop()}catch(_){}' +
    'document.body.style.background="";document.documentElement.style.background="";' +
    'h.current=null' +
  '}}';

rep(OLD_O, NEW_O, 'replace O() with native stopRecording + Filesystem read');

// ─── 5. Replace H() — cancel + teardown ──────────────────────────────────
const OLD_H = ',H=()=>{var W;const _tr=h.current&&h.current.getVideoTracks()[0];_tr&&_tr.applyConstraints({advanced:[{torch:!1}]}).catch(()=>{});if(qRAF.current){cancelAnimationFrame(qRAF.current);qRAF.current=null}if(qRs.current){qRs.current.getTracks().forEach(_t=>_t.stop());qRs.current=null}if(qSV.current){try{qSV.current.pause()}catch(_){}qSV.current.srcObject=null;qSV.current=null}qCv.current=null;qHW.current=!1;(W=h.current)==null||W.getTracks().forEach(ae=>ae.stop()),V(!1),R(!1),qTs(!1)}';

const NEW_H = ',H=async()=>{' +
  'const CP=window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.CameraPreview;' +
  'try{if(CP)await CP.stop()}catch(_){}' +
  'V(!1);R(!1);qTs(!1);' +
  'document.body.style.background="";document.documentElement.style.background="";' +
  'h.current=null' +
  '}';

rep(OLD_H, NEW_H, 'replace H() with native stop + teardown');

// ─── 6. Rewire qAT (torch) to plugin ─────────────────────────────────────
rep(
  'const qAT=_v=>{const _tr=h.current&&h.current.getVideoTracks()[0];if(_tr){_tr.applyConstraints({advanced:[{torch:_v}]}).catch(()=>{});}qTs(_v)}',
  'const qAT=_v=>{const CP=window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.CameraPreview;if(CP)CP.setTorch({on:!!_v}).catch(()=>{});qTs(_v)}',
  'qAT -> plugin.setTorch'
);

// ─── 7. Rewire qAZ (zoom) to plugin ──────────────────────────────────────
rep(
  'const qAZ=_v=>{qZR.current=_v;if(qHW.current){const _tr=h.current&&h.current.getVideoTracks()[0];if(_tr)_tr.applyConstraints({advanced:[{zoom:_v}]}).catch(()=>{})}qZs(_v)}',
  'const qAZ=_v=>{const CP=window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.CameraPreview;if(CP)CP.setZoom({value:_v}).catch(()=>{});qZs(_v)}',
  'qAZ -> plugin.setZoom'
);

// ─── 8. Rewire qAE (exposure) to plugin ──────────────────────────────────
rep(
  'const qAE=_v=>{const _tr=h.current&&h.current.getVideoTracks()[0];if(_tr){_tr.applyConstraints({advanced:[{exposureCompensation:_v,exposureMode:"continuous"}]}).catch(()=>{});}qEs(_v)}',
  'const qAE=_v=>{const CP=window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.CameraPreview;if(CP)CP.setExposureCompensation({value:_v}).catch(()=>{});qEs(_v)}',
  'qAE -> plugin.setExposureCompensation'
);

// ─── 9. Rewire qTP (tap-to-focus) to plugin ──────────────────────────────
rep(
  'const qTP=_e=>{if(!h.current)return;const _rect=_e.currentTarget.getBoundingClientRect(),_x=(_e.clientX-_rect.left)/_rect.width,_y=(_e.clientY-_rect.top)/_rect.height;qFs({x:_e.clientX-_rect.left,y:_e.clientY-_rect.top});setTimeout(()=>qFs(null),1000);const _tr=h.current.getVideoTracks()[0];if(_tr){_tr.applyConstraints({advanced:[{pointOfInterest:{x:_x,y:_y},focusMode:"manual",exposureMode:"auto"}]}).catch(()=>{});}}',
  'const qTP=_e=>{if(!h.current)return;const _rect=_e.currentTarget.getBoundingClientRect(),_x=(_e.clientX-_rect.left)/_rect.width,_y=(_e.clientY-_rect.top)/_rect.height;qFs({x:_e.clientX-_rect.left,y:_e.clientY-_rect.top});setTimeout(()=>qFs(null),1000);const CP=window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.CameraPreview;if(CP)CP.tapToFocus({x:_x,y:_y}).catch(()=>{})}',
  'qTP -> plugin.tapToFocus'
);

// ─── 10. Portal outer <div>: transparent background ──────────────────────
rep(
  'zIndex:9999,background:"black",display:"flex",flexDirection:"column"',
  'zIndex:9999,background:"transparent",display:"flex",flexDirection:"column"',
  'portal background: black -> transparent'
);

// ─── 11. Remove the preview <video> element; replace with transparent
//        touch-capture div (gestures still reach qTS/qTM/qTE/qTP) ────────
rep(
  'b.jsx("video",{ref:g,autoPlay:!0,playsInline:!0,muted:!0,style:{width:"100%",height:"100%",objectFit:"cover"},onTouchStart:qTS,onTouchMove:qTM,onTouchEnd:qTE,onClick:qTP})',
  'b.jsx("div",{style:{position:"absolute",inset:0,background:"transparent"},onTouchStart:qTS,onTouchMove:qTM,onTouchEnd:qTE,onClick:qTP})',
  'remove <video>, add transparent touch-capture div'
);

fs.writeFileSync(path, code);
console.log('\nDone!');
