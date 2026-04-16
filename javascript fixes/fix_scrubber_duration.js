// Fix frame-selector scrubber racing ahead on first playback.
//
// Cause: MediaRecorder WebM output (and some uploaded formats) have no
// duration header, so <video>.duration is Infinity until the browser scans
// the full file. The existing onLoadedMetadata only sets duration state when
// it's finite (so it stays at 0), and onTimeUpdate then bumps duration to
// currentTime+0.5 every tick — which makes the scrubber sit near 100% while
// the video is still playing. After one full playback the browser caches the
// real duration, matching the user's "only the first time" symptom.
//
// Fix: in onLoadedMetadata, if duration isn't finite, seek to a huge value
// to force the browser to compute it, then reset to 0. Also remove the
// currentTime+0.5 fallback in onTimeUpdate since duration is now resolved.
const fs = require('fs');
const path = 'C:/apk/android/app/src/main/assets/public/assets/index-BatkhIs-.js';
let code = fs.readFileSync(path, 'utf8');

function rep(o, n, label) {
  if (!code.includes(o)) { console.error('NOT FOUND: ' + label); process.exit(1); }
  if (code.split(o).length > 2) { console.error('MULTI-MATCH: ' + label); process.exit(1); }
  code = code.replace(o, n);
  console.log('OK: ' + label);
}

// ─── 1. Replace onLoadedMetadata to force-resolve Infinity duration ──────
const OLD_N =
  'const N=()=>{if(!i.current)return;' +
  'const P_=i.current.duration;' +
  'if(isFinite(P_)&&P_>0)m(P_);' +
  'i.current.currentTime=.001}';

const NEW_N =
  'const N=()=>{if(!i.current)return;' +
  'const _v=i.current,P_=_v.duration;' +
  'if(isFinite(P_)&&P_>0){m(P_);_v.currentTime=.001;return}' +
  // Duration is Infinity/NaN (MediaRecorder WebM without duration header).
  // Seek past the end to force the browser to scan & compute real duration.
  'const _onTU=()=>{_v.removeEventListener("timeupdate",_onTU);' +
    'const _rd=_v.duration;' +
    'if(isFinite(_rd)&&_rd>0)m(_rd);' +
    '_v.currentTime=.001};' +
  '_v.addEventListener("timeupdate",_onTU);' +
  '_v.currentTime=1e101}';

rep(OLD_N, NEW_N, 'force-resolve Infinity duration in onLoadedMetadata');

// ─── 2. Remove the currentTime+0.5 fallback in onTimeUpdate ──────────────
// Duration is now resolved up-front by the patched N, so this bad fallback
// is the thing that was making the scrubber race ahead. Drop it.
rep(
  ';if(!isFinite(i.current.duration))m(p_=>Math.max(p_,t_+.5))',
  '',
  'drop currentTime+0.5 duration fallback'
);

fs.writeFileSync(path, code);
console.log('\nDone!');
