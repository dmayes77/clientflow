"use client";

import { useState, useEffect } from "react";

/**
 * Custom hook for Web Share API
 * Provides share functionality with fallback to clipboard copy
 */
export function useWebShare() {
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported(typeof navigator !== "undefined" && "share" in navigator);
  }, []);

  /**
   * Share content using native share sheet or clipboard fallback
   * @param {Object} data - Share data
   * @param {string} data.title - Title of the shared content
   * @param {string} data.text - Text description
   * @param {string} data.url - URL to share
   * @param {File[]} [data.files] - Files to share (if supported)
   */
  const share = async (data) => {
    try {
      // Check if files are supported (not all browsers support file sharing)
      if (data.files && data.files.length > 0) {
        const canShareFiles = navigator.canShare && navigator.canShare({ files: data.files });

        if (!canShareFiles) {
          // Remove files if not supported
          delete data.files;
        }
      }

      if (isSupported) {
        await navigator.share(data);
        return { success: true, method: "native" };
      } else {
        // Fallback to clipboard copy
        const shareText = `${data.title}\n${data.text}\n${data.url}`;
        await navigator.clipboard.writeText(shareText);
        return { success: true, method: "clipboard", message: "Link copied to clipboard" };
      }
    } catch (error) {
      // User cancelled share or other error
      if (error.name === "AbortError") {
        return { success: false, cancelled: true };
      }
      return { success: false, error: error.message };
    }
  };

  return { share, isSupported };
}
