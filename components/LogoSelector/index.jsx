"use client";

import { useState, useEffect, useRef } from "react";
import {
  Card,
  Image,
  Text,
  Stack,
  Button,
  TextInput,
  Group,
  Box,
  Progress,
  Center,
  Modal,
  Tabs,
  SimpleGrid,
  Loader,
  Paper,
  ActionIcon,
} from "@mantine/core";
import {
  IconX,
  IconPhoto,
  IconUpload,
  IconLibraryPhoto,
  IconCheck,
} from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";

export function LogoSelector({
  value,
  onChange,
  label = "Business Logo",
  description,
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("library");

  // Media library state
  const [logos, setLogos] = useState([]);
  const [loadingLogos, setLoadingLogos] = useState(false);
  const [selectedLogo, setSelectedLogo] = useState(null);

  // Upload state
  const [altText, setAltText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const inputRef = useRef(null);

  const maxSize = 4 * 1024 * 1024; // 4MB

  // Fetch logos from media library
  const fetchLogos = async () => {
    try {
      setLoadingLogos(true);
      const response = await fetch("/api/images?type=logo");

      if (response.ok) {
        const data = await response.json();
        setLogos(data.images || []);
      }
    } catch (error) {
      console.error("Error fetching logos:", error);
    } finally {
      setLoadingLogos(false);
    }
  };

  useEffect(() => {
    if (modalOpen && activeTab === "library") {
      fetchLogos();
    }
  }, [modalOpen, activeTab]);

  const handleRemove = () => {
    onChange(null);
  };

  const handleOpenModal = () => {
    setModalOpen(true);
    setSelectedLogo(null);
    setPendingFile(null);
    setAltText("");
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedLogo(null);
    setPendingFile(null);
    setAltText("");
  };

  const handleSelectFromLibrary = () => {
    if (selectedLogo) {
      onChange(selectedLogo.url);
      handleCloseModal();
      notifications.show({
        title: "Logo Selected",
        message: "Logo has been set from your media library",
        color: "green",
      });
    }
  };

  // Upload handling
  const uploadFile = async (file, alt) => {
    if (!file) return;

    if (!alt || alt.trim().length < 3) {
      notifications.show({
        title: "Description required",
        message: "Please provide a description for the logo (minimum 3 characters)",
        color: "orange",
      });
      return false;
    }

    if (file.size > maxSize) {
      notifications.show({
        title: "File too large",
        message: "Maximum file size is 4MB",
        color: "red",
      });
      return false;
    }

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
      formData.append("type", "logo"); // Always upload as logo type

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
      handleCloseModal();

      notifications.show({
        title: "Success",
        message: "Logo uploaded and saved to media library",
        color: "green",
      });

      return true;
    } catch (error) {
      console.error("Error uploading logo:", error);
      notifications.show({
        title: "Upload Error",
        message: error.message || "Failed to upload logo",
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

    if (file.size > maxSize) {
      notifications.show({
        title: "File too large",
        message: "Maximum file size is 4MB",
        color: "red",
      });
      return;
    }

    if (!file.type.startsWith("image/")) {
      notifications.show({
        title: "Invalid file type",
        message: "Please upload an image file",
        color: "red",
      });
      return;
    }

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
  };

  return (
    <>
      {/* Current Logo Display */}
      {value ? (
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Stack gap="md">
            <Group justify="space-between">
              <Group gap="xs">
                <IconPhoto size={20} />
                <Text fw={600}>{label}</Text>
              </Group>
              <Group gap="xs">
                <Button variant="light" size="xs" onClick={handleOpenModal}>
                  Change
                </Button>
                <ActionIcon color="red" variant="light" onClick={handleRemove}>
                  <IconX size={16} />
                </ActionIcon>
              </Group>
            </Group>
            <Center>
              <Image
                src={value}
                alt="Business logo"
                radius="md"
                fit="contain"
                h={150}
                w="auto"
              />
            </Center>
          </Stack>
        </Card>
      ) : (
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
            <Center py="xl">
              <Stack align="center" gap="md">
                <IconPhoto size={48} color="var(--mantine-color-gray-5)" />
                <Text size="sm" c="dimmed">
                  No logo selected
                </Text>
                <Button
                  leftSection={<IconLibraryPhoto size={16} />}
                  onClick={handleOpenModal}
                >
                  Select Logo
                </Button>
              </Stack>
            </Center>
          </Stack>
        </Card>
      )}

      {/* Logo Selection Modal */}
      <Modal
        opened={modalOpen}
        onClose={handleCloseModal}
        title="Select Business Logo"
        size="lg"
      >
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="library" leftSection={<IconLibraryPhoto size={16} />}>
              Media Library
            </Tabs.Tab>
            <Tabs.Tab value="upload" leftSection={<IconUpload size={16} />}>
              Upload New
            </Tabs.Tab>
          </Tabs.List>

          {/* Media Library Tab */}
          <Tabs.Panel value="library" pt="md">
            {loadingLogos ? (
              <Center py="xl">
                <Loader size="md" />
              </Center>
            ) : logos.length === 0 ? (
              <Center py="xl">
                <Stack align="center" gap="md">
                  <IconPhoto size={48} color="var(--mantine-color-gray-5)" />
                  <Text size="sm" c="dimmed">
                    No logos in your media library yet
                  </Text>
                  <Button
                    variant="light"
                    onClick={() => setActiveTab("upload")}
                  >
                    Upload your first logo
                  </Button>
                </Stack>
              </Center>
            ) : (
              <Stack gap="md">
                <SimpleGrid cols={3} spacing="md">
                  {logos.map((logo) => (
                    <Paper
                      key={logo.id}
                      p="xs"
                      withBorder
                      style={{
                        cursor: "pointer",
                        borderColor:
                          selectedLogo?.id === logo.id
                            ? "var(--mantine-color-blue-5)"
                            : undefined,
                        borderWidth: selectedLogo?.id === logo.id ? 2 : 1,
                        position: "relative",
                      }}
                      onClick={() => setSelectedLogo(logo)}
                    >
                      {selectedLogo?.id === logo.id && (
                        <ActionIcon
                          color="blue"
                          size="sm"
                          radius="xl"
                          style={{
                            position: "absolute",
                            top: 4,
                            right: 4,
                            zIndex: 1,
                          }}
                        >
                          <IconCheck size={12} />
                        </ActionIcon>
                      )}
                      <Center>
                        <Image
                          src={logo.url}
                          alt={logo.alt}
                          fit="contain"
                          h={80}
                          w="auto"
                        />
                      </Center>
                      <Text size="xs" c="dimmed" ta="center" mt="xs" lineClamp={1}>
                        {logo.name || logo.alt}
                      </Text>
                    </Paper>
                  ))}
                </SimpleGrid>

                <Group justify="flex-end" mt="md">
                  <Button variant="subtle" onClick={handleCloseModal}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSelectFromLibrary}
                    disabled={!selectedLogo}
                  >
                    Use Selected Logo
                  </Button>
                </Group>
              </Stack>
            )}
          </Tabs.Panel>

          {/* Upload New Tab */}
          <Tabs.Panel value="upload" pt="md">
            {pendingFile ? (
              <Stack gap="md">
                <Center>
                  <Image
                    src={URL.createObjectURL(pendingFile)}
                    alt="Preview"
                    radius="md"
                    fit="contain"
                    h={150}
                  />
                </Center>

                <TextInput
                  label="Logo Description"
                  placeholder="e.g., Company logo, Main brand logo"
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  description="Required for accessibility and will be saved with the image"
                  required
                  error={
                    altText.length > 0 && altText.length < 3
                      ? "Minimum 3 characters"
                      : null
                  }
                />

                <Text size="xs" c="dimmed">
                  This logo will be saved to your media library with the &quot;logo&quot; type
                  for future use.
                </Text>

                {uploading ? (
                  <Stack gap="sm">
                    <Text size="sm" c="dimmed" ta="center">
                      Uploading...
                    </Text>
                    <Progress value={progress} animated />
                  </Stack>
                ) : (
                  <Group justify="flex-end">
                    <Button variant="subtle" onClick={handleCancelPending}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleUploadClick}
                      disabled={!altText || altText.trim().length < 3}
                    >
                      Upload & Use Logo
                    </Button>
                  </Group>
                )}
              </Stack>
            ) : (
              <Box
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                style={{
                  border: `2px dashed ${
                    dragActive
                      ? "var(--mantine-color-blue-5)"
                      : "var(--mantine-color-gray-4)"
                  }`,
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
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />

                <Stack gap="sm" align="center">
                  <Center>
                    <IconUpload size={40} color="var(--mantine-color-gray-5)" />
                  </Center>
                  <Text size="sm" c="dimmed">
                    Drag and drop a logo image, or click to select
                  </Text>
                  <Text size="xs" c="dimmed">
                    Recommended: Square image (400x400px or larger)
                  </Text>
                  <Text size="xs" c="dimmed">
                    Max file size: 4MB | PNG recommended for transparency
                  </Text>
                  <Button variant="light" size="sm">
                    Choose File
                  </Button>
                </Stack>
              </Box>
            )}
          </Tabs.Panel>
        </Tabs>
      </Modal>
    </>
  );
}
