package com.drmonster.app;

import android.Manifest;
import android.graphics.Color;
import android.util.Log;
import android.view.Surface;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewGroup.LayoutParams;

import androidx.annotation.NonNull;
import androidx.camera.core.Camera;
import androidx.camera.core.CameraInfo;
import androidx.camera.core.CameraSelector;
import androidx.camera.core.ExposureState;
import androidx.camera.core.FocusMeteringAction;
import androidx.camera.core.MeteringPoint;
import androidx.camera.core.Preview;
import androidx.camera.core.ZoomState;
import androidx.camera.lifecycle.ProcessCameraProvider;
import androidx.camera.video.FallbackStrategy;
import androidx.camera.video.FileOutputOptions;
import androidx.camera.video.Quality;
import androidx.camera.video.QualitySelector;
import androidx.camera.video.Recorder;
import androidx.camera.video.Recording;
import androidx.camera.video.VideoCapture;
import androidx.camera.video.VideoRecordEvent;
import androidx.camera.view.PreviewView;
import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import com.google.common.util.concurrent.ListenableFuture;

import java.io.File;
import java.util.concurrent.ExecutionException;

@CapacitorPlugin(
    name = "CameraPreview",
    permissions = {
        @Permission(alias = "camera", strings = {Manifest.permission.CAMERA})
    }
)
public class CameraPreviewPlugin extends Plugin {
    private static final String TAG = "CameraPreviewPlugin";

    private PreviewView previewView;
    private ProcessCameraProvider cameraProvider;
    private Camera camera;
    private Preview preview;
    private VideoCapture<Recorder> videoCapture;
    private Recording activeRecording;
    private PluginCall pendingStopCall;
    private int currentLensFacing = CameraSelector.LENS_FACING_BACK;
    private boolean webViewBgOverridden = false;
    // Saved backgrounds of the WebView's ancestor chain so stop() can restore them.
    private java.util.List<android.graphics.drawable.Drawable> savedAncestorBgs;
    private java.util.List<ViewGroup> savedAncestors;
    // Saved window background drawable so stop() can restore the Activity theme.
    private android.graphics.drawable.Drawable savedWindowBg;
    private boolean windowBgOverridden = false;

    // ───────────────────────── start / stop ──────────────────────────────
    @PluginMethod
    public void start(final PluginCall call) {
        if (getPermissionState("camera") != PermissionState.GRANTED) {
            requestPermissionForAlias("camera", call, "cameraPermsCallback");
            return;
        }
        doStart(call);
    }

    @PermissionCallback
    private void cameraPermsCallback(PluginCall call) {
        if (getPermissionState("camera") == PermissionState.GRANTED) {
            doStart(call);
        } else {
            call.reject("Camera permission denied");
        }
    }

    private void doStart(final PluginCall call) {
        String facing = call.getString("lensFacing", "back");
        currentLensFacing = "front".equalsIgnoreCase(facing)
            ? CameraSelector.LENS_FACING_FRONT
            : CameraSelector.LENS_FACING_BACK;

        getActivity().runOnUiThread(() -> {
            try {
                ListenableFuture<ProcessCameraProvider> providerFuture =
                    ProcessCameraProvider.getInstance(getContext());
                providerFuture.addListener(() -> {
                    try {
                        cameraProvider = providerFuture.get();
                        bindUseCases();
                        call.resolve(buildCapabilities());
                    } catch (ExecutionException | InterruptedException e) {
                        Log.e(TAG, "Failed to get camera provider", e);
                        call.reject("Failed to get camera provider: " + e.getMessage());
                    } catch (Exception e) {
                        Log.e(TAG, "Failed to bind camera", e);
                        call.reject("Failed to bind camera: " + e.getMessage());
                    }
                }, ContextCompat.getMainExecutor(getContext()));
            } catch (Exception e) {
                Log.e(TAG, "start() threw", e);
                call.reject("start() threw: " + e.getMessage());
            }
        });
    }

