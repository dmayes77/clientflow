"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { notifications } from "@mantine/notifications";
import {
  Image,
  Video,
  Info,
  Trash2,
  Pencil,
  Copy,
  Check,
  Upload,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { ImageUploader } from "@/components/ImageUploader";
import { VideoUploader } from "@/components/VideoUploader";

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

export default function MediaLibraryPage() {
  const [activeTab, setActiveTab] = useState("images");
  const [loading, setLoading] = useState(true);
  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [nameChangeModalOpen, setNameChangeModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editAlt, setEditAlt] = useState("");
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState("general");
  const [copiedId, setCopiedId] = useState(null);

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
        setImages(imagesData.images || []);
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
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;

    const isVideo = itemToDelete.mediaType === "video";
    const endpoint = isVideo ? `/api/videos/${itemToDelete.id}` : `/api/images/${itemToDelete.id}`;

    try {
      setDeleting(true);
      const response = await fetch(endpoint, { method: "DELETE" });

      if (response.ok) {
        notifications.show({
          title: "Success",
          message: `${isVideo ? "Video" : "Image"} deleted successfully`,
          color: "green",
        });
        setDeleteModalOpen(false);
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
    setEditModalOpen(true);
  };

  const handleSaveClick = () => {
    if (selectedItem && editName !== selectedItem.name) {
      setNameChangeModalOpen(true);
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
        body: JSON.stringify({ alt: editAlt, name: editName, type: editType }),
      });

      if (response.ok) {
        notifications.show({
          title: "Success",
          message: `${isVideo ? "Video" : "Image"} updated successfully`,
          color: "green",
        });
        setEditModalOpen(false);
        setNameChangeModalOpen(false);
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

  const handleCopy = async (url, id) => {
    await navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
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
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900">Media Library</h1>
          <p className="text-xs text-zinc-500">
            Manage images and videos with CDN delivery
          </p>
        </div>
        <Button size="sm" onClick={() => setUploadModalOpen(true)}>
          <Upload className="h-3.5 w-3.5 mr-1.5" />
          Upload {activeTab === "images" ? "Images" : "Videos"}
        </Button>
      </div>

      {/* Info Banner */}
      <div className="flex items-center gap-2 rounded-md bg-blue-50 border border-blue-100 px-3 py-2">
        <Info className="h-3.5 w-3.5 text-blue-600 shrink-0" />
        <p className="text-xs text-blue-700">
          All media is delivered via CDN. Copy the URL to use on your website.
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="images" className="text-xs">
            <Image className="h-3.5 w-3.5 mr-1.5" />
            Images ({images.length})
          </TabsTrigger>
          <TabsTrigger value="videos" className="text-xs">
            <Video className="h-3.5 w-3.5 mr-1.5" />
            Videos ({videos.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="images" className="mt-4">
          {images.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="h-12 w-12 rounded-full bg-cyan-50 flex items-center justify-center mb-3">
                  <Image className="h-6 w-6 text-cyan-400" />
                </div>
                <p className="text-sm font-medium text-zinc-900 mb-1">No images yet</p>
                <p className="text-xs text-zinc-500 mb-4">Upload your first image to get started</p>
                <Button size="sm" onClick={() => setUploadModalOpen(true)}>
                  <Upload className="h-3.5 w-3.5 mr-1.5" />
                  Upload Images
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {images.map((image) => (
                <Card key={image.id} className="overflow-hidden group">
                  <div className="aspect-4/3 bg-zinc-100 relative overflow-hidden">
                    <img
                      src={image.url}
                      alt={image.alt}
                      className="w-full h-full object-cover"
                    />
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="secondary"
                              className="h-7 w-7"
                              onClick={() => handleCopy(image.url, image.id)}
                            >
                              {copiedId === image.id ? (
                                <Check className="h-3.5 w-3.5 text-green-600" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Copy URL</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="secondary"
                              className="h-7 w-7"
                              onClick={() => handleEdit(image, "image")}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Edit</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="secondary"
                              className="h-7 w-7 hover:bg-red-100 hover:text-red-600"
                              onClick={() => openDeleteModal(image, "image")}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Delete</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                  <CardContent className="p-2">
                    <p className="text-[0.6875rem] font-medium text-zinc-900 truncate">{image.name}</p>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-[0.625rem] text-zinc-500">{formatFileSize(image.size)}</span>
                      <Badge variant="secondary" className="text-[0.5625rem] px-1 py-0 h-4">
                        {IMAGE_TYPES.find(t => t.value === image.type)?.label.split(" ")[0] || "General"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="videos" className="mt-4">
          {videos.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="h-12 w-12 rounded-full bg-violet-50 flex items-center justify-center mb-3">
                  <Video className="h-6 w-6 text-violet-400" />
                </div>
                <p className="text-sm font-medium text-zinc-900 mb-1">No videos yet</p>
                <p className="text-xs text-zinc-500 mb-4">Upload your first video to get started</p>
                <Button size="sm" onClick={() => setUploadModalOpen(true)}>
                  <Upload className="h-3.5 w-3.5 mr-1.5" />
                  Upload Videos
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {videos.map((video) => (
                <Card key={video.id} className="overflow-hidden group">
                  <div className="aspect-video bg-zinc-900 relative overflow-hidden">
                    {video.thumbnailUrl ? (
                      <img
                        src={video.thumbnailUrl}
                        alt={video.alt}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Video className="h-8 w-8 text-zinc-600" />
                      </div>
                    )}
                    {video.duration && (
                      <Badge className="absolute bottom-1 right-1 bg-black/80 text-white text-[0.5625rem] px-1 py-0 h-4">
                        {formatDuration(video.duration)}
                      </Badge>
                    )}
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="secondary"
                              className="h-7 w-7"
                              onClick={() => handleCopy(video.url, video.id)}
                            >
                              {copiedId === video.id ? (
                                <Check className="h-3.5 w-3.5 text-green-600" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Copy URL</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="secondary"
                              className="h-7 w-7"
                              onClick={() => handleEdit(video, "video")}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Edit</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="secondary"
                              className="h-7 w-7 hover:bg-red-100 hover:text-red-600"
                              onClick={() => openDeleteModal(video, "video")}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Delete</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                  <CardContent className="p-2">
                    <p className="text-[0.6875rem] font-medium text-zinc-900 truncate">{video.name}</p>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-[0.625rem] text-zinc-500">{formatFileSize(video.size)}</span>
                      <Badge variant="outline" className="text-[0.5625rem] px-1 py-0 h-4 border-violet-200 text-violet-600">
                        {VIDEO_TYPES.find(t => t.value === video.type)?.label.split(" ")[0] || "General"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Upload Modal */}
      <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base">
              Upload {activeTab === "images" ? "Images" : "Videos"}
            </DialogTitle>
          </DialogHeader>
          {activeTab === "images" ? (
            <ImageUploader
              value={null}
              onChange={() => {
                setUploadModalOpen(false);
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
                setUploadModalOpen(false);
                fetchMedia();
              }}
              label="Upload Video"
              description="Upload videos to your media library (max 100MB)"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">
              Edit {selectedItem?.mediaType === "video" ? "Video" : "Image"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedItem && (
              <div className="aspect-video bg-zinc-100 rounded-md overflow-hidden">
                {selectedItem.mediaType === "video" ? (
                  selectedItem.thumbnailUrl ? (
                    <img src={selectedItem.thumbnailUrl} alt={selectedItem.alt} className="w-full h-full object-contain" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                      <Video className="h-8 w-8 text-zinc-600" />
                    </div>
                  )
                ) : (
                  <img src={selectedItem.url} alt={selectedItem.alt} className="w-full h-full object-contain" />
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="edit-name" className="text-xs">Name</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="h-8 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-alt" className="text-xs">Description (Alt Text)</Label>
              <Input
                id="edit-alt"
                value={editAlt}
                onChange={(e) => setEditAlt(e.target.value)}
                placeholder="Describe for accessibility"
                className="h-8 text-sm"
              />
              <p className="text-[0.625rem] text-zinc-500">Required for accessibility and SEO</p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Type</Label>
              <Select value={editType} onValueChange={setEditType}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(selectedItem?.mediaType === "video" ? VIDEO_TYPES : IMAGE_TYPES).map((type) => (
                    <SelectItem key={type.value} value={type.value} className="text-sm">
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            {selectedItem && (
              editAlt !== selectedItem.alt ||
              editName !== selectedItem.name ||
              editType !== (selectedItem.type || "general")
            ) && (
              <Button size="sm" onClick={handleSaveClick} disabled={saving}>
                {saving && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
                Save Changes
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Name Change Confirmation */}
      <AlertDialog open={nameChangeModalOpen} onOpenChange={setNameChangeModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Change Name
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Changing the name may break the URL if it's already in use on your website.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {selectedItem && (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500">Current:</span>
                <span className="font-medium">{selectedItem.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">New:</span>
                <span className="font-medium">{editName}</span>
              </div>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs h-8" disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-amber-500 hover:bg-amber-600 text-xs h-8"
              onClick={handleSaveEdit}
              disabled={saving}
            >
              {saving && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
              Change Name
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Delete {itemToDelete?.mediaType === "video" ? "Video" : "Image"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              This action cannot be undone. This will permanently delete the file.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {itemToDelete && (
            <div className="space-y-2">
              <div className="aspect-video bg-zinc-100 rounded-md overflow-hidden max-h-32">
                {itemToDelete.mediaType === "video" ? (
                  itemToDelete.thumbnailUrl ? (
                    <img src={itemToDelete.thumbnailUrl} alt={itemToDelete.alt} className="w-full h-full object-contain" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                      <Video className="h-6 w-6 text-zinc-600" />
                    </div>
                  )
                ) : (
                  <img src={itemToDelete.url} alt={itemToDelete.alt} className="w-full h-full object-contain" />
                )}
              </div>
              <p className="text-xs font-medium text-center">{itemToDelete.name}</p>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs h-8" disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600 text-xs h-8"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
