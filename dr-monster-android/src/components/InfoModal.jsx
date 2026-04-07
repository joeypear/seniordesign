import React from 'react';

const CONTENT = {
  model: {
    title: 'The model',
    body: (
      <>
        <p>
          DR Monster uses <strong>ConvNeXt-Tiny</strong>, a modern convolutional
          network fine-tuned on publicly available diabetic retinopathy fundus
          datasets. A single-logit head produces a probability of abnormality.
        </p>
        <p>
          Inference runs <strong>entirely on this device</strong> via the
          onnxruntime-web WASM backend in single-threaded CPU mode. Image
          preprocessing (Resize 236 → CenterCrop 224 → min-max normalize)
          mirrors the training pipeline exactly to keep the input distribution
          on-manifold.
        </p>
        <p>
          Predictions are reported as Normal (&lt;40%), Abnormal (&gt;60%), or
          Inconclusive in-between. Inconclusive results usually mean a better
          image is needed.
        </p>
      </>
    ),
  },
  mission: {
    title: 'Our mission',
    body: (
      <>
        <p>
          Make diabetic retinopathy screening accessible anywhere — including
          clinics and field sites with no reliable internet. Every inference
          happens on the phone, and no image ever leaves the device.
        </p>
        <p>
          This app is a screening aid, not a diagnostic tool. Any concerning
          result should be reviewed by a qualified clinician.
        </p>
      </>
    ),
  },
  contact: {
    title: 'Contact',
    body: (
      <>
        <p>
          This is an offline research build. For the source repository and
          questions, reach out through the channel provided by your project
          team.
        </p>
      </>
    ),
  },
};

export default function InfoModal({ type, onClose }) {
  const { title, body } = CONTENT[type] || {};
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="modal-body">{body}</div>
      </div>
    </div>
  );
}
