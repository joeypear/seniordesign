import React from 'react';

const TABS = [
  { key: 'scan',    label: 'New scan', accent: 'orange', icon: EyeIcon },
  { key: 'history', label: 'History',  accent: 'teal',   icon: HistoryIcon },
  { key: 'account', label: 'Account',  accent: 'violet', icon: UserIcon },
];

export default function BottomNav({ active, onChange }) {
  return (
    <nav className="bottom-nav">
      <div className="bottom-nav-inner">
        {TABS.map(({ key, label, accent, icon: Icon }) => {
          const isActive = active === key;
          return (
            <button
              key={key}
              onClick={() => onChange(key)}
              className={`tab-btn ${isActive ? `tab-active tab-${accent}` : ''}`}
              aria-label={label}
            >
              <div className="tab-indicator" />
              <Icon className="tab-icon" />
              <span className="tab-label">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// ─── Inline SVG icons ──────────────────────────────────────────────────────
function EyeIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function HistoryIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 3v5h5" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}
function UserIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
