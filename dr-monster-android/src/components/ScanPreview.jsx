import React, { useState } from 'react';

export default function ScanPreview({ imageUrl, isAnalyzing, modelStatus, onCancel, onAnalyze }) {
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');

  const canAnalyze = !isAnalyzing && modelStatus === 'ready';

  return (
    <div className="card preview">
      <h2 className="card-title">Review image</h2>
      <p className="card-subtitle">
        Check framing, then run on-device analysis. Nothing is uploaded.
      </p>

      <div className="preview-img-wrap">
        <img src={imageUrl} alt="selected fundus" className="preview-img" />
      </div>

      <label className="field">
        <span>Scan name (optional)</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Left eye — 2026-04-07"
          disabled={isAnalyzing}
        />
      </label>

      <label className="field">
        <span>Notes (optional)</span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Context, symptoms, etc."
          disabled={isAnalyzing}
        />
      </label>

      <div className="preview-actions">
        <button className="btn btn-ghost" onClick={onCancel} disabled={isAnalyzing}>
          Cancel
        </button>
        <button
          className="btn btn-primary"
          onClick={() => onAnalyze(name.trim(), notes.trim())}
          disabled={!canAnalyze}
        >
          {isAnalyzing ? (
            <>
              <Spinner /> Analyzing…
            </>
          ) : modelStatus !== 'ready' ? (
            'Loading model…'
          ) : (
            'Analyze'
          )}
        </button>
      </div>
    </div>
  );
}

function Spinner() {
  return <span className="spinner" aria-hidden="true" />;
}
