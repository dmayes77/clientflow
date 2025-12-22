"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";

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
function RoadmapItemCard({ item, onEdit, onDelete }) {
  const statusConfig = STATUS_CONFIG[item.status] || STATUS_CONFIG.planned;
  const StatusIcon = statusConfig.icon;

  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2">
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
        <div className="flex items-center justify-between mt-2">
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

// Changelog Components
function ChangelogEntryCard({ entry, onEdit, onDelete, onPublish }) {
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
              {entry.content.substring(0, 100)}...
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
          <span className="hig-caption2 text-muted-foreground">
            {entry.publishedAt ? `Published ${formatDate(entry.publishedAt)}` : `Created ${formatDate(entry.createdAt)}`}
          </span>
          <div className="flex gap-1">
            {!entry.published && (
              <Button variant="ghost" size="sm" className="h-6 px-2 hig-caption2" onClick={() => onPublish(entry.id)}>
                <Send className="h-3 w-3 mr-1" />
                Publish
              </Button>
            )}
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => onEdit(entry)}>
              <Edit2 className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive" onClick={() => onDelete(entry.id)}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ChangelogEditor({ entry, onSave, onCancel }) {
  const [form, setForm] = useState({
    version: entry?.version || "",
    title: entry?.title || "",
    content: entry?.content || "",
    type: entry?.type || "feature",
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave({ ...form, id: entry?.id });
    setSaving(false);
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="hig-caption2">Version (optional)</Label>
          <Input
            value={form.version}
            onChange={(e) => setForm({ ...form, version: e.target.value })}
            placeholder="e.g., 1.2.0"
            className="h-9"
          />
        </div>
        <div className="space-y-1">
          <Label className="hig-caption2">Type</Label>
          <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="feature">Feature</SelectItem>
              <SelectItem value="improvement">Improvement</SelectItem>
              <SelectItem value="fix">Fix</SelectItem>
              <SelectItem value="breaking">Breaking Change</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1">
        <Label className="hig-caption2">Title</Label>
        <Input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="What's new..."
          className="h-9"
        />
      </div>
      <div className="space-y-1">
        <Label className="hig-caption2">Content (Markdown)</Label>
        <Textarea
          value={form.content}
          onChange={(e) => setForm({ ...form, content: e.target.value })}
          placeholder="Describe the changes in detail..."
          rows={6}
          className="font-mono hig-caption2"
        />
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
        <Button size="sm" onClick={handleSave} disabled={saving || !form.title || !form.content}>
          {saving ? "Saving..." : entry?.id ? "Update" : "Create"}
        </Button>
      </div>
    </div>
  );
}

export default function ContentManagementPage() {
  const [activeTab, setActiveTab] = useState("roadmap");

  // Roadmap state
  const [roadmapItems, setRoadmapItems] = useState([]);
  const [roadmapCounts, setRoadmapCounts] = useState({});
  const [roadmapLoading, setRoadmapLoading] = useState(true);
  const [editingRoadmap, setEditingRoadmap] = useState(null);
  const [showRoadmapDialog, setShowRoadmapDialog] = useState(false);

  // Changelog state
  const [changelogEntries, setChangelogEntries] = useState([]);
  const [changelogCounts, setChangelogCounts] = useState({});
  const [changelogLoading, setChangelogLoading] = useState(true);
  const [editingChangelog, setEditingChangelog] = useState(null);
  const [showChangelogDialog, setShowChangelogDialog] = useState(false);

  // Fetch roadmap items
  const fetchRoadmap = async () => {
    try {
      const res = await fetch("/api/admin/content/roadmap");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setRoadmapItems(data.items);
      setRoadmapCounts(data.statusCounts);
    } catch (err) {
      console.error(err);
    } finally {
      setRoadmapLoading(false);
    }
  };

  // Fetch changelog entries
  const fetchChangelog = async () => {
    try {
      const res = await fetch("/api/admin/content/changelog");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setChangelogEntries(data.entries);
      setChangelogCounts(data.counts);
    } catch (err) {
      console.error(err);
    } finally {
      setChangelogLoading(false);
    }
  };

  useEffect(() => {
    fetchRoadmap();
    fetchChangelog();
  }, []);

  // Roadmap handlers
  const handleSaveRoadmap = async (item) => {
    try {
      const method = item.id ? "PATCH" : "POST";
      const res = await fetch("/api/admin/content/roadmap", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!res.ok) throw new Error("Failed to save");
      setShowRoadmapDialog(false);
      setEditingRoadmap(null);
      fetchRoadmap();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteRoadmap = async (id) => {
    if (!confirm("Delete this roadmap item?")) return;
    try {
      await fetch(`/api/admin/content/roadmap?id=${id}`, { method: "DELETE" });
      fetchRoadmap();
    } catch (err) {
      console.error(err);
    }
  };

  // Changelog handlers
  const handleSaveChangelog = async (entry) => {
    try {
      const method = entry.id ? "PATCH" : "POST";
      const res = await fetch("/api/admin/content/changelog", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry),
      });
      if (!res.ok) throw new Error("Failed to save");
      setShowChangelogDialog(false);
      setEditingChangelog(null);
      fetchChangelog();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteChangelog = async (id) => {
    if (!confirm("Delete this changelog entry?")) return;
    try {
      await fetch(`/api/admin/content/changelog?id=${id}`, { method: "DELETE" });
      fetchChangelog();
    } catch (err) {
      console.error(err);
    }
  };

  const handlePublishChangelog = async (id) => {
    try {
      await fetch("/api/admin/content/changelog", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, published: true }),
      });
      fetchChangelog();
    } catch (err) {
      console.error(err);
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
          ) : roadmapItems.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No roadmap items yet
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {roadmapItems.map(item => (
                <RoadmapItemCard
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
          )}
        </TabsContent>

        {/* Changelog Tab */}
        <TabsContent value="changelog" className="space-y-4 mt-4">
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

          {/* Add Button */}
          <Dialog open={showChangelogDialog} onOpenChange={(v) => {
            setShowChangelogDialog(v);
            if (!v) setEditingChangelog(null);
          }}>
            <DialogTrigger asChild>
              <Button size="sm" className="w-full">
                <Plus className="h-4 w-4 mr-1" />
                Add Changelog Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingChangelog ? "Edit" : "New"} Changelog Entry</DialogTitle>
              </DialogHeader>
              <ChangelogEditor
                entry={editingChangelog}
                onSave={handleSaveChangelog}
                onCancel={() => {
                  setShowChangelogDialog(false);
                  setEditingChangelog(null);
                }}
              />
            </DialogContent>
          </Dialog>

          {/* Entries List */}
          {changelogLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
            </div>
          ) : changelogEntries.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No changelog entries yet
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {changelogEntries.map(entry => (
                <ChangelogEntryCard
                  key={entry.id}
                  entry={entry}
                  onEdit={(entry) => {
                    setEditingChangelog(entry);
                    setShowChangelogDialog(true);
                  }}
                  onDelete={handleDeleteChangelog}
                  onPublish={handlePublishChangelog}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
