"use client";

import { useState, useEffect } from "react";

/**
 * Custom hook for File System Access API
 * Provides better file handling with direct access
 */
export function useFileSystem() {
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported(
      typeof window !== "undefined" && "showOpenFilePicker" in window
    );
  }, []);

  /**
   * Open file picker and read file(s)
   * @param {Object} options - Picker options
   * @param {boolean} [options.multiple=false] - Allow multiple file selection
   * @param {Array} [options.types] - Accepted file types
   */
  const pickFiles = async (options = {}) => {
    if (!isSupported) {
      // Fallback to input element
      return new Promise((resolve) => {
        const input = document.createElement("input");
        input.type = "file";
        input.multiple = options.multiple || false;

        if (options.types && options.types.length > 0) {
          const accept = options.types
            .map(type => type.accept)
            .flat()
            .join(",");
          input.accept = accept;
        }

        input.onchange = async (e) => {
          const files = Array.from(e.target.files);
          resolve({ success: true, files, method: "fallback" });
        };

        input.click();
      });
    }

    try {
      const pickerOpts = {
        multiple: options.multiple || false,
        excludeAcceptAllOption: true,
      };

      if (options.types) {
        pickerOpts.types = options.types;
      }

      const fileHandles = await window.showOpenFilePicker(pickerOpts);
      const files = await Promise.all(
        fileHandles.map(async (handle) => await handle.getFile())
      );

      return { success: true, files, fileHandles, method: "native" };
    } catch (error) {
      if (error.name === "AbortError") {
        return { success: false, cancelled: true };
      }
      return { success: false, error: error.message };
    }
  };

  /**
   * Save file to user's device
   * @param {Blob} blob - File content
   * @param {string} suggestedName - Suggested filename
   * @param {Array} [types] - Accepted file types
   */
  const saveFile = async (blob, suggestedName, types = []) => {
    if (!isSupported) {
      // Fallback to download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = suggestedName;
      a.click();
      URL.revokeObjectURL(url);
      return { success: true, method: "fallback" };
    }

    try {
      const opts = {
        suggestedName,
        types: types.length > 0 ? types : undefined,
      };

      const handle = await window.showSaveFilePicker(opts);
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();

      return { success: true, method: "native", fileHandle: handle };
    } catch (error) {
      if (error.name === "AbortError") {
        return { success: false, cancelled: true };
      }
      return { success: false, error: error.message };
    }
  };

  /**
   * Open directory picker
   */
  const pickDirectory = async () => {
    if (!isSupported || !("showDirectoryPicker" in window)) {
      return { success: false, error: "Directory picker not supported" };
    }

    try {
      const dirHandle = await window.showDirectoryPicker();
      return { success: true, dirHandle, method: "native" };
    } catch (error) {
      if (error.name === "AbortError") {
        return { success: false, cancelled: true };
      }
      return { success: false, error: error.message };
    }
  };

  return { pickFiles, saveFile, pickDirectory, isSupported };
}
