"use client";

import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useWorkflows,
  useCreateWorkflow,
  useUpdateWorkflow,
  useDeleteWorkflow,
  useTags,
  useEmailTemplates,
} from "@/lib/hooks";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
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
  ChevronRight,
} from "lucide-react";
import { useMediaQuery } from "@/lib/hooks/use-media-query";
import {
  useTanstackForm,
  TextField,
  TextareaField,
  NumberField,
  SwitchField,
  SubmitButton,
} from "@/components/ui/tanstack-form";

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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState(null);
  const [workflowToDelete, setWorkflowToDelete] = useState(null);
  const [actions, setActions] = useState([]);
  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});
  const isMobile = useMediaQuery("(max-width: 639px)");

  // TanStack Query hooks
  const { data: workflows = [], isLoading: workflowsLoading } = useWorkflows();
  const { data: tags = [], isLoading: tagsLoading } = useTags();
  const { data: emailTemplates = [], isLoading: templatesLoading } = useEmailTemplates();
  const createWorkflow = useCreateWorkflow();
  const updateWorkflow = useUpdateWorkflow();
  const deleteWorkflow = useDeleteWorkflow();

  const loading = workflowsLoading || tagsLoading || templatesLoading;

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

    const workflowData = {
      ...formData,
      delayMinutes: parseInt(formData.delayMinutes) || 0,
      actions,
    };

    try {
      if (editingWorkflow) {
        await updateWorkflow.mutateAsync({
          id: editingWorkflow.id,
          ...workflowData,
        });
        toast.success("Workflow updated");
      } else {
        await createWorkflow.mutateAsync(workflowData);
        toast.success("Workflow created");
      }
      handleCloseDialog();
    } catch (error) {
      toast.error(error.message || "Failed to save workflow");
    }
  };

  const handleToggleActive = async (workflow) => {
    try {
      await updateWorkflow.mutateAsync({
        id: workflow.id,
        active: !workflow.active,
      });
    } catch (error) {
      toast.error("Failed to update workflow");
    }
  };

  const handleDelete = async () => {
    if (!workflowToDelete) return;

    try {
      await deleteWorkflow.mutateAsync(workflowToDelete.id);
      toast.success("Workflow deleted");
      setDeleteDialogOpen(false);
      setWorkflowToDelete(null);
    } catch (error) {
      toast.error("Failed to delete workflow");
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
          <TabsList className="h-[34px] sm:h-9 p-1">
            <TabsTrigger value="workflows" className="gap-1 sm:gap-1.5 h-[26px] sm:h-7 px-2.5 sm:px-3 rounded-md">
              <Settings className="size-[17px] sm:size-[18px]" />
              <span className="hidden sm:inline">Workflows</span>
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="gap-1 sm:gap-1.5 h-[26px] sm:h-7 px-2.5 sm:px-3 rounded-md">
              <Megaphone className="size-[17px] sm:size-[18px]" />
              <span className="hidden sm:inline">Campaigns</span>
            </TabsTrigger>
          </TabsList>

          {activeTab === "workflows" && (
            <Button size="sm" onClick={() => handleOpenDialog()} className="w-full sm:w-auto h-[34px] sm:h-9">
              <Plus className="size-[17px] sm:size-[18px] mr-1.5" />
              {isMobile ? "New" : "Create Workflow"}
            </Button>
          )}
        </div>

        <TabsContent value="workflows" className="mt-0">
          {workflows.length === 0 ? (
            <Card className="py-3 sm:py-4 md:py-6">
              <CardContent className="py-8 sm:py-12">
                <div className="flex flex-col items-center gap-2.5 sm:gap-3 text-center">
                  <div className="size-11 sm:size-14 rounded-full bg-indigo-100 flex items-center justify-center">
                    <Settings className="size-[22px] sm:size-7 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">No workflows yet</h3>
                    <p className="text-muted-foreground mt-0.5 sm:mt-1 max-w-sm">
                      Create workflows to automate actions. For example, send an email when a "hot-lead" tag is added.
                    </p>
                  </div>
                  <Button size="sm" onClick={() => handleOpenDialog()} className="mt-1.5 sm:mt-2 h-[34px] sm:h-9">
                    <Plus className="size-4 mr-1.5" />
                    Create Your First Workflow
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : isMobile ? (
            /* iOS-style Mobile List */
            <Card className="p-0 overflow-hidden">
              <div>
                {workflows.map((workflow, index) => {
                  const TriggerIcon = TRIGGER_TYPES.find((t) => t.value === workflow.triggerType)?.icon || Settings;
                  return (
                    <div
                      key={workflow.id}
                      className="flex items-center gap-3 pl-4 cursor-pointer hover:bg-muted/50 active:bg-muted transition-colors"
                      onClick={() => handleOpenDialog(workflow)}
                    >
                      {/* Icon with status indicator */}
                      <div className={cn(
                        "size-11 rounded-full flex items-center justify-center shrink-0",
                        workflow.active ? "bg-indigo-100" : "bg-gray-100"
                      )}>
                        <TriggerIcon className={cn("size-[22px]", workflow.active ? "text-indigo-600" : "text-gray-400")} />
                      </div>

                      {/* Content with iOS-style divider */}
                      <div className={cn(
                        "flex-1 min-w-0 flex items-center gap-2 py-3 pr-4",
                        index < workflows.length - 1 && "border-b border-border"
                      )}>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold truncate">{workflow.name}</span>
                            {!workflow.active && (
                              <Badge variant="secondary" className="shrink-0">Off</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-muted-foreground truncate">
                              {TRIGGER_TYPES.find((t) => t.value === workflow.triggerType)?.label || workflow.triggerType}
                            </span>
                            <span className="hig-caption2 text-muted-foreground shrink-0">
                              • {workflow.actions?.length || 0} action{(workflow.actions?.length || 0) !== 1 ? "s" : ""}
                            </span>
                          </div>
                        </div>
                        <Switch
                          checked={workflow.active}
                          onCheckedChange={(e) => {
                            e.stopPropagation?.();
                            handleToggleActive(workflow);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="shrink-0"
                        />
                        <ChevronRight className="size-5 text-muted-foreground/50 shrink-0" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          ) : (
            /* Desktop Card List */
            <div className="space-y-3">
              {workflows.map((workflow) => (
                <Card key={workflow.id} className="py-4 overflow-hidden">
                  <CardContent className="pt-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 sm:gap-3 min-w-0 flex-1">
                        <Switch
                          checked={workflow.active}
                          onCheckedChange={() => handleToggleActive(workflow)}
                          className="shrink-0 mt-0.5"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium truncate">{workflow.name}</span>
                            {!workflow.active && (
                              <Badge variant="secondary" className="shrink-0">Inactive</Badge>
                            )}
                          </div>
                          {workflow.description && (
                            <p className="text-muted-foreground mt-0.5 line-clamp-2">{workflow.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
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

                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="hig-caption2 text-muted-foreground">Trigger:</span>
                        <Badge variant="secondary">
                          {TRIGGER_TYPES.find((t) => t.value === workflow.triggerType)?.label || workflow.triggerType}
                        </Badge>
                        {workflow.triggerTag && (
                          <Badge className="bg-indigo-100 text-indigo-700">
                            {workflow.triggerTag.name}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="flex items-center gap-1.5">
                          <span className="hig-caption2 text-muted-foreground">Actions:</span>
                          <Badge variant="secondary" className="bg-indigo-100 text-indigo-700">
                            {workflow.actions?.length || 0}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="hig-caption2 text-muted-foreground">Runs:</span>
                          <Badge variant="secondary">
                            {workflow._count?.runs || 0}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="campaigns" className="mt-0">
          <Card className="py-4 md:py-6 overflow-hidden">
            <CardContent className="py-8 sm:py-12 px-4 sm:px-6">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-linear-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                  <Megaphone className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                </div>
                <div>
                  <h2 className="mb-1">Campaign Workflows</h2>
                  <Badge className="bg-linear-to-r from-indigo-500 to-violet-600 text-white border-0">
                    Coming Soon
                  </Badge>
                </div>
                <p className="text-muted-foreground max-w-md px-2">
                  Campaign workflows will allow you to create multi-step marketing campaigns with automated email sequences,
                  SMS messages, and targeted follow-ups to nurture leads and engage clients.
                </p>
                <div className="bg-muted/50 border rounded-lg p-4 w-full max-w-sm">
                  <p className="font-semibold mb-2">Planned Features:</p>
                  <div className="space-y-2">
                    {["Drip email campaigns", "Multi-channel sequences", "A/B testing for messages", "Campaign analytics & reporting"].map((feature) => (
                      <div key={feature} className="flex items-center gap-2">
                        <div className="h-5 w-5 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                          <Rocket className="h-3 w-3 text-indigo-600" />
                        </div>
                        <span className="text-left">{feature}</span>
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
                  <p className="hig-caption2 text-red-500">{errors.name}</p>
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
                  <span className="bg-background px-2 hig-caption2 text-muted-foreground uppercase">Trigger</span>
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
                    <p className="hig-caption2 text-red-500">{errors.triggerTagId}</p>
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
                <p className="hig-caption2 text-muted-foreground">Wait this many minutes before executing</p>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-background px-2 hig-caption2 text-muted-foreground uppercase">Actions</span>
                </div>
              </div>

              {actions.length === 0 ? (
                <div className="bg-muted/50 border rounded-lg p-4">
                  <p className="text-muted-foreground text-center">
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
                            <span className="font-medium">{actionType?.label || action.type}</span>
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
                                    <p className="text-muted-foreground">No templates found</p>
                                    <a
                                      href="/dashboard/email-templates"
                                      className="hig-caption2 text-primary hover:underline"
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
                              <p className="hig-caption2 text-muted-foreground">
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

              <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-1.5">
                {ACTION_TYPES.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Button
                      key={action.value}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addAction(action.value)}
                      className=""
                    >
                      <Icon className="h-3 w-3 mr-1 shrink-0" />
                      <span className="truncate">{action.label}</span>
                    </Button>
                  );
                })}
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label>Active</Label>
                  <p className="hig-caption2 text-muted-foreground">Enable or disable this workflow</p>
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
              <Button
                type="submit"
                disabled={createWorkflow.isPending || updateWorkflow.isPending}
              >
                {(createWorkflow.isPending || updateWorkflow.isPending) && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
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
