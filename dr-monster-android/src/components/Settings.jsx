import React, { useEffect, useState } from 'react';

export default function Settings({ onClearHistory }) {
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  return (
    <div className="settings">
      <div className="card">
        <h3 className="card-title">Appearance</h3>
        <label className="toggle-row">
          <span>Dark mode</span>
          <input type="checkbox" checked={dark} onChange={(e) => setDark(e.target.checked)} />
        </label>
      </div>

      <div className="card">
        <h3 className="card-title">Data</h3>
        <p className="card-subtitle">
          All scans are stored only on this device, in IndexedDB. Nothing is ever
          uploaded or shared.
        </p>
        <button
          className="btn btn-danger"
          onClick={() => {
            if (confirm('Delete every scan? This cannot be undone.')) onClearHistory();
          }}
        >
          Clear all scan history
        </button>
      </div>

      <div className="card">
        <h3 className="card-title">About</h3>
        <p className="card-subtitle">
          DR Monster runs a ConvNeXt-Tiny model fully on-device using CPU inference.
          No internet connection is required or used.
        </p>
      </div>
    </div>
  );
}
