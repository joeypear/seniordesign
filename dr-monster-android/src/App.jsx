import React, { useCallback, useEffect, useState } from 'react';
import Header from './components/Header.jsx';
import BottomNav from './components/BottomNav.jsx';
import ImagePicker from './components/ImagePicker.jsx';
import ScanPreview from './components/ScanPreview.jsx';
import HistoryList from './components/HistoryList.jsx';
import ScanDetail from './components/ScanDetail.jsx';
import Settings from './components/Settings.jsx';
import InfoModal from './components/InfoModal.jsx';
import { Scan } from './lib/storage.js';
import { preloadModel, runDRInference } from './lib/inference.js';

export default function App() {
  const [tab, setTab] = useState('scan');            // 'scan' | 'history' | 'account'
  const [pendingImage, setPendingImage] = useState(null); // { blob, url }
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scans, setScans] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [modelStatus, setModelStatus] = useState('loading'); // 'loading'|'ready'|'error'
  const [modelError, setModelError] = useState(null);
  const [infoModal, setInfoModal] = useState(null); // 'model'|'mission'|'contact'|null

  // Preload the ONNX model into device memory on first mount so the first
  // scan is fast. CPU WASM load is the only heavy step, done once.
  useEffect(() => {
    preloadModel()
      .then(() => setModelStatus('ready'))
      .catch((err) => {
        console.error('Model load failed', err);
        setModelError(err?.message || String(err));
        setModelStatus('error');
      });
  }, []);

  const refreshScans = useCallback(async () => {
    setScans(await Scan.list(200));
  }, []);

  useEffect(() => { refreshScans(); }, [refreshScans]);

  const handleImagePicked = (blob) => {
    const url = URL.createObjectURL(blob);
    setPendingImage({ blob, url });
  };

  const handleCancelPreview = () => {
    if (pendingImage?.url) URL.revokeObjectURL(pendingImage.url);
    setPendingImage(null);
  };

  const handleAnalyze = async (name, notes) => {
    if (!pendingImage) return;
    setIsAnalyzing(true);
    let result = 'pending';
    let confidence = null;
    let ai_message = null;
    try {
      const r = await runDRInference(pendingImage.blob);
      result = r.result;
      confidence = r.confidence;
      ai_message = r.message;
    } catch (err) {
      console.error('Inference failed', err);
    }
    await Scan.create({
      name: name || null,
      image_blob: pendingImage.blob,
      result,
      confidence,
      ai_message,
      notes: notes || null,
    });
    setIsAnalyzing(false);
    handleCancelPreview();
    await refreshScans();
    setTab('history');
  };

  const handleDelete = async (id) => {
    await Scan.delete(id);
    if (selectedId === id) setSelectedId(null);
    await refreshScans();
  };

  const handleRename = async (id, name) => {
    await Scan.update(id, { name });
    await refreshScans();
  };

  const handleUpdateNotes = async (id, notes) => {
    await Scan.update(id, { notes });
    await refreshScans();
  };

  // Detail view is a full-screen overlay within the current tab.
  if (selectedId) {
    const scan = scans.find((s) => s.id === selectedId);
    return (
      <ScanDetail
        scan={scan}
        onBack={() => setSelectedId(null)}
        onDelete={handleDelete}
        onRename={handleRename}
        onUpdateNotes={handleUpdateNotes}
      />
    );
  }

  const showFullHeader = tab === 'scan' && !pendingImage;

  return (
    <div className="app-root">
      <Header compact={!showFullHeader} />

      <main className="app-main">
        {pendingImage ? (
          <ScanPreview
            imageUrl={pendingImage.url}
            isAnalyzing={isAnalyzing}
            modelStatus={modelStatus}
            onCancel={handleCancelPreview}
            onAnalyze={handleAnalyze}
          />
        ) : tab === 'scan' ? (
          <div className="card">
            <h2 className="card-title">New scan</h2>
            <p className="card-subtitle">
              Capture or upload a fundus image to screen for diabetic retinopathy.
              Analysis runs entirely on this device.
            </p>
            <ImagePicker onPicked={handleImagePicked} disabled={modelStatus !== 'ready'} />
            <div className="model-status">
              {modelStatus === 'loading' && <span className="dot dot-loading" />}
              {modelStatus === 'ready'   && <span className="dot dot-ready" />}
              {modelStatus === 'error'   && <span className="dot dot-error" />}
              <span>
                {modelStatus === 'loading' && 'Loading model into memory…'}
                {modelStatus === 'ready'   && 'On-device model ready (CPU)'}
                {modelStatus === 'error'   && `Model failed to load: ${modelError}`}
              </span>
            </div>
          </div>
        ) : tab === 'history' ? (
          <div>
            <h2 className="page-title">Scan history</h2>
            <HistoryList
              scans={scans}
              onOpen={(s) => setSelectedId(s.id)}
              onDelete={handleDelete}
              onRename={handleRename}
            />
          </div>
        ) : (
          <div>
            <h2 className="page-title">Account settings</h2>
            <Settings onClearHistory={async () => { await Scan.clear(); await refreshScans(); }} />
          </div>
        )}

        <footer className="app-footer">
          <p className="footer-disclaimer">
            Not a medical device. For screening and educational use only.
          </p>
          <div className="footer-links">
            <button className="link-btn" onClick={() => setInfoModal('model')}>Model</button>
            <span className="dot-sep">•</span>
            <button className="link-btn" onClick={() => setInfoModal('mission')}>Mission</button>
            <span className="dot-sep">•</span>
            <button className="link-btn" onClick={() => setInfoModal('contact')}>Contact</button>
          </div>
        </footer>
      </main>

      {!pendingImage && <BottomNav active={tab} onChange={setTab} />}

      {infoModal && (
        <InfoModal type={infoModal} onClose={() => setInfoModal(null)} />
      )}
    </div>
  );
}
