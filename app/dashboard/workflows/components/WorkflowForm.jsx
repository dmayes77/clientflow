"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import {
  useWorkflow,
  useCreateWorkflow,
  useUpdateWorkflow,
  useTags,
  useEmailTemplates,
} from "@/lib/hooks";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Tag,
  Mail,
  Bell,
  UserCheck,
  Clock,
  ArrowRight,
  Settings,
  Loader2,
  X,
  Calendar,
  CheckCircle,
  XCircle,
  DollarSign,
  Play,
  ChevronLeft,
  FileText,
  CalendarCheck,
  Zap,
  AlertCircle,
  GripVertical,
} from "lucide-react";
import { BottomActionBar } from "@/components/ui/bottom-action-bar";

const TRIGGER_TYPES = [
  { value: "tag_added", label: "When tag is added", icon: Tag },
  { value: "tag_removed", label: "When tag is removed", icon: Tag },
  { value: "lead_created", label: "When lead is created", icon: UserCheck },
  { value: "booking_created", label: "When booking is created", icon: Play },
  { value: "booking_scheduled", label: "When booking is scheduled", icon: Calendar },
  { value: "booking_confirmed", label: "When booking is confirmed", icon: CheckCircle },
  { value: "booking_cancelled", label: "When booking is cancelled", icon: XCircle },
  { value: "client_converted", label: "When lead converts to client", icon: ArrowRight },
  { value: "payment_received", label: "When payment is received", icon: DollarSign },
  { value: "invoice_paid", label: "When invoice is paid", icon: DollarSign },
];

const ACTION_TYPES = [
  { value: "send_email", label: "Send Email", icon: Mail, color: "blue" },
  { value: "add_tag", label: "Add Tag", icon: Tag, color: "green" },
  { value: "remove_tag", label: "Remove Tag", icon: Tag, color: "red" },
  { value: "update_status", label: "Update Status", icon: UserCheck, color: "purple" },
  { value: "send_notification", label: "Send Notification", icon: Bell, color: "yellow" },
  { value: "wait", label: "Wait", icon: Clock, color: "gray" },
  { value: "create_invoice", label: "Create Invoice", icon: FileText, color: "indigo" },
  { value: "update_booking_status", label: "Update Booking", icon: CalendarCheck, color: "teal" },
  { value: "webhook", label: "Webhook", icon: Zap, color: "orange" },
];

const LEAD_STATUSES = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "quoted", label: "Quoted" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
];

const BOOKING_STATUSES = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "no_show", label: "No Show" },
];

const WEBHOOK_METHODS = [
  { value: "POST", label: "POST" },
  { value: "GET", label: "GET" },
  { value: "PUT", label: "PUT" },
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
    case "create_invoice":
      return { dueInDays: 30, includeBookingTotal: true };
    case "update_booking_status":
      return { status: "confirmed" };
    case "webhook":
      return { url: "", method: "POST", includePayload: true };
    default:
      return {};
  }
}

function isActionComplete(action) {
  const { type, config } = action;
  switch (type) {
    case "send_email":
      return !!config.templateId;
    case "add_tag":
    case "remove_tag":
      return !!config.tagId;
    case "update_status":
      return !!config.status;
    case "send_notification":
      return !!config.message?.trim();
    case "wait":
      return config.minutes > 0;
    case "create_invoice":
      return true; // Has sensible defaults
    case "update_booking_status":
      return !!config.status;
    case "webhook":
      return !!config.url?.trim();
    default:
      return true;
  }
}

function getActionError(action) {
  const { type, config } = action;
  switch (type) {
    case "send_email":
      return !config.templateId ? "Select an email template" : null;
    case "add_tag":
    case "remove_tag":
      return !config.tagId ? "Select a tag" : null;
    case "send_notification":
      return !config.message?.trim() ? "Enter a message" : null;
    case "webhook":
      return !config.url?.trim() ? "Enter a webhook URL" : null;
    default:
      return null;
  }
}

