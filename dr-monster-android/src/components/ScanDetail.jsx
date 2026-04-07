import React, { useEffect, useMemo, useState } from 'react';

const resultMeta = {
  normal:    { label: 'Normal',       tone: 'tone-normal' },
  abnormal:  { label: 'Abnormal',     tone: 'tone-abnormal' },
  no_result: { label: 'Inconclusive', tone: 'tone-inconclusive' },
  pending:   { label: 'Pending',      tone: 'tone-pending' },
};

export default function ScanDetail({ scan, onBack, onDelete, onRename, onUpdateNotes }) {
  const [url, setUrl] = useState(null);
  const [name, setName] = useState(scan?.name || '');
  const [notes, setNotes] = useState(scan?.notes || '');

  useEffect(() => {
    if (scan?.image_blob instanceof Blob) {
      const u = URL.createObjectURL(scan.image_blob);
      setUrl(u);
      return () => URL.revokeObjectURL(u);
    }
    return undefined;
  }, [scan?.image_blob]);

  useEffect(() => {
    setName(scan?.name || '');
    setNotes(scan?.notes || '');
  }, [scan?.id]);

  const meta = useMemo(() => resultMeta[scan?.result] || resultMeta.pending, [scan?.result]);

  if (!scan) {
    return (
      <div className="app-root">
        <div className="detail-header">
          <button className="icon-btn" onClick={onBack} aria-label="Back">
            <BackIcon />
          </button>
          <h2>Scan not found</h2>
        </div>
      </div>
    );
  }

  const saveName = () => {
    if (name.trim() !== (scan.name || '')) onRename(scan.id, name.trim() || null);
  };
  const saveNotes = () => {
    if (notes.trim() !== (scan.notes || '')) onUpdateNotes(scan.id, notes.trim() || null);
  };

  return (
    <div className="app-root">
      <div className="detail-header">
        <button className="icon-btn" onClick={onBack} aria-label="Back">
          <BackIcon />
        </button>
        <h2>Scan detail</h2>
        <button
          className="icon-btn"
          aria-label="Delete"
          onClick={() => {
            if (confirm('Delete this scan?')) onDelete(scan.id);
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
          </svg>
        </button>
      </div>

      <main className="app-main">
        <div className="card">
          <div className={`result-banner ${meta.tone}`}>
            <div className="result-label">{meta.label}</div>
            {scan.confidence != null && (
              <div className="result-conf">{scan.confidence.toFixed(1)}% confidence</div>
            )}
          </div>

          {url && (
            <div className="detail-img-wrap">
              <img src={url} alt="scan" className="detail-img" />
            </div>
          )}

          {scan.ai_message && (
            <p className="ai-message">{scan.ai_message}</p>
          )}

          <label className="field">
            <span>Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={saveName}
              placeholder="Untitled scan"
            />
          </label>

          <label className="field">
            <span>Notes</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={saveNotes}
              rows={4}
            />
          </label>

          <p className="meta-line">
            Captured {new Date(scan.created_date).toLocaleString()}
          </p>
        </div>
      </main>
    </div>
  );
}

function BackIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}
