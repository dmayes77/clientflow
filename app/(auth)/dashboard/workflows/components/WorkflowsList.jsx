"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/app/(auth)/components/ui/card";
import { Button } from "@/app/(auth)/components/ui/button";
import { Badge } from "@/app/(auth)/components/ui/badge";
import { Input } from "@/app/(auth)/components/ui/input";
import { Label } from "@/app/(auth)/components/ui/label";
import { Textarea } from "@/app/(auth)/components/ui/textarea";
import { Switch } from "@/app/(auth)/components/ui/switch";
import { Separator } from "@/app/(auth)/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/(auth)/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/(auth)/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/(auth)/components/ui/select";
import {
  Plus,
  Pencil,
  Trash2,
  Play,
  Tag,
  Mail,
  Bell,
  UserCheck,
  Clock,
  ArrowRight,
  Settings,
  Megaphone,
  Rocket,
  Loader2,
  X,
} from "lucide-react";

const TRIGGER_TYPES = [
  { value: "tag_added", label: "When tag is added", icon: Tag },
  { value: "tag_removed", label: "When tag is removed", icon: Tag },
  { value: "lead_created", label: "When lead is created", icon: UserCheck },
  { value: "booking_created", label: "When booking is created", icon: Play },
  { value: "client_converted", label: "When lead converts to client", icon: ArrowRight },
];

const ACTION_TYPES = [
  { value: "send_email", label: "Send Email", icon: Mail },
  { value: "add_tag", label: "Add Tag", icon: Tag },
  { value: "remove_tag", label: "Remove Tag", icon: Tag },
  { value: "update_status", label: "Update Status", icon: UserCheck },
  { value: "send_notification", label: "Send Notification", icon: Bell },
  { value: "wait", label: "Wait", icon: Clock },
];

const LEAD_STATUSES = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "quoted", label: "Quoted" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
];

const initialFormState = {
  name: "",
  description: "",
  triggerType: "tag_added",
  triggerTagId: "",
  delayMinutes: "0",
  active: true,
};

function getDefaultConfig(type) {
  switch (type) {
    case "send_email":
      return { templateId: "" };
    case "add_tag":
    case "remove_tag":
      return { tagId: "" };
    case "update_status":
      return { status: "contacted" };
    case "send_notification":
      return { message: "" };
    case "wait":
      return { minutes: 60 };
    default:
      return {};
  }
}