function SortableActionItem({ id, action, index, emailTemplates, tags, updateAction, removeAction }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const actionType = ACTION_TYPES.find((a) => a.value === action.type);
  const Icon = actionType?.icon || Settings;
  const colorClasses = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    red: "bg-red-100 text-red-600",
    purple: "bg-purple-100 text-purple-600",
    yellow: "bg-yellow-100 text-yellow-600",
    gray: "bg-gray-100 text-gray-600",
    indigo: "bg-indigo-100 text-indigo-600",
    teal: "bg-teal-100 text-teal-600",
    orange: "bg-orange-100 text-orange-600",
  };
  const iconColor = colorClasses[actionType?.color] || "bg-muted text-muted-foreground";
  const actionComplete = isActionComplete(action);
  const actionError = getActionError(action);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "border rounded-lg p-3",
        !actionComplete && "border-amber-300 bg-amber-50/50",
        isDragging && "shadow-lg"
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="cursor-grab active:cursor-grabbing touch-none p-0.5 -ml-1 text-muted-foreground hover:text-foreground"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <div className={cn("h-6 w-6 rounded-full flex items-center justify-center", iconColor)}>
            <Icon className="h-3 w-3" />
          </div>
          <span className="font-medium">{actionType?.label || action.type}</span>
          {!actionComplete && (
            <AlertCircle className="h-4 w-4 text-amber-500" />
          )}
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
      {actionError && (
        <p className="hig-caption-2 text-amber-600 mb-2">{actionError}</p>
      )}

      {action.type === "send_email" && (
        <div className="space-y-2">
          <Select
            value={action.config.templateId || ""}
            onValueChange={(value) => updateAction(index, { templateId: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select email template" />
            </SelectTrigger>
            <SelectContent position="popper" sideOffset={4}>
              {emailTemplates.length === 0 ? (
                <div className="px-2 py-4 text-center">
                  <p className="text-muted-foreground">No templates found</p>
                  <a
                    href="/dashboard/email-templates"
                    className="hig-caption-2 text-primary hover:underline"
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
            <p className="hig-caption-2 text-muted-foreground">
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
          <SelectContent position="popper" sideOffset={4}>
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
          <SelectContent position="popper" sideOffset={4}>
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
      {action.type === "create_invoice" && (
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="hig-caption-2">Due in (days)</Label>
            <Input
              type="number"
              min="1"
              placeholder="30"
              value={action.config.dueInDays || 30}
              onChange={(e) => updateAction(index, { dueInDays: parseInt(e.target.value) || 30 })}
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id={`include-booking-${index}`}
              checked={action.config.includeBookingTotal !== false}
              onCheckedChange={(checked) => updateAction(index, { includeBookingTotal: checked })}
            />
            <Label htmlFor={`include-booking-${index}`} className="hig-caption-2">
              Include booking total as line item
            </Label>
          </div>
        </div>
      )}
      {action.type === "update_booking_status" && (
        <Select
          value={action.config.status || "confirmed"}
          onValueChange={(value) => updateAction(index, { status: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select booking status" />
          </SelectTrigger>
          <SelectContent position="popper" sideOffset={4}>
            {BOOKING_STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {action.type === "webhook" && (
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="hig-caption-2">Webhook URL</Label>
            <Input
              type="url"
              placeholder="https://example.com/webhook"
              value={action.config.url || ""}
              onChange={(e) => updateAction(index, { url: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label className="hig-caption-2">Method</Label>
            <Select
              value={action.config.method || "POST"}
              onValueChange={(value) => updateAction(index, { method: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" sideOffset={4}>
                {WEBHOOK_METHODS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id={`include-payload-${index}`}
              checked={action.config.includePayload !== false}
              onCheckedChange={(checked) => updateAction(index, { includePayload: checked })}
            />
            <Label htmlFor={`include-payload-${index}`} className="hig-caption-2">
              Include context data in payload
            </Label>
          </div>
          <p className="hig-caption-2 text-muted-foreground">
            Sends contact, booking, and invoice data to your endpoint
          </p>
        </div>
      )}
    </div>
  );
}

export function WorkflowForm({ workflowId }) {
  const router = useRouter();
  const isEditing = !!workflowId;

  const [actions, setActions] = useState([]);
  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});

  // TanStack Query hooks
  const { data: workflow, isLoading: workflowLoading } = useWorkflow(workflowId);
  const { data: tags = [], isLoading: tagsLoading } = useTags();
  const { data: emailTemplates = [], isLoading: templatesLoading } = useEmailTemplates();
  const createWorkflow = useCreateWorkflow();
  const updateWorkflow = useUpdateWorkflow();

  const loading = (isEditing && workflowLoading) || tagsLoading || templatesLoading;

  // DnD sensors with activation distance to prevent accidental drags
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setActions((items) => {
        const oldIndex = items.findIndex((_, i) => `action-${i}` === active.id);
        const newIndex = items.findIndex((_, i) => `action-${i}` === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  // Populate form when workflow data loads
  useEffect(() => {
    if (workflow) {
      setFormData({
        name: workflow.name,
        description: workflow.description || "",
        triggerType: workflow.triggerType,
        triggerTagId: workflow.triggerTagId || "",
        delayMinutes: String(workflow.delayMinutes || 0),
        active: workflow.active,
      });
      setActions(workflow.actions || []);
    }
  }, [workflow]);

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
      toast.error("Please add at least one action");
      return;
    }

    const incompleteActions = actions.filter((a) => !isActionComplete(a));
    if (incompleteActions.length > 0) {
      toast.error(`${incompleteActions.length} action${incompleteActions.length > 1 ? "s" : ""} need configuration`);
      return;
    }

    const workflowData = {
      ...formData,
      delayMinutes: parseInt(formData.delayMinutes) || 0,
      actions,
    };

    try {
      if (isEditing) {
        await updateWorkflow.mutateAsync({
          id: workflowId,
          ...workflowData,
        });
        toast.success("Workflow updated");
      } else {
        await createWorkflow.mutateAsync(workflowData);
        toast.success("Workflow created");
      }
      router.push("/dashboard/workflows");
    } catch (error) {
      toast.error(error.message || "Failed to save workflow");
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
    <form onSubmit={handleSubmit}>
      <Card className="py-4 md:py-6">
        <CardContent className="space-y-4">
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
              <p className="hig-caption-2 text-red-500">{errors.name}</p>
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
              <span className="bg-card px-2 hig-caption-2 text-muted-foreground uppercase">Trigger</span>
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
              <SelectContent position="popper" sideOffset={4} className="max-h-50">
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
                <SelectContent position="popper" sideOffset={4}>
                  {tags.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.triggerTagId && (
                <p className="hig-caption-2 text-red-500">{errors.triggerTagId}</p>
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
            <p className="hig-caption-2 text-muted-foreground">Wait this many minutes before executing</p>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-card px-2 hig-caption-2 text-muted-foreground uppercase">Actions</span>
            </div>
          </div>

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
                >
                  <Icon className="h-3 w-3 mr-1 shrink-0" />
                  <span className="truncate">{action.label}</span>
                </Button>
              );
            })}
          </div>

          {actions.length === 0 ? (
            <div className="bg-muted/50 border rounded-lg p-4">
              <p className="text-muted-foreground text-center">
                No actions added yet. Add an action above.
              </p>
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={actions.map((_, i) => `action-${i}`)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {actions.map((action, index) => (
                    <SortableActionItem
                      key={`action-${index}`}
                      id={`action-${index}`}
                      action={action}
                      index={index}
                      emailTemplates={emailTemplates}
                      tags={tags}
                      updateAction={updateAction}
                      removeAction={removeAction}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label>Active</Label>
              <p className="hig-caption-2 text-muted-foreground">Enable or disable this workflow</p>
            </div>
            <Switch
              checked={formData.active}
              onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Desktop footer */}
      <div className="hidden sm:flex justify-end gap-2 mt-4">
        <Button type="button" variant="outline" onClick={() => router.push("/dashboard/workflows")}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={createWorkflow.isPending || updateWorkflow.isPending}
        >
          {(createWorkflow.isPending || updateWorkflow.isPending) && (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          )}
          {isEditing ? "Update Workflow" : "Create Workflow"}
        </Button>
      </div>

      {/* Mobile bottom action bar */}
      <BottomActionBar className="sm:hidden">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/dashboard/workflows")}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={createWorkflow.isPending || updateWorkflow.isPending}
          className="flex-1"
        >
          {(createWorkflow.isPending || updateWorkflow.isPending) && (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          )}
          {isEditing ? "Update" : "Create"}
        </Button>
      </BottomActionBar>
    </form>
  );
}
