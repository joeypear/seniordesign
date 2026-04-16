package com.drmonster.app;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.provider.Settings;
import android.util.Log;
import android.webkit.ConsoleMessage;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import android.widget.Toast;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import android.content.pm.PackageManager;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebViewClient;

public class MainActivity extends BridgeActivity {
    private ValueCallback<Uri[]> filePathCallback;
    private final ActivityResultLauncher<Intent> fileChooserLauncher = registerForActivityResult(
        new ActivityResultContracts.StartActivityForResult(),
        result -> {
            if (filePathCallback == null) return;
            Uri[] results = null;
            if (result.getResultCode() == Activity.RESULT_OK && result.getData() != null) {
                Uri uri = result.getData().getData();
                if (uri != null) results = new Uri[]{uri};
            }
            filePathCallback.onReceiveValue(results);
            filePathCallback = null;
        }
    );

    // JavaScript interface — called from the Permissions setting in the app
    public class AndroidBridge {
        @JavascriptInterface
        public void requestCameraPermission() {
            runOnUiThread(() -> {
                if (ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.CAMERA)
                        == PackageManager.PERMISSION_GRANTED) {
                    Toast.makeText(MainActivity.this, "Camera permission already granted", Toast.LENGTH_SHORT).show();
                } else if (ActivityCompat.shouldShowRequestPermissionRationale(MainActivity.this, Manifest.permission.CAMERA)) {
                    ActivityCompat.requestPermissions(MainActivity.this,
                            new String[]{Manifest.permission.CAMERA}, 101);
                } else {
                    // Permission permanently denied — send user to app settings
                    Toast.makeText(MainActivity.this, "Please enable camera access in Settings", Toast.LENGTH_LONG).show();
                    Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                    intent.setData(Uri.fromParts("package", getPackageName(), null));
                    startActivity(intent);
                }
            });
        }
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Register locally-defined Capacitor plugins before super.onCreate so the
        // bridge picks them up during its own initialization.
        registerPlugin(CameraPreviewPlugin.class);

        super.onCreate(savedInstanceState);

        // Override WebViewClient to fix application/wasm MIME type for ONNX Runtime
        WebView.setWebContentsDebuggingEnabled( false);

        // Request camera permission at startup if not already granted
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(this, new String[]{Manifest.permission.CAMERA}, 100);
        }

        getBridge().getWebView().setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onConsoleMessage(ConsoleMessage msg) {
                Log.d("WebConsole", msg.sourceId() + ":" + msg.lineNumber() + " - " + msg.message());
                return true;
            }

            // Grant camera access when the WebView's getUserMedia() asks for it
            @Override
            public void onPermissionRequest(PermissionRequest request) {
                request.grant(request.getResources());
            }

            // Handle <input type="file"> — without this it silently does nothing
            @Override
            public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> callback,
                                             FileChooserParams params) {
                if (filePathCallback != null) {
                    filePathCallback.onReceiveValue(null);
                }
                filePathCallback = callback;
                Intent intent = params.createIntent();
                try {
                    fileChooserLauncher.launch(intent);
                } catch (Exception e) {
                    filePathCallback = null;
                    return false;
                }
                return true;
            }
        });

        // Expose Android bridge so JS can request permissions
        getBridge().getWebView().addJavascriptInterface(new AndroidBridge(), "AndroidBridge");

        getBridge().getWebView().setWebViewClient(new BridgeWebViewClient(getBridge()) {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                WebResourceResponse response = super.shouldInterceptRequest(view, request);
                if (response != null) {
                    String path = request.getUrl().getPath();
                    if (path != null && path.endsWith(".wasm")) {
                        response.setMimeType("application/wasm");
                    } else if (path != null && path.endsWith(".mjs")) {
                        response.setMimeType("text/javascript");
                    }
                }
                return response;
            }
        });
    }
}