export function WorkflowsList() {
  const [activeTab, setActiveTab] = useState("workflows");
  const [workflows, setWorkflows] = useState([]);
  const [tags, setTags] = useState([]);
  const [emailTemplates, setEmailTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState(null);
  const [workflowToDelete, setWorkflowToDelete] = useState(null);
  const [actions, setActions] = useState([]);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [workflowsRes, tagsRes, templatesRes] = await Promise.all([
        fetch("/api/workflows"),
        fetch("/api/tags"),
        fetch("/api/email-templates"),
      ]);

      if (workflowsRes.ok) {
        const workflowsData = await workflowsRes.json();
        setWorkflows(workflowsData);
      }
      if (tagsRes.ok) {
        const tagsData = await tagsRes.json();
        setTags(tagsData);
      }
      if (templatesRes.ok) {
        const templatesData = await templatesRes.json();
        setEmailTemplates(templatesData);
      }
    } catch (error) {
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name || formData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }
    if ((formData.triggerType === "tag_added" || formData.triggerType === "tag_removed") && !formData.triggerTagId) {
      newErrors.triggerTagId = "Please select a trigger tag";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleOpenDialog = (workflow = null) => {
    if (workflow) {
      setEditingWorkflow(workflow);
      setFormData({
        name: workflow.name,
        description: workflow.description || "",
        triggerType: workflow.triggerType,
        triggerTagId: workflow.triggerTagId || "",
        delayMinutes: String(workflow.delayMinutes || 0),
        active: workflow.active,
      });
      setActions(workflow.actions || []);
    } else {
      setEditingWorkflow(null);
      setFormData(initialFormState);
      setActions([]);
    }
    setErrors({});
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingWorkflow(null);
    setFormData(initialFormState);
    setActions([]);
    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (actions.length === 0) {
      toast.error("Please add at least one action");
      return;
    }

    setSaving(true);
    try {
      const url = editingWorkflow ? `/api/workflows/${editingWorkflow.id}` : "/api/workflows";
      const method = editingWorkflow ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          delayMinutes: parseInt(formData.delayMinutes) || 0,
          actions,
        }),
      });

      if (response.ok) {
        const savedWorkflow = await response.json();
        if (editingWorkflow) {
          setWorkflows(workflows.map((w) => (w.id === savedWorkflow.id ? savedWorkflow : w)));
          toast.success("Workflow updated");
        } else {
          setWorkflows([savedWorkflow, ...workflows]);
          toast.success("Workflow created");
        }
        handleCloseDialog();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to save workflow");
      }
    } catch (error) {
      toast.error("Failed to save workflow");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (workflow) => {
    try {
      const response = await fetch(`/api/workflows/${workflow.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !workflow.active }),
      });

      if (response.ok) {
        setWorkflows(workflows.map((w) =>
          w.id === workflow.id ? { ...w, active: !w.active } : w
        ));
      } else {
        toast.error("Failed to update workflow");
      }
    } catch (error) {
      toast.error("Failed to update workflow");
    }
  };

  const handleDelete = async () => {
    if (!workflowToDelete) return;

    try {
      const response = await fetch(`/api/workflows/${workflowToDelete.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setWorkflows(workflows.filter((w) => w.id !== workflowToDelete.id));
        toast.success("Workflow deleted");
      } else {
        toast.error("Failed to delete workflow");
      }
    } catch (error) {
      toast.error("Failed to delete workflow");
    } finally {
      setDeleteDialogOpen(false);
      setWorkflowToDelete(null);
    }
  };

  const addAction = (type) => {
    setActions([...actions, { type, config: getDefaultConfig(type) }]);
  };

  const updateAction = (index, config) => {
    const updated = [...actions];
    updated[index].config = { ...updated[index].config, ...config };
    setActions(updated);
  };

  const removeAction = (index) => {
    setActions(actions.filter((_, i) => i !== index));
  };

  const needsTagSelection = formData.triggerType === "tag_added" || formData.triggerType === "tag_removed";

  if (loading) {
    return (
      <Card className="py-4 md:py-6">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="workflows" className="gap-1.5">
              <Settings className="h-3.5 w-3.5" />
              Workflows
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="gap-1.5">
              <Megaphone className="h-3.5 w-3.5" />
              Campaigns
            </TabsTrigger>
          </TabsList>

          {activeTab === "workflows" && (
            <Button size="sm" onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-1" />
              Create Workflow
            </Button>
          )}
        </div>

        <TabsContent value="workflows" className="mt-0">
          {workflows.length === 0 ? (
            <Card className="py-4 md:py-6">
              <CardContent className="py-12">
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                    <Settings className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">No workflows yet</h3>
                    <p className="et-small text-muted-foreground mt-1 max-w-sm">
                      Create workflows to automate actions. For example, send an email when a "hot-lead" tag is added.
                    </p>
                  </div>
                  <Button size="sm" onClick={() => handleOpenDialog()} className="mt-2">
                    <Plus className="h-4 w-4 mr-1" />
                    Create Your First Workflow
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {workflows.map((workflow) => (
                <Card key={workflow.id} className="py-4">
                  <CardContent className="pt-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <Switch
                          checked={workflow.active}
                          onCheckedChange={() => handleToggleActive(workflow)}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{workflow.name}</span>
                            {!workflow.active && (
                              <Badge variant="secondary">Inactive</Badge>
                            )}
                          </div>
                          {workflow.description && (
                            <p className="et-small text-muted-foreground mt-0.5">{workflow.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(workflow)}
                          className="h-7 w-7"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setWorkflowToDelete(workflow);
                            setDeleteDialogOpen(true);
                          }}
                          className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    <Separator className="my-3" />

                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <span className="et-caption text-muted-foreground">Trigger:</span>
                        <Badge variant="secondary">
                          {TRIGGER_TYPES.find((t) => t.value === workflow.triggerType)?.label || workflow.triggerType}
                        </Badge>
                        {workflow.triggerTag && (
                          <Badge className="bg-indigo-100 text-indigo-700">
                            {workflow.triggerTag.name}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="et-caption text-muted-foreground">Actions:</span>
                        <Badge variant="secondary" className="bg-indigo-100 text-indigo-700">
                          {workflow.actions?.length || 0}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="et-caption text-muted-foreground">Runs:</span>
                        <Badge variant="secondary">
                          {workflow._count?.runs || 0}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="campaigns" className="mt-0">
          <Card className="py-4 md:py-6">
            <CardContent className="py-12">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                  <Megaphone className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h2 className="font-semibold mb-1">Campaign Workflows</h2>
                  <Badge className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white border-0">
                    Coming Soon
                  </Badge>
                </div>
                <p className="et-small text-muted-foreground max-w-md">
                  Campaign workflows will allow you to create multi-step marketing campaigns with automated email sequences,
                  SMS messages, and targeted follow-ups to nurture leads and engage clients.
                </p>
                <div className="bg-muted/50 border rounded-lg p-4 w-full max-w-sm">
                  <p className="et-small font-semibold mb-2">Planned Features:</p>
                  <div className="space-y-2">
                    {["Drip email campaigns", "Multi-channel sequences", "A/B testing for messages", "Campaign analytics & reporting"].map((feature) => (
                      <div key={feature} className="flex items-center gap-2">
                        <div className="h-5 w-5 rounded-full bg-indigo-100 flex items-center justify-center">
                          <Rocket className="h-3 w-3 text-indigo-600" />
                        </div>
                        <span className="et-small">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingWorkflow ? "Edit Workflow" : "Create Workflow"}
            </DialogTitle>
            <DialogDescription>
              {editingWorkflow ? "Update the workflow settings" : "Create a new automated workflow"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Workflow Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="e.g., Hot Lead Follow-up"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={cn(errors.name && "border-red-500")}
                />
                {errors.name && (
                  <p className="et-caption text-red-500">{errors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="What does this workflow do?"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-background px-2 et-caption text-muted-foreground uppercase">Trigger</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>When should this workflow run?</Label>
                <Select
                  value={formData.triggerType}
                  onValueChange={(value) => setFormData({ ...formData, triggerType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRIGGER_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {needsTagSelection && (
                <div className="space-y-2">
                  <Label>
                    Select Tag <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.triggerTagId}
                    onValueChange={(value) => setFormData({ ...formData, triggerTagId: value })}
                  >
                    <SelectTrigger className={cn(errors.triggerTagId && "border-red-500")}>
                      <SelectValue placeholder="Choose a tag" />
                    </SelectTrigger>
                    <SelectContent>
                      {tags.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.triggerTagId && (
                    <p className="et-caption text-red-500">{errors.triggerTagId}</p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="delay">Delay (minutes)</Label>
                <Input
                  id="delay"
                  type="number"
                  min="0"
                  value={formData.delayMinutes}
                  onChange={(e) => setFormData({ ...formData, delayMinutes: e.target.value })}
                />
                <p className="et-caption text-muted-foreground">Wait this many minutes before executing</p>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-background px-2 et-caption text-muted-foreground uppercase">Actions</span>
                </div>
              </div>

              {actions.length === 0 ? (
                <div className="bg-muted/50 border rounded-lg p-4">
                  <p className="et-small text-muted-foreground text-center">
                    No actions added yet. Add an action below.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {actions.map((action, index) => {
                    const actionType = ACTION_TYPES.find((a) => a.value === action.type);
                    const Icon = actionType?.icon || Settings;

                    return (
                      <div key={index} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                              <Icon className="h-3 w-3" />
                            </div>
                            <span className="et-small font-medium">{actionType?.label || action.type}</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeAction(index)}
                            className="h-6 w-6 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>

                        {action.type === "send_email" && (
                          <div className="space-y-2">
                            <Select
                              value={action.config.templateId || ""}
                              onValueChange={(value) => updateAction(index, { templateId: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select email template" />
                              </SelectTrigger>
                              <SelectContent>
                                {emailTemplates.length === 0 ? (
                                  <div className="px-2 py-4 text-center">
                                    <p className="et-small text-muted-foreground">No templates found</p>
                                    <a
                                      href="/dashboard/email-templates"
                                      className="et-caption text-primary hover:underline"
                                    >
                                      Create one
                                    </a>
                                  </div>
                                ) : (
                                  emailTemplates.map((t) => (
                                    <SelectItem key={t.id} value={t.id}>
                                      {t.name}
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                            {action.config.templateId && (
                              <p className="et-caption text-muted-foreground">
                                Subject: {emailTemplates.find((t) => t.id === action.config.templateId)?.subject}
                              </p>
                            )}
                          </div>
                        )}
                        {(action.type === "add_tag" || action.type === "remove_tag") && (
                          <Select
                            value={action.config.tagId || ""}
                            onValueChange={(value) => updateAction(index, { tagId: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select tag" />
                            </SelectTrigger>
                            <SelectContent>
                              {tags.map((t) => (
                                <SelectItem key={t.id} value={t.id}>
                                  {t.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        {action.type === "update_status" && (
                          <Select
                            value={action.config.status || ""}
                            onValueChange={(value) => updateAction(index, { status: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              {LEAD_STATUSES.map((s) => (
                                <SelectItem key={s.value} value={s.value}>
                                  {s.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        {action.type === "send_notification" && (
                          <Input
                            placeholder="Notification message"
                            value={action.config.message || ""}
                            onChange={(e) => updateAction(index, { message: e.target.value })}
                          />
                        )}
                        {action.type === "wait" && (
                          <Input
                            type="number"
                            min="1"
                            placeholder="Minutes to wait"
                            value={action.config.minutes || 60}
                            onChange={(e) => updateAction(index, { minutes: parseInt(e.target.value) || 60 })}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex flex-wrap gap-1.5">
                {ACTION_TYPES.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Button
                      key={action.value}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addAction(action.value)}
                    >
                      <Icon className="h-3 w-3 mr-1" />
                      {action.label}
                    </Button>
                  );
                })}
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label>Active</Label>
                  <p className="et-caption text-muted-foreground">Enable or disable this workflow</p>
                </div>
                <Switch
                  checked={formData.active}
                  onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingWorkflow ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Workflow</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{workflowToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
