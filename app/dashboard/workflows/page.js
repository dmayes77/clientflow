"use client";

import { useState, useEffect } from "react";
import { notifications } from "@mantine/notifications";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Input,
  Label,
  Textarea,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Separator,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui";
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

export default function WorkflowsPage() {
  const [activeTab, setActiveTab] = useState("workflows");
  const [workflows, setWorkflows] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState(null);
  const [actions, setActions] = useState([]);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    triggerType: "tag_added",
    triggerTagId: "",
    delayMinutes: "0",
    active: true,
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [workflowsRes, tagsRes] = await Promise.all([
        fetch("/api/workflows"),
        fetch("/api/tags"),
      ]);

      if (workflowsRes.ok) {
        const workflowsData = await workflowsRes.json();
        setWorkflows(workflowsData);
      }
      if (tagsRes.ok) {
        const tagsData = await tagsRes.json();
        setTags(tagsData);
      }
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to fetch data",
        color: "red",
      });
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (actions.length === 0) {
      notifications.show({
        title: "Error",
        message: "Please add at least one action",
        color: "red",
      });
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
        notifications.show({
          title: "Success",
          message: `Workflow ${editingWorkflow ? "updated" : "created"} successfully`,
          color: "green",
        });
        handleCloseModal();
        fetchData();
      } else {
        const data = await response.json();
        throw new Error(data.error || "Failed to save workflow");
      }
    } catch (error) {
      notifications.show({
        title: "Error",
        message: error.message || "Failed to save workflow",
        color: "red",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (workflow) => {
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
    setErrors({});
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this workflow?")) return;

    try {
      const response = await fetch(`/api/workflows/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        notifications.show({
          title: "Success",
          message: "Workflow deleted successfully",
          color: "green",
        });
        fetchData();
      } else {
        throw new Error("Failed to delete workflow");
      }
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to delete workflow",
        color: "red",
      });
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
        setWorkflows((prev) =>
          prev.map((w) =>
            w.id === workflow.id ? { ...w, active: !w.active } : w
          )
        );
      }
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to update workflow",
        color: "red",
      });
    }
  };

  const addAction = (type) => {
    const newAction = {
      type,
      config: getDefaultConfig(type),
    };
    setActions([...actions, newAction]);
  };

  const updateAction = (index, config) => {
    const updated = [...actions];
    updated[index].config = { ...updated[index].config, ...config };
    setActions(updated);
  };

  const removeAction = (index) => {
    setActions(actions.filter((_, i) => i !== index));
  };

  const getDefaultConfig = (type) => {
    switch (type) {
      case "send_email":
        return { subject: "", body: "" };
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
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingWorkflow(null);
    setFormData({
      name: "",
      description: "",
      triggerType: "tag_added",
      triggerTagId: "",
      delayMinutes: "0",
      active: true,
    });
    setActions([]);
    setErrors({});
  };

  const needsTagSelection = formData.triggerType === "tag_added" || formData.triggerType === "tag_removed";

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
        <p className="text-xs text-zinc-500">Loading workflows...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900">Workflows</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Automate actions and manage campaigns
          </p>
        </div>
        {activeTab === "workflows" && (
          <Button
            size="sm"
            onClick={() => {
              setEditingWorkflow(null);
              setFormData({
                name: "",
                description: "",
                triggerType: "tag_added",
                triggerTagId: "",
                delayMinutes: "0",
                active: true,
              });
              setActions([]);
              setErrors({});
              setModalOpen(true);
            }}
            className="text-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Create Workflow
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="workflows" className="text-xs">
            <Settings className="h-3.5 w-3.5 mr-1.5" />
            Workflows
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="text-xs">
            <Megaphone className="h-3.5 w-3.5 mr-1.5" />
            Campaigns
          </TabsTrigger>
        </TabsList>

        <TabsContent value="workflows" className="mt-4">
          {workflows.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                    <Settings className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-900">No workflows yet</p>
                    <p className="text-xs text-zinc-500 mt-1 max-w-sm">
                      Create workflows to automate actions. For example, send an email when a "hot-lead" tag is added.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      setEditingWorkflow(null);
                      setFormData({
                        name: "",
                        description: "",
                        triggerType: "tag_added",
                        triggerTagId: "",
                        delayMinutes: "0",
                        active: true,
                      });
                      setActions([]);
                      setModalOpen(true);
                    }}
                    className="text-xs mt-2"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    Create Your First Workflow
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {workflows.map((workflow) => (
                <Card key={workflow.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <Switch
                          checked={workflow.active}
                          onCheckedChange={() => handleToggleActive(workflow)}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-zinc-900">{workflow.name}</span>
                            {!workflow.active && (
                              <Badge variant="secondary" className="text-[0.625rem]">Inactive</Badge>
                            )}
                          </div>
                          {workflow.description && (
                            <p className="text-xs text-zinc-500 mt-0.5">{workflow.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(workflow)}
                          className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(workflow.id)}
                          className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    <Separator className="my-3" />

                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[0.625rem] text-zinc-500">Trigger:</span>
                        <Badge variant="secondary" className="text-[0.625rem]">
                          {TRIGGER_TYPES.find((t) => t.value === workflow.triggerType)?.label || workflow.triggerType}
                        </Badge>
                        {workflow.triggerTag && (
                          <Badge className="text-[0.625rem] bg-purple-100 text-purple-700">
                            {workflow.triggerTag.name}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[0.625rem] text-zinc-500">Actions:</span>
                        <Badge variant="secondary" className="text-[0.625rem] bg-purple-100 text-purple-700">
                          {workflow.actions?.length || 0}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[0.625rem] text-zinc-500">Runs:</span>
                        <Badge variant="secondary" className="text-[0.625rem]">
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

        <TabsContent value="campaigns" className="mt-4">
          <Card>
            <CardContent className="py-12">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="h-16 w-16 rounded-full bg-linear-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                  <Megaphone className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-zinc-900 mb-1">Campaign Workflows</h2>
                  <Badge className="text-[0.625rem] bg-linear-to-r from-indigo-500 to-violet-600 text-white border-0">
                    Coming Soon
                  </Badge>
                </div>
                <p className="text-xs text-zinc-500 max-w-md">
                  Campaign workflows will allow you to create multi-step marketing campaigns with automated email sequences,
                  SMS messages, and targeted follow-ups to nurture leads and engage clients.
                </p>
                <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4 w-full max-w-sm">
                  <p className="text-xs font-semibold text-zinc-900 mb-2">Planned Features:</p>
                  <div className="space-y-2">
                    {["Drip email campaigns", "Multi-channel sequences", "A/B testing for messages", "Campaign analytics & reporting"].map((feature) => (
                      <div key={feature} className="flex items-center gap-2">
                        <div className="h-5 w-5 rounded-full bg-indigo-100 flex items-center justify-center">
                          <Rocket className="h-3 w-3 text-indigo-600" />
                        </div>
                        <span className="text-xs text-zinc-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Workflow Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">
              {editingWorkflow ? "Edit Workflow" : "Create Workflow"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">
                  Workflow Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="e.g., Hot Lead Follow-up"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={cn("text-xs", errors.name && "border-red-500")}
                />
                {errors.name && (
                  <p className="text-[0.625rem] text-red-500">{errors.name}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Description (optional)</Label>
                <Textarea
                  placeholder="What does this workflow do?"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="text-xs"
                />
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-zinc-500">Trigger</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">When should this workflow run?</Label>
                <Select
                  value={formData.triggerType}
                  onValueChange={(value) => setFormData({ ...formData, triggerType: value })}
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRIGGER_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value} className="text-xs">
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {needsTagSelection && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">
                    Select Tag <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.triggerTagId}
                    onValueChange={(value) => setFormData({ ...formData, triggerTagId: value })}
                  >
                    <SelectTrigger className={cn("text-xs", errors.triggerTagId && "border-red-500")}>
                      <SelectValue placeholder="Choose a tag" />
                    </SelectTrigger>
                    <SelectContent>
                      {tags.map((t) => (
                        <SelectItem key={t.id} value={t.id} className="text-xs">
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.triggerTagId && (
                    <p className="text-[0.625rem] text-red-500">{errors.triggerTagId}</p>
                  )}
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Delay (minutes)</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.delayMinutes}
                  onChange={(e) => setFormData({ ...formData, delayMinutes: e.target.value })}
                  className="text-xs"
                />
                <p className="text-[0.625rem] text-zinc-500">Wait this many minutes before executing</p>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-zinc-500">Actions</span>
                </div>
              </div>

              {actions.length === 0 ? (
                <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4">
                  <p className="text-xs text-zinc-500 text-center">
                    No actions added yet. Add an action below.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {actions.map((action, index) => {
                    const actionType = ACTION_TYPES.find((a) => a.value === action.type);
                    const Icon = actionType?.icon || Settings;

                    return (
                      <div key={index} className="border border-zinc-200 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-zinc-100 flex items-center justify-center">
                              <Icon className="h-3 w-3 text-zinc-600" />
                            </div>
                            <span className="text-xs font-medium">{actionType?.label || action.type}</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAction(index)}
                            className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>

                        {action.type === "send_email" && (
                          <div className="space-y-2">
                            <Input
                              placeholder="Email subject"
                              value={action.config.subject || ""}
                              onChange={(e) => updateAction(index, { subject: e.target.value })}
                              className="text-xs"
                            />
                            <Textarea
                              placeholder="Email body (use {{client.name}}, {{client.email}}, {{business.name}})"
                              rows={2}
                              value={action.config.body || ""}
                              onChange={(e) => updateAction(index, { body: e.target.value })}
                              className="text-xs"
                            />
                          </div>
                        )}
                        {(action.type === "add_tag" || action.type === "remove_tag") && (
                          <Select
                            value={action.config.tagId || ""}
                            onValueChange={(value) => updateAction(index, { tagId: value })}
                          >
                            <SelectTrigger className="text-xs">
                              <SelectValue placeholder="Select tag" />
                            </SelectTrigger>
                            <SelectContent>
                              {tags.map((t) => (
                                <SelectItem key={t.id} value={t.id} className="text-xs">
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
                            <SelectTrigger className="text-xs">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              {LEAD_STATUSES.map((s) => (
                                <SelectItem key={s.value} value={s.value} className="text-xs">
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
                            className="text-xs"
                          />
                        )}
                        {action.type === "wait" && (
                          <Input
                            type="number"
                            min="1"
                            placeholder="Minutes to wait"
                            value={action.config.minutes || 60}
                            onChange={(e) => updateAction(index, { minutes: parseInt(e.target.value) || 60 })}
                            className="text-xs"
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
                      className="text-[0.625rem] h-7"
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
                  <Label className="text-xs font-medium">Active</Label>
                  <p className="text-[0.625rem] text-zinc-500">Enable or disable this workflow</p>
                </div>
                <Switch
                  checked={formData.active}
                  onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCloseModal}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={saving} className="text-xs">
                {saving && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
                {editingWorkflow ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
