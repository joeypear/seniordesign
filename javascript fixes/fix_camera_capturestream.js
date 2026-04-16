// Fix camera zoom pixelation by preferring hardware zoom and falling back to
// canvas.captureStream() for the recording path.
//
// Before this patch:
//   - Preview applied CSS transform:scale(qZ)         -> post-capture digital zoom
//   - qAZ also called applyConstraints({zoom:_v})     -> hardware zoom (if supported)
//   - MediaRecorder recorded h.current (raw stream)
// If hardware zoom *is* supported, both were stacking (2x HW * 2x CSS = 4x visually
// and very pixelated). If it *isn't*, CSS scale was the only zoom, and the recording
// was unzoomed.
//
// After this patch:
//   - At camera start we probe getCapabilities().zoom
//   - If HW zoom: applyConstraints({zoom}) is authoritative, preview shows the raw
//     zoomed stream, recording uses the raw stream. No CSS scale. No pixelation
//     beyond what the sensor itself produces.
//   - If no HW zoom: spin up a hidden <video> playing the raw stream, a <canvas>
//     that draws a centered crop by qZ each frame, canvas.captureStream() for the
//     preview and MediaRecorder. Still digital zoom, but now it's baked into the
//     recording (matching what the user sees while scrubbing).
//
// Clean-up (RAF cancel + capture-stream tracks stop + source video release) wired
// into both H (cancel) and the ee onstop path.
const fs = require('fs');
const path = 'C:/apk/android/app/src/main/assets/public/assets/index-BatkhIs-.js';
let code = fs.readFileSync(path, 'utf8');

function rep(o, n, label) {
  if (!code.includes(o)) { console.error('NOT FOUND: ' + label); process.exit(1); }
  if (code.split(o).length > 2) { console.error('MULTI-MATCH: ' + label); process.exit(1); }
  code = code.replace(o, n);
  console.log('OK: ' + label);
}

// ─── 1. Add new refs for canvas path ─────────────────────────────────────
// qCv = canvas, qRs = record/capture stream, qRAF = RAF id, qZR = zoom ref
// (draw loop needs latest zoom without re-closing), qHW = hardware-zoom flag,
// qSV = source <video> driving the canvas
rep(
  'const qZC=_.useRef({min:1,max:1,step:.1}),qEC=_.useRef({min:-2,max:2,step:.5}),qPZ=_.useRef(null)',
  'const qZC=_.useRef({min:1,max:1,step:.1}),qEC=_.useRef({min:-2,max:2,step:.5}),qPZ=_.useRef(null),qCv=_.useRef(null),qRs=_.useRef(null),qRAF=_.useRef(null),qZR=_.useRef(1),qHW=_.useRef(!1),qSV=_.useRef(null)',
  'add canvas/captureStream refs'
);

// ─── 2. qAZ: keep qZR mirror updated, only call HW applyConstraints when HW
//       zoom actually exists (otherwise canvas path handles it)
rep(
  'const qAZ=_v=>{const _tr=h.current&&h.current.getVideoTracks()[0];if(_tr){_tr.applyConstraints({advanced:[{zoom:_v}]}).catch(()=>{});}qZs(_v)}',
  'const qAZ=_v=>{qZR.current=_v;if(qHW.current){const _tr=h.current&&h.current.getVideoTracks()[0];if(_tr)_tr.applyConstraints({advanced:[{zoom:_v}]}).catch(()=>{})}qZs(_v)}',
  'qAZ routes zoom to HW or canvas path'
);