    private void bindUseCases() {
        if (cameraProvider == null) return;

        // Build / rebuild the PreviewView and attach it beneath the WebView.
        // COMPATIBLE mode uses a TextureView (regular view, composited in the
        // view tree) instead of a SurfaceView (separate sub-surface that needs
        // punch-through). TextureView plays nicely with a transparent WebView
        // on top of it without needing the whole window to be transparent.
        if (previewView == null) {
            previewView = new PreviewView(getContext());
            previewView.setImplementationMode(PreviewView.ImplementationMode.COMPATIBLE);
            previewView.setScaleType(PreviewView.ScaleType.FILL_CENTER);
            // Black background behind the preview until the camera starts
            // painting. Transparent would show the WebView controls against
            // whatever is behind; black matches the native camera UX.
            previewView.setBackgroundColor(Color.BLACK);
            // Attach to the Activity's top-level content FrameLayout
            // (android.R.id.content) rather than the WebView's immediate parent,
            // which is a CoordinatorLayout — CoordinatorLayout's Behavior logic
            // can mis-size/offset children that don't use its own LayoutParams.
            // The content FrameLayout has predictable FrameLayout semantics:
            // index 0 = drawn first (behind CoordinatorLayout + WebView).
            ViewGroup parent = (ViewGroup) getActivity().findViewById(android.R.id.content);
            if (parent == null) {
                parent = (ViewGroup) bridge.getWebView().getParent();
            }
            if (parent != null) {
                parent.addView(previewView, 0,
                    new LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT));
                Log.d(TAG, "PreviewView attached to parent: " + parent.getClass().getSimpleName()
                    + ", parent children=" + parent.getChildCount()
                    + ", LP=" + previewView.getLayoutParams().getClass().getName());

                // Log actual bounds once layout completes so we can tell if
                // the CoordinatorLayout gave it a real size or 0×0.
                final PreviewView pv = previewView;
                pv.getViewTreeObserver().addOnGlobalLayoutListener(
                    new android.view.ViewTreeObserver.OnGlobalLayoutListener() {
                        @Override
                        public void onGlobalLayout() {
                            Log.d(TAG, "PreviewView post-layout: "
                                + pv.getWidth() + "x" + pv.getHeight()
                                + " visibility=" + pv.getVisibility()
                                + " alpha=" + pv.getAlpha()
                                + " isAttached=" + pv.isAttachedToWindow());
                            try { pv.getViewTreeObserver().removeOnGlobalLayoutListener(this); } catch (Exception ignore) {}
                        }
                    });
            } else {
                Log.e(TAG, "WebView has no parent — cannot attach PreviewView");
            }
        }

        // Make WebView and every ancestor up to the DecorView transparent so
        // nothing paints over the PreviewView. Save their previous backgrounds
        // so stop() can restore them.
        if (!webViewBgOverridden) {
            // Some OEM WebViews keep a pre-existing Drawable background and
            // setBackgroundColor alone won't erase it — call setBackground(null)
            // first, then apply the transparent color.
            bridge.getWebView().setBackground(null);
            bridge.getWebView().setBackgroundColor(Color.TRANSPARENT);
            savedAncestors = new java.util.ArrayList<>();
            savedAncestorBgs = new java.util.ArrayList<>();
            android.view.ViewParent vp = bridge.getWebView().getParent();
            int depth = 0;
            // Walk up the view tree setting every ancestor ViewGroup background
            // to null. We stop as soon as we hit a non-View ViewParent (i.e.
            // ViewRootImpl above DecorView) — casting that to View would throw
            // ClassCastException and kill bindUseCases().
            while (vp instanceof ViewGroup && depth < 8) {
                ViewGroup vg = (ViewGroup) vp;
                savedAncestors.add(vg);
                savedAncestorBgs.add(vg.getBackground());
                vg.setBackground(null);
                vp = vg.getParent();
                depth++;
            }
            webViewBgOverridden = true;
        }

