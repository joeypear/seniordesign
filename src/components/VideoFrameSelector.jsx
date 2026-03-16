import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { PlayCircle, PauseCircle, CheckCircle, X } from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';

export default function VideoFrameSelector({ videoFile, onFrameSelected, onCancel }) {
  const { t } = useLanguage();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [videoUrl, setVideoUrl] = useState(null);

  React.useEffect(() => {
    const url = URL.createObjectURL(videoFile);
    setVideoUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [videoFile]);

  const handleLoadedMetadata = () => {
    if (videoRef.current) setDuration(videoRef.current.duration);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
  };

  const togglePlayPause = () => {
    if (!videoRef.current) return;
    if (isPlaying) { videoRef.current.pause(); } else { videoRef.current.play(); }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e) => {
    const newTime = parseFloat(e.target.value);
    if (videoRef.current) { videoRef.current.currentTime = newTime; setCurrentTime(newTime); }
  };

  const captureFrame = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        const file = new File([blob], 'frame.jpg', { type: 'image/jpeg' });
        onFrameSelected(file);
      }, 'image/jpeg', 0.95);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm">
      <div
        className="bg-white dark:bg-gray-900 sm:rounded-2xl shadow-2xl w-full sm:max-w-md flex flex-col overflow-hidden"
        style={{ height: '100dvh' }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
          <button
            onClick={onCancel}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5 text-foreground" />
          </button>
          <span className="font-semibold text-foreground">{t('scrubVideo')}</span>
        </div>

        {/* Video */}
        <div className="flex-1 relative overflow-hidden bg-black flex items-center justify-center">
          <video
            ref={videoRef}
            src={videoUrl}
            onLoadedMetadata={handleLoadedMetadata}
            onTimeUpdate={handleTimeUpdate}
            preload="metadata"
            playsInline
            className="w-full h-full object-contain"
          />
        </div>

        <canvas ref={canvasRef} className="hidden" />

        {/* Controls */}
        <div className="flex flex-col gap-3 px-6 py-5 border-t border-border">
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlayPause}
              className="shrink-0 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              {isPlaying ? <PauseCircle className="w-8 h-8" /> : <PlayCircle className="w-8 h-8" />}
            </button>
            <input
              type="range"
              min="0"
              max={duration || 0}
              step="0.1"
              value={currentTime}
              onChange={handleSeek}
              className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-teal-500"
            />
            <span className="text-sm text-gray-500 dark:text-gray-400 shrink-0 w-12 text-right">
              {currentTime.toFixed(1)}s
            </span>
          </div>

          <Button
            onClick={captureFrame}
            className="w-full h-14 text-lg font-semibold rounded-xl text-white shadow-lg transition-all hover:scale-[1.01]"
            style={{ background: 'linear-gradient(to right, #14b8a6, #22c55e)' }}
          >
            <CheckCircle className="w-5 h-5 mr-2" />
            {t('useThisFrame')}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}