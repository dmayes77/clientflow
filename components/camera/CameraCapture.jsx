"use client";

import { useState } from "react";
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
import { Camera, Loader2, X, RotateCcw } from "lucide-react";
import { toast } from "sonner";

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
            setCapturedImage({
              file: result.file,
              preview: e.target.result,
            });
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
    handleCapture();
  };

  const handleCancel = () => {
    setCapturedImage(null);
    setIsOpen(false);
  };

  return (
    <>
      <Button
        variant={buttonVariant}
        onClick={() => {
          setIsOpen(true);
          if (!showPreview) {
            handleCapture();
          }
        }}
        disabled={disabled || isCapturing}
        className={className}
      >
        {isCapturing ? (
          <Loader2 className={`w-4 h-4 ${buttonText ? "mr-2" : ""} animate-spin`} />
        ) : (
          <Camera className={`w-4 h-4 ${buttonText ? "mr-2" : ""}`} />
        )}
        {buttonText}
      </Button>

      {showPreview && (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>{description}</DialogDescription>
            </DialogHeader>

            {!capturedImage ? (
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
                <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                  <img
                    src={capturedImage.preview}
                    alt="Captured"
                    className="w-full h-full object-contain"
                  />
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