        // Clear the Activity's window background (the theme's windowBackground
        // drawable — in AppTheme.NoActionBar inheriting DayNight this is dark
        // navy in dark mode and was painting over the PreviewView). Save it so
        // stop() can restore the theme background exactly.
        if (!windowBgOverridden) {
            try {
                savedWindowBg = getActivity().getWindow().getDecorView().getBackground();
                getActivity().getWindow().setBackgroundDrawable(
                    new android.graphics.drawable.ColorDrawable(Color.TRANSPARENT));
                windowBgOverridden = true;
            } catch (Exception e) {
                Log.w(TAG, "Could not clear window background", e);
            }
        }

        preview = new Preview.Builder().build();
        preview.setSurfaceProvider(previewView.getSurfaceProvider());

        // Prefer 4K/UHD, falling back through FHD → HD → SD if the device
        // or selected lens can't deliver it. fromOrderedList walks the list
        // top-to-bottom and uses the first supported Quality; the
        // FallbackStrategy only kicks in if none of the listed qualities
        // are supported on this camera.
        //
        // Bitrate: 45 Mbps. CameraX's default for UHD is a conservative
        // ~20 Mbps which leaves visible compression artifacts on fine details
        // (e.g. retinal vessels); 45 Mbps matches what the stock Android
        // camera app uses for 4K and sits in the sweet spot where perceptual
        // quality has plateaued — tested 60 Mbps, no meaningful improvement
        // over 45 and file sizes were ~33% larger. The Finalize callback
        // below logs the achieved bitrate if we ever want to re-tune.
        Recorder recorder = new Recorder.Builder()
            .setQualitySelector(QualitySelector.fromOrderedList(
                java.util.Arrays.asList(
                    Quality.UHD, Quality.FHD, Quality.HD, Quality.SD),
                FallbackStrategy.higherQualityOrLowerThan(Quality.HD)))
            .setTargetVideoEncodingBitRate(45_000_000)
            .build();
        videoCapture = VideoCapture.withOutput(recorder);

        CameraSelector selector = new CameraSelector.Builder()
            .requireLensFacing(currentLensFacing)
            .build();

