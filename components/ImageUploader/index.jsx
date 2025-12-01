"use client";

import { useState, useRef } from "react";
import {
  Card,
  Image,
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
import { IconX, IconPhoto, IconUpload } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";

// Image type options with aspect ratio info
const IMAGE_TYPES = [
  { value: "general", label: "General (4:3)" },
  { value: "logo", label: "Logo (Original)" },
  { value: "hero", label: "Hero Image (16:9)" },
  { value: "banner", label: "Banner (21:9)" },
  { value: "gallery", label: "Gallery (3:2)" },
  { value: "team", label: "Team Photo (1:1)" },
  { value: "product", label: "Product (1:1)" },
];

export function ImageUploader({
  value,
  onChange,
  label = "Upload Image",
  description,
  onUploadComplete,
  accept = "image/*",
  maxSize = 4 * 1024 * 1024, // 4MB default
}) {
  const [altText, setAltText] = useState("");
  const [imageType, setImageType] = useState("general");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const inputRef = useRef(null);

  const handleRemove = () => {
    onChange(null);
    setAltText("");
    setImageType("general");
    setPendingFile(null);
  };

  const uploadFile = async (file, alt) => {
    if (!file) return;

    // Validate alt text
    if (!alt || alt.trim().length < 3) {
      notifications.show({
        title: "Alt text required",
        message: "Please provide a description for the image (minimum 3 characters)",
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
    if (!file.type.startsWith("image/")) {
      notifications.show({
        title: "Invalid file type",
        message: "Please upload an image file",
        color: "red",
      });
      return false;
    }

    try {
      setUploading(true);
      setProgress(10);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("alt", alt.trim());
      formData.append("type", imageType);

      setProgress(30);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      setProgress(80);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }

      const savedImage = await response.json();

      setProgress(100);

      onChange(savedImage.url);
      setPendingFile(null);

      if (onUploadComplete) {
        onUploadComplete(savedImage);
      }

      notifications.show({
        title: "Success",
        message: "Image uploaded successfully",
        color: "green",
      });

      return true;
    } catch (error) {
      console.error("Error uploading image:", error);
      notifications.show({
        title: "Upload Error",
        message: error.message || "Failed to upload image",
        color: "red",
      });
      return false;
    } finally {
      setUploading(false);
      setProgress(0);
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
    if (!file.type.startsWith("image/")) {
      notifications.show({
        title: "Invalid file type",
        message: "Please upload an image file",
        color: "red",
      });
      return;
    }

    // Store the file and show preview - user needs to add alt text first
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
    setImageType("general");
  };

  // Show uploaded image
  if (value) {
    return (
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Stack gap="md">
          <Box style={{ position: "relative", width: "fit-content" }}>
            <Image
              src={value}
              alt={altText || "Uploaded image"}
              radius="md"
              fit="contain"
              h={200}
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

  // Show pending file with alt text input
  if (pendingFile) {
    const previewUrl = URL.createObjectURL(pendingFile);

    return (
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Stack gap="md">
          <Group gap="xs">
            <IconPhoto size={20} />
            <Text fw={600}>{label}</Text>
          </Group>

          <Box style={{ position: "relative", width: "fit-content" }}>
            <Image
              src={previewUrl}
              alt="Preview"
              radius="md"
              fit="contain"
              h={150}
            />
          </Box>

          <TextInput
            label="Image Description (Alt Text)"
            placeholder="e.g., Company logo, Team photo, Product image"
            value={altText}
            onChange={(e) => setAltText(e.target.value)}
            description="Required for accessibility. This will also be used as the filename."
            required
            error={altText.length > 0 && altText.length < 3 ? "Minimum 3 characters" : null}
          />

          <Select
            label="Image Type"
            placeholder="Select image type"
            data={IMAGE_TYPES}
            value={imageType}
            onChange={setImageType}
            description={
              imageType === "logo"
                ? "Keeps original aspect ratio, saved as PNG to preserve transparency"
                : "Images will be automatically cropped to the selected aspect ratio"
            }
          />

          {uploading ? (
            <Stack gap="sm">
              <Text size="sm" c="dimmed" ta="center">
                Uploading...
              </Text>
              <Progress value={progress} animated />
            </Stack>
          ) : (
            <Group>
              <Button
                onClick={handleUploadClick}
                disabled={!altText || altText.trim().length < 3}
              >
                Upload Image
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
          <IconPhoto size={20} />
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
              Drag and drop an image here, or click to select
            </Text>
            <Text size="xs" c="dimmed">
              Recommended: 1920x1080px (16:9) or larger
            </Text>
            <Text size="xs" c="dimmed">
              Max file size: {maxSize / (1024 * 1024)}MB | JPG, PNG, WebP
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
