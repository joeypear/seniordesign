import React from 'react';

export default function Header({ compact }) {
  if (compact) {
    return (
      <header className="header header-compact">
        <Logo size={36} />
      </header>
    );
  }
  return (
    <header className="header header-full">
      <Logo size={64} />
      <h1 className="brand">
        DR <span className="brand-accent">Monster</span>
      </h1>
      <p className="brand-sub">On-device diabetic retinopathy screening</p>
    </header>
  );
}

// Inline SVG logo — no external assets, renders identically offline.
function Logo({ size = 64 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 96 96"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="DR Monster logo"
    >
      <defs>
        <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"  stopColor="#fb923c" />
          <stop offset="100%" stopColor="#f43f5e" />
        </linearGradient>
        <radialGradient id="iris" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%"  stopColor="#5eead4" />
          <stop offset="70%" stopColor="#0d9488" />
          <stop offset="100%" stopColor="#134e4a" />
        </radialGradient>
      </defs>
      {/* Outer ring */}
      <circle cx="48" cy="48" r="44" fill="url(#ring)" />
      {/* Eye whites — almond shape */}
      <path
        d="M10 48 Q48 8 86 48 Q48 88 10 48 Z"
        fill="#ffffff"
      />
      {/* Iris */}
      <circle cx="48" cy="48" r="20" fill="url(#iris)" />
      {/* Pupil */}
      <circle cx="48" cy="48" r="8" fill="#0f172a" />
      {/* Catchlight */}
      <circle cx="43" cy="43" r="3" fill="#ffffff" opacity="0.9" />
    </svg>
  );
}
