"use client";

import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Custom hook for Camera and Media Capture APIs
 * Take photos, scan documents, and record video
 */
export function useMediaCapture() {
  const [isSupported, setIsSupported] = useState(false);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);

  useEffect(() => {
    setIsSupported(
      typeof navigator !== "undefined" &&
      "mediaDevices" in navigator &&
      "getUserMedia" in navigator.mediaDevices
    );

    // Cleanup stream on unmount
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  /**
   * Capture photo using device camera
   * @param {Object} options - Capture options
   * @param {string} [options.facingMode='environment'] - 'user' for selfie, 'environment' for back camera
   * @param {number} [options.width] - Ideal width
   * @param {number} [options.height] - Ideal height
   */
  const capturePhoto = async (options = {}) => {
    if (!isSupported) {
      // Fallback to file input
      return new Promise((resolve) => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.capture = options.facingMode === "user" ? "user" : "environment";

        input.onchange = async (e) => {
          const file = e.target.files[0];
          if (file) {
            resolve({ success: true, file, method: "fallback" });
          } else {
            resolve({ success: false, cancelled: true });
          }
        };

        input.click();
      });
    }

    try {
      const constraints = {
        video: {
          facingMode: options.facingMode || "environment",
          width: options.width ? { ideal: options.width } : undefined,
          height: options.height ? { ideal: options.height } : undefined,
        },
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);

      // Return stream for display in video element
      return {
        success: true,
        stream: mediaStream,
        method: "native",
      };
    } catch (err) {
      const errorMessage = {
        NotAllowedError: "Camera permission denied",
        NotFoundError: "No camera found on device",
        NotReadableError: "Camera is already in use",
        OverconstrainedError: "Camera doesn't support requested constraints",
      }[err.name] || err.message;

      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  /**
   * Take a snapshot from active camera stream
   * @param {HTMLVideoElement} videoElement - Video element showing camera stream
   */
  const takeSnapshot = useCallback((videoElement) => {
    if (!videoElement) {
      return { success: false, error: "No video element provided" };
    }

    try {
      const canvas = document.createElement("canvas");
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(videoElement, 0, 0);

      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          const file = new File([blob], `photo-${Date.now()}.jpg`, {
            type: "image/jpeg",
          });
          resolve({ success: true, file, blob });
        }, "image/jpeg", 0.95);
      });
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, []);

  /**
   * Stop camera stream
   */
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  /**
   * Quick capture - opens camera and returns photo in one call
   * Uses fallback file input if camera API not available
   */
  const quickCapture = async (options = {}) => {
    // For quick capture, use file input with camera capture
    return new Promise((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.capture = options.facingMode === "user" ? "user" : "environment";

      let resolved = false;

      input.onchange = async (e) => {
        if (resolved) return;
        resolved = true;

        const file = e.target.files[0];
        if (file) {
          resolve({ success: true, file });
        } else {
          resolve({ success: false, cancelled: true });
        }
      };

      // Handle cancellation - fires when user closes picker without selecting
      input.oncancel = () => {
        if (resolved) return;
        resolved = true;
        resolve({ success: false, cancelled: true });
      };

      // Handle blur/focus changes that indicate cancellation
      const handleFocus = () => {
        // Wait a bit to see if onChange fires
        setTimeout(() => {
          if (!resolved) {
            resolved = true;
            resolve({ success: false, cancelled: true });
          }
          window.removeEventListener("focus", handleFocus);
        }, 500);
      };

      window.addEventListener("focus", handleFocus);

      input.click();
    });
  };

  /**
   * Scan document (optimized for document photography)
   */
  const scanDocument = async () => {
    return quickCapture({ facingMode: "environment" });
  };

  /**
   * Get available camera devices
   */
  const getCameraDevices = async () => {
    if (!isSupported) {
      return [];
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter(device => device.kind === "videoinput");
    } catch (err) {
      console.error("Failed to enumerate devices:", err);
      return [];
    }
  };

  return {
    capturePhoto,
    takeSnapshot,
    stopCamera,
    quickCapture,
    scanDocument,
    getCameraDevices,
    stream,
    error,
    isSupported,
  };
}
