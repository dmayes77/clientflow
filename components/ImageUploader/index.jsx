"use client";

import { useState } from "react";
import { UploadDropzone } from "@uploadthing/react";
import { Card, Image, Text, Stack, Button, TextInput, Group, Box } from "@mantine/core";
import { IconX, IconPhoto } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";

export function ImageUploader({
  value,
  onChange,
  label = "Upload Image",
  description,
  maxFiles = 1,
  showAltText = false,
  onUploadComplete
}) {
  const [altText, setAltText] = useState("");
  const [uploading, setUploading] = useState(false);

  const handleRemove = () => {
    onChange(null);
    setAltText("");
  };

  const handleUploadComplete = async (res) => {
    try {
      setUploading(true);

      if (res && res.length > 0) {
        const file = res[0];

        // Save image metadata to database
        const response = await fetch("/api/images", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: file.url,
            key: file.key,
            name: file.name,
            alt: altText || file.name,
            size: file.size,
            mimeType: file.type || "image/jpeg",
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to save image metadata");
        }

        const savedImage = await response.json();

        onChange(savedImage.url);

        if (onUploadComplete) {
          onUploadComplete(savedImage);
        }

        notifications.show({
          title: "Success",
          message: "Image uploaded successfully",
          color: "green",
        });
      }
    } catch (error) {
      console.error("Error saving image:", error);
      notifications.show({
        title: "Error",
        message: "Failed to save image",
        color: "red",
      });
    } finally {
      setUploading(false);
    }
  };

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

  return (
    <Stack gap="md">
      {showAltText && (
        <TextInput
          label="Alt Text"
          placeholder="Describe the image for accessibility"
          value={altText}
          onChange={(e) => setAltText(e.target.value)}
          description="Required for accessibility and SEO"
        />
      )}

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
          <UploadDropzone
            endpoint="imageUploader"
            onClientUploadComplete={handleUploadComplete}
            onUploadError={(error) => {
              console.error("Upload error:", error);
              notifications.show({
                title: "Upload Error",
                message: error.message || "Failed to upload image",
                color: "red",
              });
            }}
            config={{
              mode: "auto",
            }}
          />
        </Stack>
      </Card>
    </Stack>
  );
}
