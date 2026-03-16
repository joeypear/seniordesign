import React, { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Cropper from 'react-easy-crop';
import { Button } from '@/components/ui/button';
import { Check, ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';

function getCroppedImg(imageSrc, pixelCrop) {
  return new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = pixelCrop.width;
      canvas.height = pixelCrop.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(
        image,
        pixelCrop.x, pixelCrop.y,
        pixelCrop.width, pixelCrop.height,
        0, 0,
        pixelCrop.width, pixelCrop.height
      );
      canvas.toBlob((blob) => {
        const file = new File([blob], 'cropped.jpg', { type: 'image/jpeg' });
        resolve(file);
      }, 'image/jpeg', 0.95);
    };
    image.src = imageSrc;
  });
}

export default function ImageCropper({ imageUrl, onCropDone, onCancel, showBackArrow = false }) {
  const { t } = useLanguage();
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropComplete = useCallback((_, pixels) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    setIsProcessing(true);
    const file = await getCroppedImg(imageUrl, croppedAreaPixels);
    onCropDone(file);
  };

  const isDark = document.documentElement.classList.contains('dark');

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 sm:rounded-2xl shadow-2xl w-full sm:max-w-md overflow-hidden flex flex-col"
        style={{ height: '100dvh' }}
      >
        <style>{`@media (min-width: 640px) { .cropper-wrapper { height: 100dvh !important; } }`}</style>
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
          {showBackArrow ? (
            <button
              onClick={onCancel}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
          ) : (
            <Crop className="w-5 h-5 text-foreground" />
          )}
          <span className="font-semibold text-foreground">{t('cropImage')}</span>
          {!showBackArrow && <span className="text-sm text-muted-foreground ml-1">{t('dragToReposition')}</span>}
        </div>

        {/* Cropper */}
        <div className="relative w-full flex-1">
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            aspect={1}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        {/* Zoom slider + Buttons */}
        <div className="flex flex-col items-center gap-3 px-6 py-5 border-t border-border">
          <div className="flex items-center gap-3 w-full max-w-xs">
            <span className="text-xs text-muted-foreground whitespace-nowrap">{t('zoom')}</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 accent-rose-500"
            />
          </div>
          <div className="flex gap-3 w-full max-w-xs">
            <Button
              onClick={onCancel}
              variant="outline"
              className="flex-1"
            >
              <X className="w-4 h-4 mr-1" />
              {t('cancel')}
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isProcessing}
              className="flex-[2] text-white"
              style={{ background: 'linear-gradient(to right, #f43f5e, #fb923c)' }}
            >
              {isProcessing ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Check className="w-4 h-4 mr-1" />
              )}
              {isProcessing ? t('processing') : t('useCrop')}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}