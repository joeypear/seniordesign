import React, { useState } from 'react';

export default function FlagIcon({ flag, code, className = '' }) {
  const [failed, setFailed] = useState(false);

  // Emoji flags — render in a span, detect if empty/failed via an img trick
  // We use a hidden img with an onerror to detect if the system can't render emoji flags
  // For simplicity: try rendering emoji, and show code as fallback via CSS if needed
  if (failed) {
    return (
      <span className={`text-xs font-bold text-muted-foreground ${className}`}>
        {code}
      </span>
    );
  }

  return (
    <span
      className={`inline-block ${className}`}
      style={{ fontFamily: 'Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif' }}
      onError={() => setFailed(true)}
    >
      {flag}
    </span>
  );
}