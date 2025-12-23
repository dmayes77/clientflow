"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAdminContent } from "@/lib/hooks/use-admin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Map,
  FileText,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  Clock,
  Lightbulb,
  Archive,
  Send,
  Eye,
  Sparkles,
  Bug,
  Zap,
  AlertTriangle,
  ExternalLink,
  GripVertical,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const STATUS_CONFIG = {
  planned: { label: "Planned", icon: Lightbulb, color: "bg-blue-100 text-blue-700" },
  in_progress: { label: "In Progress", icon: Clock, color: "bg-yellow-100 text-yellow-700" },
  completed: { label: "Completed", icon: CheckCircle, color: "bg-green-100 text-green-700" },
  archived: { label: "Archived", icon: Archive, color: "bg-zinc-100 text-zinc-600" },
};

const TYPE_CONFIG = {
  feature: { label: "Feature", icon: Sparkles, color: "bg-purple-100 text-purple-700" },
  improvement: { label: "Improvement", icon: Zap, color: "bg-blue-100 text-blue-700" },
  fix: { label: "Fix", icon: Bug, color: "bg-orange-100 text-orange-700" },
  breaking: { label: "Breaking", icon: AlertTriangle, color: "bg-red-100 text-red-700" },
};

function formatDate(date) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Roadmap Components
function SortableRoadmapItem({ item, onEdit, onDelete }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const statusConfig = STATUS_CONFIG[item.status] || STATUS_CONFIG.planned;
  const StatusIcon = statusConfig.icon;

  return (
    <div ref={setNodeRef} style={style}>
      <Card>
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            <button
              className="cursor-grab active:cursor-grabbing mt-0.5 text-muted-foreground hover:text-foreground"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-4 w-4" />
            </button>
            <div className="flex items-start justify-between gap-2 flex-1 min-w-0">
              <div className="min-w-0 flex-1">
                <div className="font-medium hig-body">{item.title}</div>
                {item.description && (
                  <p className="hig-caption2 text-muted-foreground mt-0.5 line-clamp-2">
                    {item.description}
                  </p>
                )}
              </div>
              <Badge className={`shrink-0 hig-caption2 ${statusConfig.color}`}>
                <StatusIcon className="h-2.5 w-2.5 mr-0.5" />
                {statusConfig.label}
              </Badge>
            </div>
          </div>
          <div className="flex items-center justify-between mt-2 ml-6">
            <div className="flex items-center gap-2 hig-caption2 text-muted-foreground">
              {item.category && (
                <Badge variant="outline" className="hig-caption2">{item.category}</Badge>
              )}
              {item.targetDate && (
                <span>Target: {formatDate(item.targetDate)}</span>
              )}
              {item.votes > 0 && (
                <span>{item.votes} votes</span>
              )}
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => onEdit(item)}>
                <Edit2 className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive" onClick={() => onDelete(item.id)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function RoadmapEditor({ item, onSave, onCancel }) {
  const [form, setForm] = useState({
    title: item?.title || "",
    description: item?.description || "",
    status: item?.status || "planned",
    category: item?.category || "",
    priority: item?.priority || 0,
    targetDate: item?.targetDate ? new Date(item.targetDate).toISOString().split("T")[0] : "",
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave({ ...form, id: item?.id });
    setSaving(false);
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label className="hig-caption2">Title</Label>
        <Input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Feature title..."
          className="h-9"
        />
      </div>
      <div className="space-y-1">
        <Label className="hig-caption2">Description</Label>
        <Textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Brief description..."
          rows={2}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="hig-caption2">Status</Label>
          <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="planned">Planned</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="hig-caption2">Category</Label>
          <Input
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            placeholder="e.g., Booking"
            className="h-9"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="hig-caption2">Priority</Label>
          <Input
            type="number"
            value={form.priority}
            onChange={(e) => setForm({ ...form, priority: parseInt(e.target.value) || 0 })}
            className="h-9"
          />
        </div>
        <div className="space-y-1">
          <Label className="hig-caption2">Target Date</Label>
          <Input
            type="date"
            value={form.targetDate}
            onChange={(e) => setForm({ ...form, targetDate: e.target.value })}
            className="h-9"
          />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
        <Button size="sm" onClick={handleSave} disabled={saving || !form.title}>
          {saving ? "Saving..." : item?.id ? "Update" : "Create"}
        </Button>
      </div>
    </div>
  );
}

// Changelog Components (GitHub Releases)
function ChangelogEntryCard({ entry }) {
  const typeConfig = TYPE_CONFIG[entry.type] || TYPE_CONFIG.feature;
  const TypeIcon = typeConfig.icon;

  return (
    <Card className={!entry.published ? "border-dashed" : ""}>
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <div className="font-medium hig-body">{entry.title}</div>
              {entry.version && (
                <Badge variant="outline" className="hig-caption2">v{entry.version}</Badge>
              )}
            </div>
            <p className="hig-caption2 text-muted-foreground mt-0.5 line-clamp-2">
              {entry.content ? entry.content.substring(0, 100) + "..." : "No description"}
            </p>
          </div>
          <div className="flex flex-col gap-1 shrink-0">
            <Badge className={`hig-caption2 ${typeConfig.color}`}>
              <TypeIcon className="h-2.5 w-2.5 mr-0.5" />
              {typeConfig.label}
            </Badge>
            {entry.published ? (
              <Badge variant="outline" className="hig-caption2 text-green-600">
                <Eye className="h-2.5 w-2.5 mr-0.5" />
                Published
              </Badge>
            ) : (
              <Badge variant="outline" className="hig-caption2">Draft</Badge>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2 hig-caption2 text-muted-foreground">
            <span>
              {entry.publishedAt ? `Published ${formatDate(entry.publishedAt)}` : `Created ${formatDate(entry.createdAt)}`}
            </span>
            {entry.author && (
              <Badge variant="outline" className="hig-caption2">@{entry.author}</Badge>
            )}
          </div>
          {entry.htmlUrl && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 hig-caption2"
              onClick={() => window.open(entry.htmlUrl, "_blank")}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              View on GitHub
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}


export default function ContentManagementPage() {
  const [activeTab, setActiveTab] = useState("roadmap");
  const queryClient = useQueryClient();

  // Dialog state
  const [editingRoadmap, setEditingRoadmap] = useState(null);
  const [showRoadmapDialog, setShowRoadmapDialog] = useState(false);

  // Fetch roadmap items
  const { data: roadmapData, isLoading: roadmapLoading } = useAdminContent("roadmap");

  // Fetch changelog entries
  const { data: changelogData, isLoading: changelogLoading } = useAdminContent("changelog");

  // Local state for drag-drop reordering
  const [localRoadmapItems, setLocalRoadmapItems] = useState([]);

  // Sync local state with query data
  useEffect(() => {
    if (roadmapData?.items) {
      setLocalRoadmapItems(roadmapData.items);
    }
  }, [roadmapData]);

  const roadmapCounts = roadmapData?.statusCounts || {};
  const changelogEntries = changelogData?.entries || [];
  const changelogCounts = changelogData?.counts || {};

  // Drag-drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Roadmap mutations
  const saveRoadmapMutation = useMutation({
    mutationFn: async (item) => {
      const method = item.id ? "PATCH" : "POST";
      const res = await fetch("/api/admin/content/roadmap", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!res.ok) throw new Error("Failed to save");
      return res.json();
    },
    onSuccess: () => {
      setShowRoadmapDialog(false);
      setEditingRoadmap(null);
      queryClient.invalidateQueries(["admin-roadmap"]);
    },
  });

  const deleteRoadmapMutation = useMutation({
    mutationFn: async (id) => {
      await fetch(`/api/admin/content/roadmap?id=${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-roadmap"]);
    },
  });

  // Handlers
  const handleSaveRoadmap = (item) => saveRoadmapMutation.mutate(item);
  const handleDeleteRoadmap = (id) => {
    if (confirm("Delete this roadmap item?")) {
      deleteRoadmapMutation.mutate(id);
    }
  };

  // Handle drag end
  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = localRoadmapItems.findIndex((item) => item.id === active.id);
    const newIndex = localRoadmapItems.findIndex((item) => item.id === over.id);

    // Reorder items in local state
    const newItems = arrayMove(localRoadmapItems, oldIndex, newIndex);
    setLocalRoadmapItems(newItems);

    // Update priorities in database
    // Assign new priorities based on position (higher position = higher priority)
    const updates = newItems.map((item, index) => ({
      id: item.id,
      priority: 1000 - index, // Start from 1000 and decrement
    }));

    // Batch update priorities
    try {
      await Promise.all(
        updates.map((update) =>
          fetch("/api/admin/content/roadmap", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(update),
          })
        )
      );
      // Invalidate query to refresh from server
      queryClient.invalidateQueries(["admin-roadmap"]);
    } catch (error) {
      console.error("Failed to update priorities:", error);
      // Revert on error
      setLocalRoadmapItems(roadmapData?.items || []);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="hig-title-1 font-bold">Content</h1>
        <p className="hig-body text-muted-foreground">
          Manage roadmap and changelog
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full">
          <TabsTrigger value="roadmap" className="flex-1">
            <Map className="h-4 w-4 mr-1" />
            Roadmap
            {roadmapCounts.planned > 0 && (
              <Badge variant="secondary" className="ml-1 hig-caption2">
                {roadmapCounts.planned}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="changelog" className="flex-1">
            <FileText className="h-4 w-4 mr-1" />
            Changelog
            {changelogCounts.draft > 0 && (
              <Badge variant="secondary" className="ml-1 hig-caption2">
                {changelogCounts.draft}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Roadmap Tab */}
        <TabsContent value="roadmap" className="space-y-4 mt-4">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-2">
            {Object.entries(STATUS_CONFIG).map(([status, config]) => {
              const Icon = config.icon;
              return (
                <Card key={status}>
                  <CardContent className="p-2 text-center">
                    <Icon className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                    <div className="hig-title-2 font-bold">{roadmapCounts[status] || 0}</div>
                    <div className="hig-caption2 text-muted-foreground">{config.label}</div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Add Button */}
          <Dialog open={showRoadmapDialog} onOpenChange={(v) => {
            setShowRoadmapDialog(v);
            if (!v) setEditingRoadmap(null);
          }}>
            <DialogTrigger asChild>
              <Button size="sm" className="w-full">
                <Plus className="h-4 w-4 mr-1" />
                Add Roadmap Item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingRoadmap ? "Edit" : "New"} Roadmap Item</DialogTitle>
              </DialogHeader>
              <RoadmapEditor
                item={editingRoadmap}
                onSave={handleSaveRoadmap}
                onCancel={() => {
                  setShowRoadmapDialog(false);
                  setEditingRoadmap(null);
                }}
              />
            </DialogContent>
          </Dialog>

          {/* Items List */}
          {roadmapLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
            </div>
          ) : localRoadmapItems.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No roadmap items yet
              </CardContent>
            </Card>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={localRoadmapItems.map((item) => item.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {localRoadmapItems.map((item) => (
                    <SortableRoadmapItem
                      key={item.id}
                      item={item}
                      onEdit={(item) => {
                        setEditingRoadmap(item);
                        setShowRoadmapDialog(true);
                      }}
                      onDelete={handleDeleteRoadmap}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </TabsContent>

        {/* Changelog Tab (GitHub Releases) */}
        <TabsContent value="changelog" className="space-y-4 mt-4">
          {/* Info Banner */}
          <Card className="border-blue-200 bg-blue-50/30">
            <CardContent className="p-3">
              <div className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <div className="hig-body font-medium text-blue-900">Powered by GitHub Releases</div>
                  <p className="hig-caption2 text-blue-700 mt-0.5">
                    Changelog entries are automatically synced from your GitHub releases.
                    Create a new release on GitHub to add entries here.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2">
            <Card>
              <CardContent className="p-2 text-center">
                <div className="hig-title-2 font-bold">{changelogCounts.total || 0}</div>
                <div className="hig-caption2 text-muted-foreground">Total</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-2 text-center">
                <div className="hig-title-2 font-bold text-green-600">{changelogCounts.published || 0}</div>
                <div className="hig-caption2 text-muted-foreground">Published</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-2 text-center">
                <div className="hig-title-2 font-bold text-yellow-600">{changelogCounts.draft || 0}</div>
                <div className="hig-caption2 text-muted-foreground">Drafts</div>
              </CardContent>
            </Card>
          </div>

          {/* Create Release Button */}
          <Button
            size="sm"
            className="w-full"
            variant="outline"
            onClick={() => window.open(`https://github.com/${process.env.NEXT_PUBLIC_GITHUB_REPO || 'dmayes77/clientflow'}/releases/new`, "_blank")}
          >
            <Plus className="h-4 w-4 mr-1" />
            Create Release on GitHub
            <ExternalLink className="h-3 w-3 ml-auto" />
          </Button>

          {/* Entries List */}
          {changelogLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
            </div>
          ) : changelogEntries.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="text-muted-foreground hig-body mb-2">No releases yet</div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(`https://github.com/${process.env.NEXT_PUBLIC_GITHUB_REPO || 'dmayes77/clientflow'}/releases/new`, "_blank")}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Create your first release
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {changelogEntries.map(entry => (
                <ChangelogEntryCard
                  key={entry.id}
                  entry={entry}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
