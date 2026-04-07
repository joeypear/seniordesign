import React, { useEffect, useMemo, useState } from 'react';

const resultMeta = {
  normal:    { label: 'Normal',       tone: 'tone-normal' },
  abnormal:  { label: 'Abnormal',     tone: 'tone-abnormal' },
  no_result: { label: 'Inconclusive', tone: 'tone-inconclusive' },
  pending:   { label: 'Pending',      tone: 'tone-pending' },
};

export default function HistoryList({ scans, onOpen, onDelete, onRename }) {
  if (!scans.length) {
    return (
      <div className="empty">
        <p>No scans yet.</p>
        <p className="empty-sub">Captured scans appear here, stored only on this device.</p>
      </div>
    );
  }
  return (
    <ul className="history-list">
      {scans.map((s) => (
        <HistoryRow key={s.id} scan={s} onOpen={onOpen} onDelete={onDelete} onRename={onRename} />
      ))}
    </ul>
  );
}

function HistoryRow({ scan, onOpen, onDelete, onRename }) {
  const [url, setUrl] = useState(null);

  useEffect(() => {
    if (scan.image_blob instanceof Blob) {
      const u = URL.createObjectURL(scan.image_blob);
      setUrl(u);
      return () => URL.revokeObjectURL(u);
    }
    return undefined;
  }, [scan.image_blob]);

  const meta = resultMeta[scan.result] || resultMeta.pending;
  const title = scan.name || defaultTitle(scan);
  const dateStr = useMemo(
    () => new Date(scan.created_date).toLocaleString(),
    [scan.created_date]
  );

  return (
    <li className="history-row" onClick={() => onOpen(scan)}>
      <div className="history-thumb">
        {url ? <img src={url} alt="" /> : <div className="history-thumb-ph" />}
      </div>
      <div className="history-body">
        <div className="history-top">
          <span className="history-title">{title}</span>
          <span className={`badge ${meta.tone}`}>{meta.label}</span>
        </div>
        <div className="history-sub">
          {scan.confidence != null && (
            <span>{scan.confidence.toFixed(1)}% confidence</span>
          )}
          <span>{dateStr}</span>
        </div>
      </div>
      <button
        className="icon-btn"
        aria-label="Delete scan"
        onClick={(e) => {
          e.stopPropagation();
          if (confirm('Delete this scan?')) onDelete(scan.id);
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
        </svg>
      </button>
    </li>
  );
}

function defaultTitle(scan) {
  const d = new Date(scan.created_date);
  return `Scan — ${d.toLocaleDateString()}`;
}
