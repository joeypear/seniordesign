import React, { useState } from 'react';
import { pickFromGallery, captureFromCamera } from '../lib/camera.js';

export default function ImagePicker({ onPicked, disabled }) {
  const [err, setErr] = useState(null);

  const handle = async (fn) => {
    setErr(null);
    try {
      const blob = await fn();
      if (blob) onPicked(blob);
    } catch (e) {
      if (e?.message && !/cancel/i.test(e.message)) setErr(e.message);
    }
  };

  return (
    <div className="picker">
      <button
        className="picker-btn picker-primary"
        disabled={disabled}
        onClick={() => handle(captureFromCamera)}
      >
        <CameraIcon />
        <span>Take photo</span>
      </button>
      <button
        className="picker-btn picker-secondary"
        disabled={disabled}
        onClick={() => handle(pickFromGallery)}
      >
        <GalleryIcon />
        <span>Choose from gallery</span>
      </button>
      {err && <p className="picker-error">{err}</p>}
    </div>
  );
}

function CameraIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2Z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}
function GalleryIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-5-5L5 21" />
    </svg>
  );
}
