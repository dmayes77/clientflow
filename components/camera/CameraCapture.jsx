"use client";

import { useState, useEffect } from "react";
import { useMediaCapture } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Camera, Loader2, X, RotateCcw, Upload } from "lucide-react";
import { toast } from "sonner";

// Detect if device is mobile
const isMobileDevice = () => {
  if (typeof window === "undefined") return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  ) || window.matchMedia("(max-width: 768px) and (pointer: coarse)").matches;
};

/**
 * CameraCapture Component
 *
 * Reusable camera capture with upload functionality
 *
 * @param {Function} onCapture - Callback when photo is captured (receives File object)
 * @param {string} buttonText - Text for trigger button
 * @param {string} buttonVariant - Button variant (default, outline, ghost, etc.)
 * @param {string} facingMode - Camera facing mode: 'user' (selfie) or 'environment' (back camera)
 * @param {boolean} showPreview - Show preview dialog before confirming
 * @param {string} title - Dialog title
 * @param {string} description - Dialog description
 * @param {boolean} disabled - Disable the button
 * @param {string} className - Additional CSS classes for button
 */
export function CameraCapture({
  onCapture,
  buttonText = "Take Photo",
  buttonVariant = "outline",
  facingMode = "environment",
  showPreview = true,
  title = "Capture Photo",
  description = "Take a photo using your device camera",
  disabled = false,
  className = "",
}) {
  const { quickCapture, isSupported } = useMediaCapture();
  const [isOpen, setIsOpen] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  const handleCapture = async () => {
    if (!isSupported && !navigator.mediaDevices) {
      toast.error("Camera not available - Your device doesn't support camera capture");
      return;
    }

    setIsCapturing(true);

    try {
      console.log("[CameraCapture] Calling quickCapture...");
      const result = await quickCapture({ facingMode });
      console.log("[CameraCapture] quickCapture result:", result);

      if (result.success && result.file) {
        console.log("[CameraCapture] File captured successfully:", result.file);
        if (showPreview) {
          console.log("[CameraCapture] Showing preview...");
          // Show preview
          const reader = new FileReader();
          reader.onload = (e) => {
            console.log("[CameraCapture] FileReader loaded, setting capturedImage");
            console.log("[CameraCapture] Preview data URL length:", e.target.result?.length);
            setCapturedImage({
              file: result.file,
              preview: e.target.result,
            });
          };
          reader.onerror = (e) => {
            console.error("[CameraCapture] FileReader error:", e);
            toast.error("Failed to load image preview");
          };
          reader.readAsDataURL(result.file);
          // Keep dialog open to show preview
        } else {
          console.log("[CameraCapture] No preview, uploading directly...");
          // Direct upload without preview
          await onCapture(result.file);
          toast.success("Photo captured and uploaded successfully");
          setIsOpen(false);
        }
      } else if (result.cancelled) {
        console.log("[CameraCapture] User cancelled");
        // User cancelled, close dialog
        setIsOpen(false);
      } else {
        console.log("[CameraCapture] Capture failed:", result.error);
        toast.error(result.error || "Failed to capture photo");
        setIsOpen(false);
      }
    } catch (error) {
      console.error("[CameraCapture] Exception:", error);
      toast.error(error.message || "Failed to access camera");
      setIsOpen(false);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleConfirm = async () => {
    if (!capturedImage) return;

    console.log("[CameraCapture] Confirming upload with file:", capturedImage.file);
    setIsCapturing(true);
    try {
      await onCapture(capturedImage.file);
      console.log("[CameraCapture] Upload successful");
      toast.success("Photo uploaded successfully");
      setCapturedImage(null);
      setIsOpen(false);
    } catch (error) {
      console.error("[CameraCapture] Upload failed:", error);
      toast.error(error.message || "Failed to upload photo");
    } finally {
      setIsCapturing(false);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    if (isMobile) {
      handleCapture();
    } else {
      setIsOpen(false);
      // Small delay to allow dialog to close before opening file picker
      setTimeout(() => handleFileUpload(), 100);
    }
  };

  const handleCancel = () => {
    setCapturedImage(null);
    setIsOpen(false);
  };

  // Handle file upload for desktop
  const handleFileUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        setIsCapturing(true);
        if (showPreview) {
          // Show preview
          const reader = new FileReader();
          reader.onload = (e) => {
            setCapturedImage({
              file: file,
              preview: e.target.result,
            });
            setIsOpen(true);
          };
          reader.onerror = () => {
            toast.error("Failed to load image preview");
            setIsCapturing(false);
          };
          reader.readAsDataURL(file);
          setIsCapturing(false);
        } else {
          // Direct upload without preview
          try {
            await onCapture(file);
            toast.success("Photo uploaded successfully");
          } catch (error) {
            toast.error(error.message || "Failed to upload photo");
          } finally {
            setIsCapturing(false);
          }
        }
      }
    };
    input.click();
  };

  // Get appropriate button text and handler
  const getButtonText = () => {
    if (buttonText !== "Take Photo") return buttonText; // Use custom text if provided
    return isMobile ? "Take Photo" : "Upload Photo";
  };

  const getButtonIcon = () => {
    if (isCapturing) {
      return <Loader2 className={`w-4 h-4 ${buttonText ? "mr-2" : ""} animate-spin`} />;
    }
    return isMobile ? (
      <Camera className={`w-4 h-4 ${buttonText ? "mr-2" : ""}`} />
    ) : (
      <Upload className={`w-4 h-4 ${buttonText ? "mr-2" : ""}`} />
    );
  };

  const handleButtonClick = () => {
    if (isMobile) {
      // Mobile: Use camera capture
      setIsOpen(true);
      if (!showPreview) {
        handleCapture();
      }
    } else {
      // Desktop: Use file upload
      handleFileUpload();
    }
  };

  return (
    <>
      <Button
        variant={buttonVariant}
        onClick={handleButtonClick}
        disabled={disabled || isCapturing}
        className={className}
      >
        {getButtonIcon()}
        {getButtonText()}
      </Button>

      {showPreview && (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>{isMobile ? description : "Preview and confirm your photo"}</DialogDescription>
            </DialogHeader>

            {!capturedImage && isMobile ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <Camera className="w-16 h-16 text-muted-foreground" />
                <p className="text-sm text-muted-foreground text-center">
                  Click the button below to open your camera
                </p>
                <Button
                  onClick={handleCapture}
                  disabled={isCapturing}
                  size="lg"
                >
                  {isCapturing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Opening Camera...
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4 mr-2" />
                      Open Camera
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative w-full h-64 bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                  {capturedImage?.preview ? (
                    <img
                      src={capturedImage.preview}
                      alt="Captured"
                      className="max-w-full max-h-full object-contain"
                      onLoad={() => console.log("[CameraCapture] Image loaded successfully")}
                      onError={(e) => {
                        console.error("[CameraCapture] Image failed to load:", e);
                        toast.error("Failed to display image preview");
                      }}
                    />
                  ) : (
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  )}
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2">
                  <Button
                    variant="outline"
                    onClick={handleRetake}
                    disabled={isCapturing}
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Retake
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isCapturing}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    onClick={handleConfirm}
                    disabled={isCapturing}
                  >
                    {isCapturing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      "Confirm & Upload"
                    )}
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
