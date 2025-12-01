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
  Select,
  ActionIcon,
  Image,
  SimpleGrid,
  Box,
  CopyButton,
  Tooltip,
  Badge,
  Tabs,
} from "@mantine/core";

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

// Video type options
const VIDEO_TYPES = [
  { value: "general", label: "General" },
  { value: "hero", label: "Hero Video (1080p)" },
  { value: "background", label: "Background (720p)" },
  { value: "testimonial", label: "Testimonial (1080p)" },
  { value: "tutorial", label: "Tutorial (1080p)" },
  { value: "promo", label: "Promotional (1080p)" },
];

import { notifications } from "@mantine/notifications";
import {
  IconPhoto,
  IconVideo,
  IconInfoCircle,
  IconTrash,
  IconEdit,
  IconCopy,
  IconCheck,
  IconUpload,
  IconAlertTriangle,
} from "@tabler/icons-react";
import { ImageUploader } from "@/components/ImageUploader";
import { VideoUploader } from "@/components/VideoUploader";

export default function ImagesPage() {
  const [activeTab, setActiveTab] = useState("images");
  const [loading, setLoading] = useState(true);
  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);
  const [uploadModalOpened, setUploadModalOpened] = useState(false);
  const [editModalOpened, setEditModalOpened] = useState(false);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [nameChangeModalOpened, setNameChangeModalOpened] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editAlt, setEditAlt] = useState("");
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState("general");

  useEffect(() => {
    fetchMedia();
  }, []);

  const fetchMedia = async () => {
    try {
      setLoading(true);
      const [imagesRes, videosRes] = await Promise.all([
        fetch("/api/images"),
        fetch("/api/videos"),
      ]);

      if (imagesRes.ok) {
        const imagesData = await imagesRes.json();
        setImages(imagesData);
      }
      if (videosRes.ok) {
        const videosData = await videosRes.json();
        setVideos(videosData);
      }
    } catch (error) {
      console.error("Error fetching media:", error);
      notifications.show({
        title: "Error",
        message: "Failed to load media",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  const openDeleteModal = (item, type) => {
    setItemToDelete({ ...item, mediaType: type });
    setDeleteModalOpened(true);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;

    const isVideo = itemToDelete.mediaType === "video";
    const endpoint = isVideo ? `/api/videos/${itemToDelete.id}` : `/api/images/${itemToDelete.id}`;

    try {
      setDeleting(true);
      const response = await fetch(endpoint, {
        method: "DELETE",
      });

      if (response.ok) {
        notifications.show({
          title: "Success",
          message: `${isVideo ? "Video" : "Image"} deleted successfully`,
          color: "green",
        });
        setDeleteModalOpened(false);
        setItemToDelete(null);
        fetchMedia();
      } else {
        throw new Error(`Failed to delete ${isVideo ? "video" : "image"}`);
      }
    } catch (error) {
      console.error("Error deleting:", error);
      notifications.show({
        title: "Error",
        message: `Failed to delete ${itemToDelete.mediaType === "video" ? "video" : "image"}`,
        color: "red",
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleEdit = (item, type) => {
    setSelectedItem({ ...item, mediaType: type });
    setEditAlt(item.alt);
    setEditName(item.name);
    setEditType(item.type || "general");
    setEditModalOpened(true);
  };

  const handleSaveClick = () => {
    // Check if name has changed
    if (selectedItem && editName !== selectedItem.name) {
      setNameChangeModalOpened(true);
    } else {
      handleSaveEdit();
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedItem) return;

    const isVideo = selectedItem.mediaType === "video";
    const endpoint = isVideo ? `/api/videos/${selectedItem.id}` : `/api/images/${selectedItem.id}`;

    try {
      setSaving(true);
      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alt: editAlt,
          name: editName,
          type: editType,
        }),
      });

      if (response.ok) {
        notifications.show({
          title: "Success",
          message: `${isVideo ? "Video" : "Image"} updated successfully`,
          color: "green",
        });
        setEditModalOpened(false);
        setNameChangeModalOpened(false);
        fetchMedia();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to update ${isVideo ? "video" : "image"}`);
      }
    } catch (error) {
      console.error("Error updating:", error);
      notifications.show({
        title: "Error",
        message: error.message || "Failed to update",
        color: "red",
      });
    } finally {
      setSaving(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const formatDuration = (seconds) => {
    if (!seconds) return "";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <Stack align="center" justify="center" style={{ minHeight: 400 }}>
        <Loader size="lg" />
        <Text c="dimmed">Loading media...</Text>
      </Stack>
    );
  }

  return (
    <>
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={1}>Media Library</Title>
          <Text size="sm" c="dimmed" mt="xs">
            Manage your images and videos with CDN delivery and API access
          </Text>
        </div>
        <Button
          leftSection={<IconUpload size={20} />}
          onClick={() => setUploadModalOpened(true)}
        >
          Upload {activeTab === "images" ? "Images" : "Videos"}
        </Button>
      </Group>

      <Stack gap="lg">
        <Alert icon={<IconInfoCircle size={16} />} variant="light" color="blue">
          All media is automatically delivered via CDN and accessible through the API. Copy the CDN URL to use on your website.
        </Alert>

        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="images" leftSection={<IconPhoto size={16} />}>
              Images ({images.length})
            </Tabs.Tab>
            <Tabs.Tab value="videos" leftSection={<IconVideo size={16} />}>
              Videos ({videos.length})
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="images" pt="md">
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
              <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4, xl: 5 }} spacing="md">
                {images.map((image) => (
                  <Card key={image.id} shadow="sm" padding="md" radius="md" withBorder style={{ display: "flex", flexDirection: "column" }}>
                    <Card.Section>
                      <Box style={{ height: 140, overflow: "hidden", backgroundColor: "var(--mantine-color-gray-1)" }}>
                        <Image
                          src={image.url}
                          alt={image.alt}
                          h={140}
                          w="100%"
                          fit="cover"
                        />
                      </Box>
                    </Card.Section>

                    <Stack gap="xs" mt="md">
                      <Group justify="space-between" wrap="nowrap">
                        <span style={{ fontSize: "0.75rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {image.name}
                        </span>
                        <Badge size="xs" variant="light" color="blue" style={{ flexShrink: 0 }}>
                          {IMAGE_TYPES.find(t => t.value === image.type)?.label || "General"}
                        </Badge>
                      </Group>

                      <span style={{ fontSize: "0.6875rem", color: "var(--mantine-color-dimmed)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {formatFileSize(image.size)}
                      </span>

                      {image.width && image.height && (
                        <span style={{ fontSize: "0.6875rem", color: "var(--mantine-color-dimmed)" }}>
                          {image.width} × {image.height}px
                        </span>
                      )}

                      <Group gap="sm" mt="xs">
                        <CopyButton value={image.url}>
                          {({ copied, copy }) => (
                            <Tooltip label={copied ? "Copied!" : "Copy CDN URL"}>
                              <ActionIcon
                                color={copied ? "teal" : "blue"}
                                variant="light"
                                onClick={copy}
                                size="lg"
                              >
                                {copied ? <IconCheck size={20} /> : <IconCopy size={20} />}
                              </ActionIcon>
                            </Tooltip>
                          )}
                        </CopyButton>

                        <Tooltip label="Edit">
                          <ActionIcon
                            color="gray"
                            variant="light"
                            onClick={() => handleEdit(image, "image")}
                            size="lg"
                          >
                            <IconEdit size={20} />
                          </ActionIcon>
                        </Tooltip>

                        <Tooltip label="Delete">
                          <ActionIcon
                            color="red"
                            variant="light"
                            onClick={() => openDeleteModal(image, "image")}
                            size="lg"
                          >
                            <IconTrash size={20} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    </Stack>
                  </Card>
                ))}
              </SimpleGrid>
            )}
          </Tabs.Panel>

          <Tabs.Panel value="videos" pt="md">
            {videos.length === 0 ? (
              <Card shadow="sm" padding="xl" radius="md" withBorder>
                <Stack align="center" gap="md" py={60}>
                  <IconVideo size={64} style={{ opacity: 0.3 }} />
                  <Text size="lg" fw={600}>
                    No videos yet
                  </Text>
                  <Text size="sm" c="dimmed" ta="center">
                    Upload your first video to get started
                  </Text>
                  <Button
                    leftSection={<IconUpload size={20} />}
                    onClick={() => setUploadModalOpened(true)}
                  >
                    Upload Videos
                  </Button>
                </Stack>
              </Card>
            ) : (
              <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="md">
                {videos.map((video) => (
                  <Card key={video.id} shadow="sm" padding="md" radius="md" withBorder style={{ display: "flex", flexDirection: "column" }}>
                    <Card.Section>
                      <Box style={{ height: 140, overflow: "hidden", backgroundColor: "var(--mantine-color-dark-6)", position: "relative" }}>
                        {video.thumbnailUrl ? (
                          <Image
                            src={video.thumbnailUrl}
                            alt={video.alt}
                            h={140}
                            w="100%"
                            fit="cover"
                          />
                        ) : (
                          <Box style={{ height: 140, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <IconVideo size={48} color="var(--mantine-color-gray-5)" />
                          </Box>
                        )}
                        {video.duration && (
                          <Badge
                            size="sm"
                            variant="filled"
                            color="dark"
                            style={{ position: "absolute", bottom: 8, right: 8 }}
                          >
                            {formatDuration(video.duration)}
                          </Badge>
                        )}
                      </Box>
                    </Card.Section>

                    <Stack gap="xs" mt="md">
                      <Group justify="space-between" wrap="nowrap">
                        <span style={{ fontSize: "0.75rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {video.name}
                        </span>
                        <Badge size="xs" variant="light" color="violet" style={{ flexShrink: 0 }}>
                          {VIDEO_TYPES.find(t => t.value === video.type)?.label || "General"}
                        </Badge>
                      </Group>

                      <span style={{ fontSize: "0.6875rem", color: "var(--mantine-color-dimmed)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {formatFileSize(video.size)}
                      </span>

                      {video.width && video.height && (
                        <span style={{ fontSize: "0.6875rem", color: "var(--mantine-color-dimmed)" }}>
                          {video.width} × {video.height}px
                        </span>
                      )}

                      <Group gap="sm" mt="xs">
                        <CopyButton value={video.url}>
                          {({ copied, copy }) => (
                            <Tooltip label={copied ? "Copied!" : "Copy CDN URL"}>
                              <ActionIcon
                                color={copied ? "teal" : "violet"}
                                variant="light"
                                onClick={copy}
                                size="lg"
                              >
                                {copied ? <IconCheck size={20} /> : <IconCopy size={20} />}
                              </ActionIcon>
                            </Tooltip>
                          )}
                        </CopyButton>

                        <Tooltip label="Edit">
                          <ActionIcon
                            color="gray"
                            variant="light"
                            onClick={() => handleEdit(video, "video")}
                            size="lg"
                          >
                            <IconEdit size={20} />
                          </ActionIcon>
                        </Tooltip>

                        <Tooltip label="Delete">
                          <ActionIcon
                            color="red"
                            variant="light"
                            onClick={() => openDeleteModal(video, "video")}
                            size="lg"
                          >
                            <IconTrash size={20} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    </Stack>
                  </Card>
                ))}
              </SimpleGrid>
            )}
          </Tabs.Panel>
        </Tabs>
      </Stack>

      {/* Upload Modal */}
      <Modal
        opened={uploadModalOpened}
        onClose={() => setUploadModalOpened(false)}
        title={`Upload ${activeTab === "images" ? "Images" : "Videos"}`}
        size="lg"
      >
        {activeTab === "images" ? (
          <ImageUploader
            value={null}
            onChange={() => {
              setUploadModalOpened(false);
              fetchMedia();
            }}
            label="Upload Image"
            description="Upload images to your media library"
            maxFiles={10}
            showAltText={true}
          />
        ) : (
          <VideoUploader
            value={null}
            onChange={() => {
              setUploadModalOpened(false);
              fetchMedia();
            }}
            label="Upload Video"
            description="Upload videos to your media library (max 100MB)"
          />
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal
        opened={editModalOpened}
        onClose={() => setEditModalOpened(false)}
        title={`Edit ${selectedItem?.mediaType === "video" ? "Video" : "Image"}`}
        size="md"
      >
        <Stack gap="md">
          {selectedItem && (
            selectedItem.mediaType === "video" ? (
              selectedItem.thumbnailUrl ? (
                <Image
                  src={selectedItem.thumbnailUrl}
                  alt={selectedItem.alt}
                  radius="md"
                  fit="contain"
                  h={200}
                />
              ) : (
                <Box style={{ height: 200, backgroundColor: "var(--mantine-color-dark-6)", borderRadius: "var(--mantine-radius-md)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <IconVideo size={48} color="var(--mantine-color-gray-5)" />
                </Box>
              )
            ) : (
              <Image
                src={selectedItem.url}
                alt={selectedItem.alt}
                radius="md"
                fit="contain"
                h={200}
              />
            )
          )}

          <TextInput
            label={`${selectedItem?.mediaType === "video" ? "Video" : "Image"} Name`}
            placeholder="Enter name"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
          />

          <TextInput
            label="Description (Alt Text)"
            placeholder="Describe for accessibility"
            value={editAlt}
            onChange={(e) => setEditAlt(e.target.value)}
            description="Required for accessibility and SEO"
          />

          <Select
            label={`${selectedItem?.mediaType === "video" ? "Video" : "Image"} Type`}
            placeholder="Select type"
            data={selectedItem?.mediaType === "video" ? VIDEO_TYPES : IMAGE_TYPES}
            value={editType}
            onChange={(value) => setEditType(value || "general")}
            description={
              selectedItem?.mediaType === "video"
                ? "Changing type will adjust video quality settings"
                : editType === "logo"
                ? "Keeps original aspect ratio, saved as PNG to preserve transparency"
                : "Changing type will re-crop the image to the new aspect ratio"
            }
          />

          <Group justify="flex-end" mt="md">
            <Button variant="subtle" onClick={() => setEditModalOpened(false)}>
              Cancel
            </Button>
            {selectedItem && (
              editAlt !== selectedItem.alt ||
              editName !== selectedItem.name ||
              editType !== (selectedItem.type || "general")
            ) && (
              <Button onClick={handleSaveClick} loading={saving}>
                Save Changes
              </Button>
            )}
          </Group>
        </Stack>
      </Modal>

      {/* Name Change Confirmation Modal */}
      <Modal
        opened={nameChangeModalOpened}
        onClose={() => setNameChangeModalOpened(false)}
        title={`Change ${selectedItem?.mediaType === "video" ? "Video" : "Image"} Name`}
        size="md"
        centered
      >
        <Stack gap="md">
          <Alert
            icon={<IconAlertTriangle size={20} />}
            color="orange"
            variant="light"
          >
            Changing the name may break the path if it is already in use on your website.
          </Alert>

          {selectedItem && (
            <Stack gap="xs">
              <Group justify="space-between">
                <Text size="sm" c="dimmed">Current name:</Text>
                <Text size="sm" fw={500}>{selectedItem.name}</Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">New name:</Text>
                <Text size="sm" fw={500}>{editName}</Text>
              </Group>
            </Stack>
          )}

          <Group justify="flex-end" mt="md">
            <Button
              variant="subtle"
              onClick={() => setNameChangeModalOpened(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button color="orange" onClick={handleSaveEdit} loading={saving}>
              Change Name
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        opened={deleteModalOpened}
        onClose={() => {
          setDeleteModalOpened(false);
          setItemToDelete(null);
        }}
        title={`Delete ${itemToDelete?.mediaType === "video" ? "Video" : "Image"}`}
        size="md"
        centered
      >
        <Stack gap="md">
          <Alert
            icon={<IconAlertTriangle size={20} />}
            color="red"
            variant="light"
          >
            Are you sure you want to delete this {itemToDelete?.mediaType === "video" ? "video" : "image"}? This action cannot be undone.
          </Alert>

          {itemToDelete && (
            <Stack gap="xs">
              {itemToDelete.mediaType === "video" ? (
                itemToDelete.thumbnailUrl ? (
                  <Image
                    src={itemToDelete.thumbnailUrl}
                    alt={itemToDelete.alt}
                    radius="md"
                    fit="contain"
                    h={150}
                  />
                ) : (
                  <Box style={{ height: 150, backgroundColor: "var(--mantine-color-dark-6)", borderRadius: "var(--mantine-radius-md)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <IconVideo size={48} color="var(--mantine-color-gray-5)" />
                  </Box>
                )
              ) : (
                <Image
                  src={itemToDelete.url}
                  alt={itemToDelete.alt}
                  radius="md"
                  fit="contain"
                  h={150}
                />
              )}
              <Text size="sm" fw={500} ta="center">
                {itemToDelete.name}
              </Text>
            </Stack>
          )}

          <Group justify="flex-end" mt="md">
            <Button
              variant="subtle"
              onClick={() => {
                setDeleteModalOpened(false);
                setItemToDelete(null);
              }}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button color="red" onClick={handleDelete} loading={deleting}>
              Delete {itemToDelete?.mediaType === "video" ? "Video" : "Image"}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
