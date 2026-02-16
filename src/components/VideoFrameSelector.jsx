import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlayCircle, PauseCircle, CheckCircle } from 'lucide-react';

export default function VideoFrameSelector({ videoFile, onFrameSelected, onCancel }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (e) => {
    const newTime = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
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

  return (
    <div className="space-y-4">
      <div className="relative rounded-xl overflow-hidden bg-black">
        <video
          ref={videoRef}
          src={URL.createObjectURL(videoFile)}
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          className="w-full h-auto max-h-96"
        />
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Button
            onClick={togglePlayPause}
            variant="outline"
            size="icon"
            className="shrink-0"
          >
            {isPlaying ? (
              <PauseCircle className="w-5 h-5" />
            ) : (
              <PlayCircle className="w-5 h-5" />
            )}
          </Button>

          <input
            type="range"
            min="0"
            max={duration || 0}
            step="0.1"
            value={currentTime}
            onChange={handleSeek}
            className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-teal-500 [&::-webkit-slider-thumb]:cursor-pointer"
          />

          <span className="text-sm text-gray-500 dark:text-gray-400 shrink-0 w-16 text-right">
            {currentTime.toFixed(1)}s
          </span>
        </div>

        <p className="text-sm text-center text-gray-600 dark:text-gray-400">
          Scrub through the video and select a clear frame
        </p>

        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={onCancel}
            variant="outline"
            className="w-full"
          >
            Cancel
          </Button>
          <Button
            onClick={captureFrame}
            className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Use This Frame
          </Button>
        </div>
      </div>
    </div>
  );
}