"use client";

import { useState, useEffect } from "react";
import {
  Card,
  Title,
  Text,
  Button,
  Stack,
  Group,
  Loader,
  Alert,
  Modal,
  TextInput,
  ActionIcon,
  Image,
  SimpleGrid,
  Box,
  CopyButton,
  Tooltip,
  Badge,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconPhoto,
  IconInfoCircle,
  IconTrash,
  IconEdit,
  IconCopy,
  IconCheck,
  IconUpload,
} from "@tabler/icons-react";
import { ImageUploader } from "@/components/ImageUploader";

export default function ImagesPage() {
  const [loading, setLoading] = useState(true);
  const [images, setImages] = useState([]);
  const [uploadModalOpened, setUploadModalOpened] = useState(false);
  const [editModalOpened, setEditModalOpened] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [editAlt, setEditAlt] = useState("");
  const [editName, setEditName] = useState("");

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/images");

      if (response.ok) {
        const data = await response.json();
        setImages(data);
      }
    } catch (error) {
      console.error("Error fetching images:", error);
      notifications.show({
        title: "Error",
        message: "Failed to load images",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (imageId) => {
    if (!confirm("Are you sure you want to delete this image?")) {
      return;
    }

    try {
      const response = await fetch(`/api/images/${imageId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        notifications.show({
          title: "Success",
          message: "Image deleted successfully",
          color: "green",
        });
        fetchImages();
      } else {
        throw new Error("Failed to delete image");
      }
    } catch (error) {
      console.error("Error deleting image:", error);
      notifications.show({
        title: "Error",
        message: "Failed to delete image",
        color: "red",
      });
    }
  };

  const handleEdit = (image) => {
    setSelectedImage(image);
    setEditAlt(image.alt);
    setEditName(image.name);
    setEditModalOpened(true);
  };

  const handleSaveEdit = async () => {
    try {
      const response = await fetch(`/api/images/${selectedImage.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alt: editAlt,
          name: editName,
        }),
      });

      if (response.ok) {
        notifications.show({
          title: "Success",
          message: "Image updated successfully",
          color: "green",
        });
        setEditModalOpened(false);
        fetchImages();
      } else {
        throw new Error("Failed to update image");
      }
    } catch (error) {
      console.error("Error updating image:", error);
      notifications.show({
        title: "Error",
        message: "Failed to update image",
        color: "red",
      });
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  if (loading) {
    return (
      <Stack align="center" justify="center" style={{ minHeight: 400 }}>
        <Loader size="lg" />
        <Text c="dimmed">Loading images...</Text>
      </Stack>
    );
  }

  return (
    <>
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={1}>Media Library</Title>
          <Text size="sm" c="dimmed" mt="xs">
            Manage your images with CDN delivery and API access
          </Text>
        </div>
        <Button
          leftSection={<IconUpload size={20} />}
          onClick={() => setUploadModalOpened(true)}
        >
          Upload Images
        </Button>
      </Group>

      <Stack gap="lg">
        <Alert icon={<IconInfoCircle size={16} />} variant="light" color="blue">
          All images are automatically delivered via CDN and accessible through the API. Copy the CDN URL to use images on your website.
        </Alert>

        {images.length === 0 ? (
          <Card shadow="sm" padding="xl" radius="md" withBorder>
            <Stack align="center" gap="md" py={60}>
              <IconPhoto size={64} style={{ opacity: 0.3 }} />
              <Text size="lg" fw={600}>
                No images yet
              </Text>
              <Text size="sm" c="dimmed" ta="center">
                Upload your first image to get started with the media library
              </Text>
              <Button
                leftSection={<IconUpload size={20} />}
                onClick={() => setUploadModalOpened(true)}
              >
                Upload Images
              </Button>
            </Stack>
          </Card>
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
            {images.map((image) => (
              <Card key={image.id} shadow="sm" padding="md" radius="md" withBorder>
                <Card.Section>
                  <Image
                    src={image.url}
                    alt={image.alt}
                    height={200}
                    fit="cover"
                  />
                </Card.Section>

                <Stack gap="xs" mt="md">
                  <Group justify="space-between">
                    <Text fw={600} size="sm" lineClamp={1}>
                      {image.name}
                    </Text>
                    <Badge size="xs" variant="light">
                      {formatFileSize(image.size)}
                    </Badge>
                  </Group>

                  <Text size="xs" c="dimmed" lineClamp={2}>
                    Alt: {image.alt}
                  </Text>

                  {image.width && image.height && (
                    <Text size="xs" c="dimmed">
                      {image.width} × {image.height}px
                    </Text>
                  )}

                  <Group gap="xs" mt="xs">
                    <CopyButton value={image.url}>
                      {({ copied, copy }) => (
                        <Tooltip label={copied ? "Copied!" : "Copy CDN URL"}>
                          <ActionIcon
                            color={copied ? "teal" : "blue"}
                            variant="light"
                            onClick={copy}
                            size="sm"
                          >
                            {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                          </ActionIcon>
                        </Tooltip>
                      )}
                    </CopyButton>

                    <Tooltip label="Edit">
                      <ActionIcon
                        color="gray"
                        variant="light"
                        onClick={() => handleEdit(image)}
                        size="sm"
                      >
                        <IconEdit size={16} />
                      </ActionIcon>
                    </Tooltip>

                    <Tooltip label="Delete">
                      <ActionIcon
                        color="red"
                        variant="light"
                        onClick={() => handleDelete(image.id)}
                        size="sm"
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                </Stack>
              </Card>
            ))}
          </SimpleGrid>
        )}
      </Stack>

      {/* Upload Modal */}
      <Modal
        opened={uploadModalOpened}
        onClose={() => setUploadModalOpened(false)}
        title="Upload Images"
        size="lg"
      >
        <ImageUploader
          value={null}
          onChange={() => {
            setUploadModalOpened(false);
            fetchImages();
          }}
          label="Upload Image"
          description="Upload images to your media library"
          maxFiles={10}
          showAltText={true}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        opened={editModalOpened}
        onClose={() => setEditModalOpened(false)}
        title="Edit Image"
        size="md"
      >
        <Stack gap="md">
          {selectedImage && (
            <Image
              src={selectedImage.url}
              alt={selectedImage.alt}
              radius="md"
              fit="contain"
              h={200}
            />
          )}

          <TextInput
            label="Image Name"
            placeholder="Enter image name"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
          />

          <TextInput
            label="Alt Text"
            placeholder="Describe the image for accessibility"
            value={editAlt}
            onChange={(e) => setEditAlt(e.target.value)}
            description="Required for accessibility and SEO"
          />

          <Group justify="flex-end" mt="md">
            <Button variant="subtle" onClick={() => setEditModalOpened(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