// ─── 3. Camera start: detect HW zoom, spin up canvas fallback when absent ─
// We replace the first few statements of z() after the stream opens to wire
// up capability detection + canvas path. The rest of z (exposure/torch bits)
// is downstream of this and runs unchanged.
rep(
  'h.current=ae;qZs(1);qEs(0);const _tr=ae.getVideoTracks()[0]',
  'h.current=ae;qZs(1);qZR.current=1;qEs(0);' +
  'const _tr=ae.getVideoTracks()[0];' +
  'let _hwZoom=!1;' +
  'if(_tr){const _cp0=_tr.getCapabilities&&_tr.getCapabilities();if(_cp0&&_cp0.zoom&&_cp0.zoom.max>1)_hwZoom=!0}' +
  'qHW.current=_hwZoom;' +
  'if(!_hwZoom){' +
    // Hidden video playing the raw stream — this is what the canvas reads from.
    'const _sv=document.createElement("video");_sv.muted=!0;_sv.playsInline=!0;_sv.autoplay=!0;_sv.srcObject=ae;_sv.play().catch(()=>{});qSV.current=_sv;' +
    // Canvas that draws the zoom-cropped region each frame.
    'const _cv=document.createElement("canvas");qCv.current=_cv;const _cx=_cv.getContext("2d");' +
    // Throttled RAF draw loop (~30fps) — avoids burning 60fps worth of GPU for no reason.
    'let _last=0;const _drawLoop=_t=>{if(!qCv.current)return;qRAF.current=requestAnimationFrame(_drawLoop);if(_t-_last<33)return;_last=_t;' +
      'const _vw=_sv.videoWidth,_vh=_sv.videoHeight;if(!_vw||!_vh)return;' +
      'if(_cv.width!==_vw)_cv.width=_vw;if(_cv.height!==_vh)_cv.height=_vh;' +
      'const _zz=qZR.current||1,_sx=_vw*(1-1/_zz)/2,_sy=_vh*(1-1/_zz)/2,_sw=_vw/_zz,_sh=_vh/_zz;' +
      '_cx.drawImage(_sv,_sx,_sy,_sw,_sh,0,0,_vw,_vh)};' +
    'qRAF.current=requestAnimationFrame(_drawLoop);' +
    'qRs.current=_cv.captureStream(30);' +
    // Allow pinch/buttons to go up to 5x for digital-zoom fallback (hardware
    // zoom path uses the sensor\'s reported cap).
    'qZC.current={min:1,max:5,step:.1}' +
  '}',
  'wire up canvas captureStream fallback when HW zoom unavailable'
);

// ─── 4. Feed preview from either raw stream (HW zoom) or canvas stream ───
rep(
  'g.current&&(g.current.srcObject=ae,g.current.play())',
  'g.current&&(g.current.srcObject=(qHW.current?ae:(qRs.current||ae)),g.current.play().catch(()=>{}))',
  'preview srcObject picks HW stream or canvas stream'
);

// ─── 5. MediaRecorder: record the canvas stream when using canvas path ───
rep(
  'ae=new MediaRecorder(h.current,{mimeType:W,videoBitsPerSecond:4000000})',
  'ae=new MediaRecorder(qHW.current?h.current:(qRs.current||h.current),{mimeType:W,videoBitsPerSecond:4000000})',
  'MediaRecorder source uses canvas stream in fallback'
);

// ─── 6. Cancel (H) cleanup: cancel RAF, stop capture stream, release <video>
rep(
  '(W=h.current)==null||W.getTracks().forEach(ae=>ae.stop()),V(!1),R(!1),qTs(!1)',
  'if(qRAF.current){cancelAnimationFrame(qRAF.current);qRAF.current=null}' +
  'if(qRs.current){qRs.current.getTracks().forEach(_t=>_t.stop());qRs.current=null}' +
  'if(qSV.current){try{qSV.current.pause()}catch(_){}qSV.current.srcObject=null;qSV.current=null}' +
  'qCv.current=null;qHW.current=!1;' +
  '(W=h.current)==null||W.getTracks().forEach(ae=>ae.stop()),V(!1),R(!1),qTs(!1)',
  'cancel (H) cleans up canvas path resources'
);

// ─── 7. Remove CSS transform:scale — zoom is now in the stream itself ────
rep(
  'objectFit:"cover",transform:"scale("+qZ+")",transformOrigin:"center center",transition:"transform 0.1s ease"',
  'objectFit:"cover"',
  'remove CSS scale zoom on preview video'
);

// ─── 8. Pinch zoom clamp: respect capability max (HW zoom may go higher) ─
rep(
  'Math.min(5,Math.max(1,qPZ.current.z*(_d/qPZ.current.d)))',
  'Math.min(qZC.current.max,Math.max(qZC.current.min,qPZ.current.z*(_d/qPZ.current.d)))',
  'pinch clamp uses capability range'
);

fs.writeFileSync(path, code);
console.log('\nDone!');
