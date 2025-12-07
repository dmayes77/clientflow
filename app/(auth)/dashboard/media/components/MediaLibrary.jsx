"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Image as ImageIcon,
  Video,
  Upload,
  MoreHorizontal,
  Pencil,
  Trash2,
  Loader2,
  Copy,
  ExternalLink,
  FileImage,
  FileVideo,
  X,
  Check,
  Download,
  Eye,
  Filter,
  Grid,
  List,
} from "lucide-react";

const IMAGE_TYPES = [
  { value: "logo", label: "Logo" },
  { value: "hero", label: "Hero Image" },
  { value: "banner", label: "Banner" },
  { value: "gallery", label: "Gallery" },
  { value: "team", label: "Team/Portrait" },
  { value: "product", label: "Product" },
  { value: "general", label: "General" },
];

const VIDEO_TYPES = [
  { value: "hero", label: "Hero Video" },
  { value: "background", label: "Background" },
  { value: "testimonial", label: "Testimonial" },
  { value: "tutorial", label: "Tutorial" },
  { value: "promo", label: "Promo" },
  { value: "general", label: "General" },
];

export function MediaLibrary() {
  const [activeTab, setActiveTab] = useState("images");
  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [filterType, setFilterType] = useState("all");
  const [viewMode, setViewMode] = useState("grid");

  // Dialog states
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);

  // Selected item states
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [previewItem, setPreviewItem] = useState(null);

  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    file: null,
    name: "",
    alt: "",
    type: "general",
  });

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: "",
    alt: "",
    type: "general",
  });

  // Drag and drop state
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const fetchImages = useCallback(async () => {
    try {
      const params = filterType !== "all" ? `?type=${filterType}` : "";
      const res = await fetch(`/api/images${params}`);
      if (!res.ok) throw new Error("Failed to fetch images");
      const data = await res.json();
      setImages(data);
    } catch (error) {
      toast.error("Failed to load images");
    }
  }, [filterType]);

  const fetchVideos = useCallback(async () => {
    try {
      const params = filterType !== "all" ? `?type=${filterType}` : "";
      const res = await fetch(`/api/videos${params}`);
      if (!res.ok) throw new Error("Failed to fetch videos");
      const data = await res.json();
      setVideos(data);
    } catch (error) {
      toast.error("Failed to load videos");
    }
  }, [filterType]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchImages(), fetchVideos()]);
      setLoading(false);
    };
    loadData();
  }, [fetchImages, fetchVideos]);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = (file) => {
    if (!file) return;

    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (!isImage && !isVideo) {
      toast.error("Please select an image or video file");
      return;
    }

    // Set active tab based on file type
    if (isImage) {
      setActiveTab("images");
    } else if (isVideo) {
      setActiveTab("videos");
    }

    // Generate name from filename
    const nameFromFile = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");

    setUploadForm({
      file,
      name: nameFromFile,
      alt: nameFromFile,
      type: "general",
    });
    setUploadDialogOpen(true);
  };

  const handleUpload = async () => {
    if (!uploadForm.file || !uploadForm.name) {
      toast.error("Please provide a file and name");
      return;
    }

    setUploading(true);
    setUploadProgress(10);

    try {
      const formData = new FormData();
      formData.append("file", uploadForm.file);
      formData.append("name", uploadForm.name);
      formData.append("alt", uploadForm.alt || uploadForm.name);
      formData.append("type", uploadForm.type);

      const isImage = uploadForm.file.type.startsWith("image/");
      const endpoint = isImage ? "/api/images" : "/api/videos";

      setUploadProgress(30);

      const res = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });

      setUploadProgress(90);

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Upload failed");
      }

      const newItem = await res.json();

      if (isImage) {
        setImages((prev) => [newItem, ...prev]);
      } else {
        setVideos((prev) => [newItem, ...prev]);
      }

      setUploadProgress(100);
      toast.success(`${isImage ? "Image" : "Video"} uploaded successfully`);
      setUploadDialogOpen(false);
      setUploadForm({ file: null, name: "", alt: "", type: "general" });
    } catch (error) {
      toast.error(error.message || "Failed to upload file");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleEdit = async () => {
    if (!selectedItem) return;

    try {
      const isImage = activeTab === "images";
      const endpoint = isImage ? `/api/images/${selectedItem.id}` : `/api/videos/${selectedItem.id}`;

      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      if (!res.ok) throw new Error("Failed to update");

      const updatedItem = await res.json();

      if (isImage) {
        setImages((prev) => prev.map((img) => (img.id === updatedItem.id ? updatedItem : img)));
      } else {
        setVideos((prev) => prev.map((vid) => (vid.id === updatedItem.id ? updatedItem : vid)));
      }

      toast.success(`${isImage ? "Image" : "Video"} updated successfully`);
      setEditDialogOpen(false);
      setSelectedItem(null);
    } catch (error) {
      toast.error("Failed to update");
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;

    try {
      const isImage = activeTab === "images";
      const endpoint = isImage ? `/api/images/${itemToDelete.id}` : `/api/videos/${itemToDelete.id}`;

      const res = await fetch(endpoint, { method: "DELETE" });

      if (!res.ok) throw new Error("Failed to delete");

      if (isImage) {
        setImages((prev) => prev.filter((img) => img.id !== itemToDelete.id));
      } else {
        setVideos((prev) => prev.filter((vid) => vid.id !== itemToDelete.id));
      }

      toast.success(`${isImage ? "Image" : "Video"} deleted successfully`);
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    } catch (error) {
      toast.error("Failed to delete");
    }
  };

  const openEditDialog = (item) => {
    setSelectedItem(item);
    setEditForm({
      name: item.name,
      alt: item.alt,
      type: item.type,
    });
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (item) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const openPreviewDialog = (item) => {
    setPreviewItem(item);
    setPreviewDialogOpen(true);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("URL copied to clipboard");
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "Unknown";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const currentItems = activeTab === "images" ? images : videos;
  const currentTypes = activeTab === "images" ? IMAGE_TYPES : VIDEO_TYPES;

  const MediaCard = ({ item }) => {
    const isImage = activeTab === "images";

    return (
      <div className="et-media-card group" onClick={() => openPreviewDialog(item)}>
        <div className="et-media-thumb">
          {isImage ? (
            <img src={item.url} alt={item.alt} />
          ) : (
            <>
              {item.thumbnailUrl ? (
                <img src={item.thumbnailUrl} alt={item.alt} />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Video className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
              <div className="et-video-icon">
                <Video />
              </div>
              {item.duration && (
                <span className="et-duration-badge">
                  {Math.floor(item.duration / 60)}:{String(Math.floor(item.duration % 60)).padStart(2, "0")}
                </span>
              )}
            </>
          )}

          <div className="et-media-overlay">
            <Button size="icon" variant="secondary" onClick={(e) => { e.stopPropagation(); openPreviewDialog(item); }}>
              <Eye />
            </Button>
            <Button size="icon" variant="secondary" onClick={(e) => { e.stopPropagation(); copyToClipboard(item.url); }}>
              <Copy />
            </Button>
            <Button size="icon" variant="secondary" onClick={(e) => { e.stopPropagation(); openEditDialog(item); }}>
              <Pencil />
            </Button>
          </div>
        </div>

        <div className="et-media-info">
          <p className="et-media-name">{item.name}</p>
          <p className="et-media-meta">{formatFileSize(item.size)}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {/* Main Content */}
      <Card>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*,video/*"
          onChange={(e) => handleFileSelect(e.target.files?.[0])}
        />
        <CardContent className="p-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <TabsList className="h-8">
                <TabsTrigger value="images" className="h-7 gap-1.5 px-3 et-text-xs">
                  <FileImage className="h-3.5 w-3.5" />
                  Images ({images.length})
                </TabsTrigger>
                <TabsTrigger value="videos" className="h-7 gap-1.5 px-3 et-text-xs">
                  <FileVideo className="h-3.5 w-3.5" />
                  Videos ({videos.length})
                </TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-2">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="h-8 w-32 et-text-xs">
                    <Filter className="mr-1.5 h-3 w-3" />
                    <SelectValue placeholder="Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {currentTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex rounded-md border">
                  <Button
                    variant={viewMode === "grid" ? "secondary" : "ghost"}
                    size="icon"
                    className="h-8 w-8 rounded-r-none"
                    onClick={() => setViewMode("grid")}
                  >
                    <Grid className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "secondary" : "ghost"}
                    size="icon"
                    className="h-8 w-8 rounded-l-none"
                    onClick={() => setViewMode("list")}
                  >
                    <List className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <Button
                  size="sm"
                  className="h-8 et-text-xs"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="mr-1.5 h-3.5 w-3.5" />
                  Upload
                </Button>
              </div>
            </div>

            {/* Drop Zone */}
            <div
              className={`mb-4 rounded-lg border-2 border-dashed px-6 py-4 text-center transition-colors ${
                isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload className="mx-auto h-6 w-6 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                Drag and drop files here, or{" "}
                <button className="text-primary underline hover:no-underline" onClick={() => fileInputRef.current?.click()}>
                  browse
                </button>
              </p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                {activeTab === "images"
                  ? "Supports: JPG, PNG, GIF, WebP • Max 10MB"
                  : "Supports: MP4, MOV, WebM • Max 100MB"}
              </p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <TabsContent value="images" className="mt-0">
                  {images.length === 0 ? (
                    <div className="py-12 text-center">
                      <FileImage className="mx-auto h-12 w-12 text-muted-foreground" />
                      <p className="mt-2 text-muted-foreground">No images uploaded yet</p>
                    </div>
                  ) : viewMode === "grid" ? (
                    <div className="et-media-grid">
                      {images.map((image) => (
                        <MediaCard key={image.id} item={image} />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {images.map((image) => (
                        <div
                          key={image.id}
                          className="flex items-center gap-4 rounded-lg border p-3"
                        >
                          <img
                            src={image.url}
                            alt={image.alt}
                            className="h-16 w-16 rounded object-cover"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium">{image.name}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Badge variant="outline" className="et-text-xs">
                                {currentTypes.find((t) => t.value === image.type)?.label || image.type}
                              </Badge>
                              <span>
                                {image.width}x{image.height}
                              </span>
                              <span>{formatFileSize(image.size)}</span>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => copyToClipboard(image.url)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(image)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openDeleteDialog(image)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="videos" className="mt-0">
                  {videos.length === 0 ? (
                    <div className="py-12 text-center">
                      <FileVideo className="mx-auto h-12 w-12 text-muted-foreground" />
                      <p className="mt-2 text-muted-foreground">No videos uploaded yet</p>
                    </div>
                  ) : viewMode === "grid" ? (
                    <div className="et-media-grid">
                      {videos.map((video) => (
                        <MediaCard key={video.id} item={video} />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {videos.map((video) => (
                        <div
                          key={video.id}
                          className="flex items-center gap-4 rounded-lg border p-3"
                        >
                          <div className="relative h-16 w-16">
                            {video.thumbnailUrl ? (
                              <img
                                src={video.thumbnailUrl}
                                alt={video.alt}
                                className="h-16 w-16 rounded object-cover"
                              />
                            ) : (
                              <div className="flex h-16 w-16 items-center justify-center rounded bg-muted">
                                <Video className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium">{video.name}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Badge variant="outline" className="et-text-xs">
                                {VIDEO_TYPES.find((t) => t.value === video.type)?.label || video.type}
                              </Badge>
                              {video.duration && (
                                <span>
                                  {Math.floor(video.duration / 60)}:
                                  {String(Math.floor(video.duration % 60)).padStart(2, "0")}
                                </span>
                              )}
                              <span>{formatFileSize(video.size)}</span>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => copyToClipboard(video.url)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(video)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openDeleteDialog(video)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </>
            )}
          </Tabs>
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload {uploadForm.file?.type?.startsWith("image/") ? "Image" : "Video"}</DialogTitle>
            <DialogDescription>Add details for your upload</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {uploadForm.file && (
              <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-3">
                {uploadForm.file.type.startsWith("image/") ? (
                  <FileImage className="h-8 w-8 text-cyan-500" />
                ) : (
                  <FileVideo className="h-8 w-8 text-purple-500" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{uploadForm.file.name}</p>
                  <p className="et-text-xs text-muted-foreground">
                    {formatFileSize(uploadForm.file.size)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setUploadForm({ ...uploadForm, file: null });
                    setUploadDialogOpen(false);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={uploadForm.name}
                onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
                placeholder="Enter a name for this file"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="alt">Alt Text</Label>
              <Input
                id="alt"
                value={uploadForm.alt}
                onChange={(e) => setUploadForm({ ...uploadForm, alt: e.target.value })}
                placeholder="Describe this file for accessibility"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={uploadForm.type}
                onValueChange={(value) => setUploadForm({ ...uploadForm, type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {(uploadForm.file?.type?.startsWith("image/") ? IMAGE_TYPES : VIDEO_TYPES).map(
                    (type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>

            {uploading && (
              <div className="space-y-2">
                <div className="flex justify-between et-text-sm">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialogOpen(false)} disabled={uploading}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={uploading || !uploadForm.name}>
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Details</DialogTitle>
            <DialogDescription>Update the details for this file</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-alt">Alt Text</Label>
              <Input
                id="edit-alt"
                value={editForm.alt}
                onChange={(e) => setEditForm({ ...editForm, alt: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-type">Type</Label>
              <Select
                value={editForm.type}
                onValueChange={(value) => setEditForm({ ...editForm, type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {currentTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit}>
              <Check className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {activeTab === "images" ? "Image" : "Video"}</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{itemToDelete?.name}&quot;? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{previewItem?.name}</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            {previewItem && activeTab === "images" ? (
              <img
                src={previewItem.url}
                alt={previewItem.alt}
                className="max-h-[60vh] w-full rounded-lg object-contain"
              />
            ) : previewItem ? (
              <video
                src={previewItem.url}
                controls
                className="max-h-[60vh] w-full rounded-lg"
              />
            ) : null}

            {previewItem && (
              <div className="mt-4 grid grid-cols-2 gap-4 et-text-sm">
                <div>
                  <p className="text-muted-foreground">Dimensions</p>
                  <p className="font-medium">
                    {previewItem.width}x{previewItem.height}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Size</p>
                  <p className="font-medium">{formatFileSize(previewItem.size)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Type</p>
                  <p className="font-medium">
                    {currentTypes.find((t) => t.value === previewItem.type)?.label || previewItem.type}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Uploaded</p>
                  <p className="font-medium">
                    {format(new Date(previewItem.createdAt), "MMM d, yyyy")}
                  </p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => copyToClipboard(previewItem?.url)}>
              <Copy className="mr-2 h-4 w-4" />
              Copy URL
            </Button>
            <Button onClick={() => window.open(previewItem?.url, "_blank")}>
              <ExternalLink className="mr-2 h-4 w-4" />
              Open Original
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
