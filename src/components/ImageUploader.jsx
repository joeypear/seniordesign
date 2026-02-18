import React, { useRef, useState } from 'react';
import { Camera, Upload, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import VideoFrameSelector from './VideoFrameSelector';

export default function ImageUploader({ onImageUploaded, isUploading, setIsUploading }) {
  const fileInputRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const liveVideoRef = useRef(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showLivePreview, setShowLivePreview] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith('video/')) {
      setSelectedVideo(file);
      return;
    }

    setIsUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    onImageUploaded(file_url);
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
    onImageUploaded(file_url);
    setIsUploading(false);
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

  if (showLivePreview) {
    return (
      <div className="space-y-4">
        <div className="relative rounded-xl overflow-hidden bg-black">
          <video
            ref={liveVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-auto max-h-96 object-cover"
          />
          {isRecording && (
            <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/50 rounded-full px-3 py-1">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-white text-xs font-medium">Recording</span>
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={handleCancelCamera}
            variant="outline"
            className="w-full"
          >
            Cancel
          </Button>
          <Button
            onClick={isRecording ? handleStopRecording : handleStartRecording}
            className="w-full text-white"
            style={{ background: isRecording ? 'linear-gradient(135deg, #e53e3e 0%, #c53030 100%)' : 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)' }}
          >
            <Video className="w-4 h-4 mr-2" />
            {isRecording ? 'Stop Recording' : 'Start Recording'}
          </Button>
        </div>
      </div>
    );
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