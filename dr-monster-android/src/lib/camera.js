// Image acquisition helpers.
//
// Uses @capacitor/camera on device (native gallery/camera pickers) and
// falls back to a hidden <input type="file"> when running in a plain browser
// for local dev. Returns a Blob in both paths so the rest of the app is
// source-agnostic.
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

const isNative = Capacitor?.isNativePlatform?.() ?? false;

async function dataUrlToBlob(dataUrl) {
  const res = await fetch(dataUrl);
  return await res.blob();
}

async function nativePick(source) {
  const photo = await Camera.getPhoto({
    quality: 95,
    allowEditing: false,
    resultType: CameraResultType.DataUrl,
    source,
    saveToGallery: false,
    correctOrientation: true,
  });
  if (!photo?.dataUrl) throw new Error('No image returned');
  return await dataUrlToBlob(photo.dataUrl);
}

function browserPick(accept = 'image/*', capture = null) {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    if (capture) input.capture = capture;
    input.onchange = () => {
      const file = input.files?.[0];
      if (file) resolve(file);
      else reject(new Error('No file selected'));
    };
    input.click();
  });
}

export async function pickFromGallery() {
  if (isNative) return nativePick(CameraSource.Photos);
  return browserPick('image/*');
}

export async function captureFromCamera() {
  if (isNative) return nativePick(CameraSource.Camera);
  return browserPick('image/*', 'environment');
}

/** Create/revoke an object URL safely. */
export function objectUrlFor(blob) {
  return URL.createObjectURL(blob);
}
