"use client";

import { useState, useRef } from "react";
import {
  Card,
  Text,
  Stack,
  Button,
  TextInput,
  Select,
  Group,
  Box,
  Progress,
  Center,
} from "@mantine/core";
import { IconX, IconVideo, IconUpload } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";

// Video type options
const VIDEO_TYPES = [
  { value: "general", label: "General" },
  { value: "hero", label: "Hero Video (1080p)" },
  { value: "background", label: "Background (720p)" },
  { value: "testimonial", label: "Testimonial (1080p)" },
  { value: "tutorial", label: "Tutorial (1080p)" },
  { value: "promo", label: "Promotional (1080p)" },
];

/**
 * Convert alt text to a URL-friendly filename
 */
function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 50);
}

export function VideoUploader({
  value,
  onChange,
  label = "Upload Video",
  description,
  onUploadComplete,
  accept = "video/*",
  maxSize = 100 * 1024 * 1024, // 100MB default
}) {
  const [altText, setAltText] = useState("");
  const [videoType, setVideoType] = useState("general");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const inputRef = useRef(null);
  const xhrRef = useRef(null);

  const handleRemove = () => {
    onChange(null);
    setAltText("");
    setVideoType("general");
    setPendingFile(null);
  };

  const uploadFile = async (file, alt) => {
    if (!file) return;

    // Validate alt text
    if (!alt || alt.trim().length < 3) {
      notifications.show({
        title: "Description required",
        message: "Please provide a description for the video (minimum 3 characters)",
        color: "orange",
      });
      return false;
    }

    // Validate file size
    if (file.size > maxSize) {
      notifications.show({
        title: "File too large",
        message: `Maximum file size is ${maxSize / (1024 * 1024)}MB`,
        color: "red",
      });
      return false;
    }

    // Validate file type
    if (!file.type.startsWith("video/")) {
      notifications.show({
        title: "Invalid file type",
        message: "Please upload a video file",
        color: "red",
      });
      return false;
    }

    try {
      setUploading(true);
      setProgress(0);
      setUploadStatus("Getting upload signature...");

      // Generate public_id from alt text
      const slugifiedName = slugify(alt);
      const timestamp = Date.now();
      const publicIdName = `${slugifiedName}-${timestamp}`;

      // Step 1: Get signed upload credentials from our API
      const signResponse = await fetch("/api/videos/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: videoType, publicId: publicIdName }),
      });

      if (!signResponse.ok) {
        const error = await signResponse.json();
        throw new Error(error.error || "Failed to get upload signature");
      }

      const signData = await signResponse.json();
      setProgress(5);
      setUploadStatus("Uploading to cloud storage...");

      // Step 2: Upload directly to Cloudinary using XHR for progress tracking
      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${signData.cloudName}/video/upload`;

      // Build form data - must include EXACTLY the same signed params
      // Note: resource_type is NOT included - it's in the URL path (/video/upload)
      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", signData.apiKey);
      formData.append("timestamp", signData.timestamp);
      formData.append("signature", signData.signature);
      formData.append("folder", signData.folder);
      formData.append("public_id", publicIdName);
      if (signData.transformation) {
        formData.append("transformation", signData.transformation);
      }
      if (signData.eager) {
        formData.append("eager", signData.eager);
      }
      if (signData.eager_async) {
        formData.append("eager_async", signData.eager_async);
      }

      // Use XMLHttpRequest for upload progress tracking
      const cloudinaryResult = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhrRef.current = xhr;

        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            // Progress from 5% to 85% during upload
            const uploadProgress = Math.round((event.loaded / event.total) * 80);
            setProgress(5 + uploadProgress);

            // Show upload speed/progress
            const uploadedMB = (event.loaded / (1024 * 1024)).toFixed(1);
            const totalMB = (event.total / (1024 * 1024)).toFixed(1);
            setUploadStatus(`Uploading: ${uploadedMB}MB / ${totalMB}MB`);
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              resolve(JSON.parse(xhr.responseText));
            } catch {
              reject(new Error("Invalid response from cloud storage"));
            }
          } else {
            try {
              const error = JSON.parse(xhr.responseText);
              reject(new Error(error.error?.message || "Upload failed"));
            } catch {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          }
        });

        xhr.addEventListener("error", () => {
          reject(new Error("Network error during upload"));
        });

        xhr.addEventListener("abort", () => {
          reject(new Error("Upload cancelled"));
        });

        xhr.open("POST", cloudinaryUrl);
        xhr.send(formData);
      });

      setProgress(90);
      setUploadStatus("Saving video metadata...");

      // Step 3: Save metadata to our database
      const saveResponse = await fetch("/api/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          publicId: cloudinaryResult.public_id,
          url: cloudinaryResult.secure_url,
          alt: alt.trim(),
          type: videoType,
          bytes: cloudinaryResult.bytes,
          width: cloudinaryResult.width,
          height: cloudinaryResult.height,
          duration: cloudinaryResult.duration,
          format: cloudinaryResult.format,
          thumbnailUrl: cloudinaryResult.eager?.[0]?.secure_url || null,
        }),
      });

      if (!saveResponse.ok) {
        const error = await saveResponse.json();
        throw new Error(error.error || "Failed to save video metadata");
      }

      const savedVideo = await saveResponse.json();

      setProgress(100);
      setUploadStatus("Complete!");

      onChange(savedVideo.url);
      setPendingFile(null);

      if (onUploadComplete) {
        onUploadComplete(savedVideo);
      }

      notifications.show({
        title: "Success",
        message: "Video uploaded successfully",
        color: "green",
      });

      return true;
    } catch (error) {
      console.error("Error uploading video:", error);
      notifications.show({
        title: "Upload Error",
        message: error.message || "Failed to upload video",
        color: "red",
      });
      return false;
    } finally {
      setUploading(false);
      setProgress(0);
      setUploadStatus("");
      xhrRef.current = null;
    }
  };

  const handleCancelUpload = () => {
    if (xhrRef.current) {
      xhrRef.current.abort();
    }
  };

  const handleFileSelect = (file) => {
    if (!file) return;

    // Validate file size
    if (file.size > maxSize) {
      notifications.show({
        title: "File too large",
        message: `Maximum file size is ${maxSize / (1024 * 1024)}MB`,
        color: "red",
      });
      return;
    }

    // Validate file type
    if (!file.type.startsWith("video/")) {
      notifications.show({
        title: "Invalid file type",
        message: "Please upload a video file",
        color: "red",
      });
      return;
    }

    // Store the file and show preview - user needs to add description first
    setPendingFile(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleUploadClick = () => {
    if (pendingFile) {
      uploadFile(pendingFile, altText);
    }
  };

  const handleCancelPending = () => {
    setPendingFile(null);
    setAltText("");
    setVideoType("general");
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  // Show uploaded video
  if (value) {
    return (
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Stack gap="md">
          <Box style={{ position: "relative", width: "fit-content" }}>
            <video
              src={value}
              controls
              style={{
                maxHeight: 200,
                maxWidth: "100%",
                borderRadius: "var(--mantine-radius-md)",
              }}
            />
            <Button
              color="red"
              size="xs"
              style={{
                position: "absolute",
                top: 8,
                right: 8,
              }}
              onClick={handleRemove}
            >
              <IconX size={16} />
            </Button>
          </Box>
          <Text size="sm" c="dimmed">
            {label}
          </Text>
        </Stack>
      </Card>
    );
  }

  // Show pending file with description input
  if (pendingFile) {
    const previewUrl = URL.createObjectURL(pendingFile);

    return (
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Stack gap="md">
          <Group gap="xs">
            <IconVideo size={20} />
            <Text fw={600}>{label}</Text>
          </Group>

          <Box style={{ position: "relative", width: "fit-content" }}>
            <video
              src={previewUrl}
              style={{
                maxHeight: 150,
                maxWidth: "100%",
                borderRadius: "var(--mantine-radius-md)",
              }}
            />
          </Box>

          <Text size="sm" c="dimmed">
            {pendingFile.name} ({formatFileSize(pendingFile.size)})
          </Text>

          <TextInput
            label="Video Description"
            placeholder="e.g., Company introduction video, Product demo"
            value={altText}
            onChange={(e) => setAltText(e.target.value)}
            description="Required for accessibility. This will also be used as the filename."
            required
            error={altText.length > 0 && altText.length < 3 ? "Minimum 3 characters" : null}
          />

          <Select
            label="Video Type"
            placeholder="Select video type"
            data={VIDEO_TYPES}
            value={videoType}
            onChange={setVideoType}
            description="Videos will be optimized for the selected use case"
          />

          {uploading ? (
            <Stack gap="sm">
              <Text size="sm" c="dimmed" ta="center">
                {uploadStatus || "Uploading..."}
              </Text>
              <Progress value={progress} animated />
              <Button
                variant="subtle"
                color="red"
                size="sm"
                onClick={handleCancelUpload}
              >
                Cancel Upload
              </Button>
            </Stack>
          ) : (
            <Group>
              <Button
                onClick={handleUploadClick}
                disabled={!altText || altText.trim().length < 3}
              >
                Upload Video
              </Button>
              <Button variant="subtle" color="gray" onClick={handleCancelPending}>
                Cancel
              </Button>
            </Group>
          )}
        </Stack>
      </Card>
    );
  }

  // Show upload dropzone
  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Stack gap="md">
        <Group gap="xs">
          <IconVideo size={20} />
          <Text fw={600}>{label}</Text>
        </Group>
        {description && (
          <Text size="sm" c="dimmed">
            {description}
          </Text>
        )}

        <Box
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          style={{
            border: `2px dashed ${dragActive ? "var(--mantine-color-blue-5)" : "var(--mantine-color-gray-4)"}`,
            borderRadius: "var(--mantine-radius-md)",
            padding: "2rem",
            textAlign: "center",
            backgroundColor: dragActive
              ? "var(--mantine-color-blue-0)"
              : "transparent",
            transition: "all 0.2s ease",
            cursor: "pointer",
          }}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            onChange={handleFileChange}
            style={{ display: "none" }}
          />

          <Stack gap="sm" align="center">
            <Center>
              <IconUpload size={40} color="var(--mantine-color-gray-5)" />
            </Center>
            <Text size="sm" c="dimmed">
              Drag and drop a video here, or click to select
            </Text>
            <Text size="xs" c="dimmed">
              Supported formats: MP4, WebM, MOV, AVI
            </Text>
            <Text size="xs" c="dimmed">
              Max file size: {maxSize / (1024 * 1024)}MB
            </Text>
            <Button variant="light" size="sm">
              Choose File
            </Button>
          </Stack>
        </Box>
      </Stack>
    </Card>
  );
}
