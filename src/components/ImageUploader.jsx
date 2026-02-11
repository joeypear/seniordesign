import React, { useRef } from 'react';
import { Camera, Upload, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';

export default function ImageUploader({ onImageUploaded, isUploading, setIsUploading }) {
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    onImageUploaded(file_url);
    setIsUploading(false);
  };

  return (
    <div className="space-y-4">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/jpg,image/png,image/webp,image/bmp"
        className="hidden"
      />
      <input
        type="file"
        ref={cameraInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/jpg,image/png,image/webp,image/bmp"
        capture
        className="hidden"
      />

      <div className="grid grid-cols-2 gap-4">
        <Button
          onClick={() => cameraInputRef.current?.click()}
          disabled={isUploading}
          className="h-32 flex-col gap-3 bg-gradient-to-br from-coral-500 to-orange-500 hover:from-coral-600 hover:to-orange-600 text-white rounded-2xl shadow-lg shadow-orange-200 dark:shadow-orange-900/50 transition-all hover:scale-[1.02] hover:shadow-xl dark:hover:shadow-orange-900/70"
          style={{ background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)' }}
        >
          <Camera className="w-8 h-8" />
          <span className="font-medium">Take Photo</span>
        </Button>

        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="h-32 flex-col gap-3 bg-gradient-to-br from-teal-400 to-emerald-500 hover:from-teal-500 hover:to-emerald-600 text-white rounded-2xl shadow-lg shadow-teal-200 dark:shadow-teal-900/50 transition-all hover:scale-[1.02] hover:shadow-xl dark:hover:shadow-teal-900/70"
        >
          <Upload className="w-8 h-8" />
          <span className="font-medium">Upload Image</span>
        </Button>
      </div>

      {isUploading && (
        <div className="flex items-center justify-center gap-3 py-4 text-gray-500 dark:text-gray-400">
          <div className="w-5 h-5 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
          <span>Uploading image...</span>
        </div>
      )}

      <p className="text-xs text-center text-gray-400 dark:text-gray-500">
        Accepted formats: JPEG, PNG, WebP, BMP
      </p>
    </div>
  );
}