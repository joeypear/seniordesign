import React, { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Cropper from 'react-easy-crop';
import { Button } from '@/components/ui/button';
import { Crop, Check, X } from 'lucide-react';

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

export default function ImageCropper({ imageUrl, onCropDone, onSkip }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropComplete = useCallback((_, pixels) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleConfirm = async () => {
    setIsProcessing(true);
    const file = await getCroppedImg(imageUrl, croppedAreaPixels);
    onCropDone(file);
  };

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#000', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(0,0,0,0.8)' }}>
        <Crop style={{ color: 'white', width: 18, height: 18 }} />
        <span style={{ color: 'white', fontWeight: 600, fontSize: 16 }}>Crop Image</span>
        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginLeft: 4 }}>Drag to reposition</span>
      </div>

      {/* Cropper */}
      <div style={{ flex: 1, position: 'relative' }}>
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

      {/* Zoom slider */}
      <div style={{ padding: '12px 24px', background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>Zoom</span>
        <input
          type="range"
          min={1}
          max={3}
          step={0.05}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          style={{ flex: 1, accentColor: '#FF6B6B' }}
        />
      </div>

      {/* Buttons */}
      <div style={{ padding: '16px 24px 40px', background: 'rgba(0,0,0,0.8)', display: 'flex', gap: 12 }}>
        <Button
          onClick={onSkip}
          variant="outline"
          style={{ flex: 1, background: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.2)', color: 'white' }}
        >
          <X style={{ width: 16, height: 16, marginRight: 6 }} />
          Skip
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={isProcessing}
          style={{ flex: 2, background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)', color: 'white' }}
        >
          {isProcessing ? (
            <div style={{ width: 16, height: 16, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginRight: 8 }} />
          ) : (
            <Check style={{ width: 16, height: 16, marginRight: 6 }} />
          )}
          {isProcessing ? 'Processing...' : 'Use Crop'}
        </Button>
      </div>
    </div>,
    document.body
  );
}