import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Camera, Upload, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import VideoFrameSelector from './VideoFrameSelector';
import ImageCropper from './ImageCropper';

export default function ImageUploader({ onImageUploaded, isUploading, setIsUploading }) {
  const fileInputRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const liveVideoRef = useRef(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showLivePreview, setShowLivePreview] = useState(false);
  const [pendingImageUrl, setPendingImageUrl] = useState(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith('video/')) {
      setSelectedVideo(file);
      return;
    }

    setIsUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setPendingImageUrl(file_url);
    setIsUploading(false);
  };

  const handleOpenCamera = async () => {
    const constraints = {
      video: {
        width: { min: 1280, ideal: 3840, max: 3840 },
        height: { min: 720, ideal: 2160, max: 2160 },
        frameRate: { ideal: 30, max: 60 },
        facingMode: { ideal: 'environment' }
      },
      audio: false
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    mediaStreamRef.current = stream;
    setShowLivePreview(true);

    // Attach stream to live preview video element
    setTimeout(() => {
      if (liveVideoRef.current) {
        liveVideoRef.current.srcObject = stream;
        liveVideoRef.current.play();
      }
    }, 50);
  };

  const handleStartRecording = () => {
    if (!mediaStreamRef.current) return;
    recordedChunksRef.current = [];
    const mimeType = MediaRecorder.isTypeSupported('video/mp4') ? 'video/mp4' : 'video/webm';
    const recorder = new MediaRecorder(mediaStreamRef.current, { mimeType });
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const mimeUsed = recorder.mimeType || 'video/webm';
      const ext = mimeUsed.includes('mp4') ? 'mp4' : 'webm';
      const blob = new Blob(recordedChunksRef.current, { type: mimeUsed });
      const file = new File([blob], `recording.${ext}`, { type: mimeUsed });
      mediaStreamRef.current?.getTracks().forEach(t => t.stop());
      setIsRecording(false);
      setShowLivePreview(false);
      setSelectedVideo(file);
    };

    recorder.start();
    setIsRecording(true);
  };

  const handleStopRecording = () => {
    mediaRecorderRef.current?.stop();
  };

  const handleCancelCamera = () => {
    mediaStreamRef.current?.getTracks().forEach(t => t.stop());
    setShowLivePreview(false);
    setIsRecording(false);
  };

  const handleFrameSelected = async (frameFile) => {
    setIsUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file: frameFile });
    setSelectedVideo(null);
    setPendingImageUrl(file_url);
    setIsUploading(false);
  };

  const handleCropDone = async (croppedFile) => {
    setIsUploading(true);
    setPendingImageUrl(null);
    const { file_url } = await base44.integrations.Core.UploadFile({ file: croppedFile });
    onImageUploaded(file_url);
    setIsUploading(false);
  };

  const handleCropSkip = () => {
    const url = pendingImageUrl;
    setPendingImageUrl(null);
    onImageUploaded(url);
  };

  const handleCancelVideo = () => {
    setSelectedVideo(null);
  };

  if (selectedVideo) {
    return (
      <VideoFrameSelector
        videoFile={selectedVideo}
        onFrameSelected={handleFrameSelected}
        onCancel={handleCancelVideo}
      />
    );
  }

  const livePreviewPortal = showLivePreview && createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'black', display: 'flex', flexDirection: 'column' }}>
      <video
        ref={liveVideoRef}
        autoPlay
        playsInline
        muted
        style={{ flex: 1, width: '100%', objectFit: 'cover' }}
      />
      {isRecording && (
        <div style={{ position: 'absolute', top: 16, left: 16, display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(0,0,0,0.5)', borderRadius: 999, padding: '4px 12px' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', animation: 'pulse 1s infinite' }} />
          <span style={{ color: 'white', fontSize: 12, fontWeight: 500 }}>Recording</span>
        </div>
      )}
      <div style={{ position: 'absolute', bottom: 40, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 16, padding: '0 24px' }}>
        <Button
          onClick={handleCancelCamera}
          variant="outline"
          style={{ background: 'rgba(0,0,0,0.5)', borderColor: 'rgba(255,255,255,0.3)', color: 'white' }}
        >
          Cancel
        </Button>
        <Button
          onClick={isRecording ? handleStopRecording : handleStartRecording}
          style={{ background: isRecording ? 'linear-gradient(135deg, #e53e3e 0%, #c53030 100%)' : 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)', color: 'white', padding: '0 32px' }}
        >
          <Video style={{ width: 16, height: 16, marginRight: 8 }} />
          {isRecording ? 'Stop Recording' : 'Start Recording'}
        </Button>
      </div>
    </div>,
    document.body
  );

  if (showLivePreview) {
    return <>{livePreviewPortal}</>;
  }

  return (
    <div className="space-y-4">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/jpg,image/png,image/webp,image/bmp,video/mp4,video/quicktime,video/x-msvideo,video/webm"
        className="hidden"
      />

      <div className="grid grid-cols-2 gap-4">
        <Button
          onClick={handleOpenCamera}
          disabled={isUploading}
          className="h-32 flex-col gap-3 text-white rounded-2xl shadow-lg shadow-orange-200 dark:shadow-orange-900/50 transition-all hover:scale-[1.02] hover:shadow-xl dark:hover:shadow-orange-900/70"
          style={{ background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)' }}
        >
          <Video className="w-8 h-8" />
          <span className="font-medium">Use Camera</span>
        </Button>

        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="h-32 flex-col gap-3 bg-gradient-to-br from-teal-400 to-emerald-500 hover:from-teal-500 hover:to-emerald-600 text-white rounded-2xl shadow-lg shadow-teal-200 dark:shadow-teal-900/50 transition-all hover:scale-[1.02] hover:shadow-xl dark:hover:shadow-teal-900/70"
        >
          <Upload className="w-8 h-8" />
          <span className="font-medium">Upload File</span>
        </Button>
      </div>

      {isUploading && (
        <div className="flex items-center justify-center gap-3 py-4 text-gray-500 dark:text-gray-400">
          <div className="w-5 h-5 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
          <span>Uploading image...</span>
        </div>
      )}

      <p className="text-xs text-center text-gray-400 dark:text-gray-500">
        Upload images or videos to select a clear frame for analysis
      </p>
    </div>
  );
}