        cameraProvider.unbindAll();
        camera = cameraProvider.bindToLifecycle(
            getActivity(), selector, preview, videoCapture);
    }

    private JSObject buildCapabilities() {
        JSObject out = new JSObject();
        out.put("facing", currentLensFacing == CameraSelector.LENS_FACING_FRONT ? "front" : "back");

        if (camera == null) return out;
        CameraInfo info = camera.getCameraInfo();

        JSObject zoom = new JSObject();
        ZoomState zs = info.getZoomState().getValue();
        if (zs != null) {
            zoom.put("min", zs.getMinZoomRatio());
            zoom.put("max", zs.getMaxZoomRatio());
        } else {
            zoom.put("min", 1.0f);
            zoom.put("max", 1.0f);
        }
        out.put("zoom", zoom);

        JSObject exp = new JSObject();
        ExposureState es = info.getExposureState();
        if (es != null && es.isExposureCompensationSupported()) {
            int minIdx = es.getExposureCompensationRange().getLower();
            int maxIdx = es.getExposureCompensationRange().getUpper();
            float step = es.getExposureCompensationStep().floatValue();
            exp.put("min", minIdx * step);
            exp.put("max", maxIdx * step);
            exp.put("step", step);
            exp.put("supported", true);
        } else {
            exp.put("supported", false);
            exp.put("min", 0);
            exp.put("max", 0);
            exp.put("step", 1);
        }
        out.put("exposure", exp);

        out.put("torchSupported", info.hasFlashUnit());
        return out;
    }

    @PluginMethod
    public void stop(final PluginCall call) {
        getActivity().runOnUiThread(() -> {
            try {
                if (activeRecording != null) {
                    try { activeRecording.stop(); } catch (Exception ignore) {}
                    activeRecording = null;
                }
                if (cameraProvider != null) {
                    cameraProvider.unbindAll();
                }
                if (previewView != null && previewView.getParent() != null) {
                    ((ViewGroup) previewView.getParent()).removeView(previewView);
                }
                previewView = null;
                camera = null;
                preview = null;
                videoCapture = null;

                if (webViewBgOverridden) {
                    bridge.getWebView().setBackgroundColor(Color.WHITE);
                    if (savedAncestors != null) {
                        for (int i = 0; i < savedAncestors.size(); i++) {
                            try {
                                savedAncestors.get(i).setBackground(savedAncestorBgs.get(i));
                            } catch (Exception ignore) {}
                        }
                    }
                    savedAncestors = null;
                    savedAncestorBgs = null;
                    webViewBgOverridden = false;
                }
                if (windowBgOverridden) {
                    try {
                        getActivity().getWindow().setBackgroundDrawable(savedWindowBg);
                    } catch (Exception ignore) {}
                    savedWindowBg = null;
                    windowBgOverridden = false;
                }
                call.resolve();
            } catch (Exception e) {
                Log.e(TAG, "stop() threw", e);
                call.reject("stop() threw: " + e.getMessage());
            }
        });
    }

    // ───────────────────────── recording ─────────────────────────────────
    @PluginMethod
    public void startRecording(final PluginCall call) {
        if (videoCapture == null) {
            call.reject("Camera not started");
            return;
        }
        if (activeRecording != null) {
            call.reject("Already recording");
            return;
        }
        getActivity().runOnUiThread(() -> {
            try {
                File dir = new File(getContext().getCacheDir(), "camera");
                if (!dir.exists()) dir.mkdirs();
                File out = new File(dir, "rec-" + System.currentTimeMillis() + ".mp4");
                FileOutputOptions opts = new FileOutputOptions.Builder(out).build();

                // Update target rotation so MP4 orientation metadata is correct.
                try {
                    int rot = bridge.getWebView().getDisplay() != null
                        ? bridge.getWebView().getDisplay().getRotation()
                        : Surface.ROTATION_0;
                    videoCapture.setTargetRotation(rot);
                } catch (Exception ignore) {}

                // No .withAudioEnabled() — keep the existing audio:false behavior.
                activeRecording = videoCapture.getOutput()
                    .prepareRecording(getContext(), opts)
                    .start(ContextCompat.getMainExecutor(getContext()), event -> {
                        if (event instanceof VideoRecordEvent.Finalize) {
                            VideoRecordEvent.Finalize finalize = (VideoRecordEvent.Finalize) event;
                            File finalized = out;
                            PluginCall stopCall = pendingStopCall;
                            pendingStopCall = null;
                            activeRecording = null;

                            // Compute actual achieved bitrate (bytes * 8 / seconds).
                            // CameraX clamps setTargetVideoEncodingBitRate silently to
                            // the hardware encoder's max — this log reveals what we
                            // really got vs. what we asked for (60 Mbps target).
                            long durMs = finalize.getRecordingStats().getRecordedDurationNanos() / 1_000_000L;
                            long sizeBytes = finalized.length();
                            long actualBps = durMs > 0 ? (sizeBytes * 8L * 1000L) / durMs : 0;
                            Log.d(TAG, "Recording done: size=" + sizeBytes + "B dur=" + durMs
                                + "ms actualBitrate=" + (actualBps / 1_000_000L) + "Mbps"
                                + " (target=45Mbps) path=" + finalized.getAbsolutePath());

                            if (stopCall != null) {
                                if (finalize.hasError() && !finalize.getOutputResults().getOutputUri().toString().startsWith("file://")) {
                                    stopCall.reject("Recording failed: code " + finalize.getError());
                                } else {
                                    JSObject r = new JSObject();
                                    r.put("path", finalized.getAbsolutePath());
                                    r.put("size", sizeBytes);
                                    r.put("durationMs", durMs);
                                    stopCall.resolve(r);
                                }
                            }
                        }
                    });

                JSObject started = new JSObject();
                started.put("started", true);
                call.resolve(started);
            } catch (Exception e) {
                Log.e(TAG, "startRecording() threw", e);
                call.reject("startRecording() threw: " + e.getMessage());
            }
        });
    }

    @PluginMethod
    public void stopRecording(final PluginCall call) {
        if (activeRecording == null) {
            call.reject("Not recording");
            return;
        }
        call.setKeepAlive(true);
        pendingStopCall = call;
        getActivity().runOnUiThread(() -> {
            try {
                activeRecording.stop();
            } catch (Exception e) {
                pendingStopCall = null;
                call.reject("stopRecording() threw: " + e.getMessage());
            }
        });
    }

    // ───────────────────────── controls ──────────────────────────────────
    @PluginMethod
    public void setZoom(final PluginCall call) {
        if (camera == null) { call.reject("Camera not started"); return; }
        float value = call.getFloat("value", 1f);
        ZoomState zs = camera.getCameraInfo().getZoomState().getValue();
        if (zs != null) {
            value = Math.max(zs.getMinZoomRatio(), Math.min(zs.getMaxZoomRatio(), value));
        }
        final float clamped = value;
        getActivity().runOnUiThread(() -> {
            camera.getCameraControl().setZoomRatio(clamped);
            call.resolve();
        });
    }

    @PluginMethod
    public void setExposureCompensation(final PluginCall call) {
        if (camera == null) { call.reject("Camera not started"); return; }
        float ev = call.getFloat("value", 0f);
        ExposureState es = camera.getCameraInfo().getExposureState();
        if (es == null || !es.isExposureCompensationSupported()) {
            call.resolve();
            return;
        }
        float step = es.getExposureCompensationStep().floatValue();
        int idx = step > 0 ? Math.round(ev / step) : 0;
        int minIdx = es.getExposureCompensationRange().getLower();
        int maxIdx = es.getExposureCompensationRange().getUpper();
        idx = Math.max(minIdx, Math.min(maxIdx, idx));
        final int finalIdx = idx;
        getActivity().runOnUiThread(() -> {
            camera.getCameraControl().setExposureCompensationIndex(finalIdx);
            call.resolve();
        });
    }

    @PluginMethod
    public void setTorch(final PluginCall call) {
        if (camera == null) { call.reject("Camera not started"); return; }
        boolean on = call.getBoolean("on", false);
        getActivity().runOnUiThread(() -> {
            camera.getCameraControl().enableTorch(on);
            call.resolve();
        });
    }

    @PluginMethod
    public void tapToFocus(final PluginCall call) {
        if (camera == null || previewView == null) { call.reject("Camera not started"); return; }
        float x = call.getFloat("x", 0.5f);
        float y = call.getFloat("y", 0.5f);
        getActivity().runOnUiThread(() -> {
            try {
                int w = previewView.getWidth();
                int h = previewView.getHeight();
                MeteringPoint p = previewView.getMeteringPointFactory().createPoint(x * w, y * h);
                FocusMeteringAction action = new FocusMeteringAction.Builder(p).build();
                camera.getCameraControl().startFocusAndMetering(action);
                call.resolve();
            } catch (Exception e) {
                call.reject("tapToFocus() threw: " + e.getMessage());
            }
        });
    }

    @PluginMethod
    public void flip(final PluginCall call) {
        if (cameraProvider == null) { call.reject("Camera not started"); return; }
        currentLensFacing = (currentLensFacing == CameraSelector.LENS_FACING_BACK)
            ? CameraSelector.LENS_FACING_FRONT
            : CameraSelector.LENS_FACING_BACK;
        getActivity().runOnUiThread(() -> {
            try {
                bindUseCases();
                call.resolve(buildCapabilities());
            } catch (Exception e) {
                call.reject("flip() threw: " + e.getMessage());
            }
        });
    }

    @PluginMethod
    public void getCapabilities(final PluginCall call) {
        if (camera == null) { call.reject("Camera not started"); return; }
        call.resolve(buildCapabilities());
    }

    // ───────────────────────── lifecycle ─────────────────────────────────
    @Override
    protected void handleOnDestroy() {
        super.handleOnDestroy();
        try {
            if (activeRecording != null) { activeRecording.stop(); activeRecording = null; }
            if (cameraProvider != null) { cameraProvider.unbindAll(); }
            if (previewView != null && previewView.getParent() != null) {
                ((ViewGroup) previewView.getParent()).removeView(previewView);
            }
        } catch (Exception ignore) {}
        previewView = null;
        camera = null;
        preview = null;
        videoCapture = null;
    }
}
