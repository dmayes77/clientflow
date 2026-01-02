"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  useWorkflows,
  useCreateWorkflow,
  useUpdateWorkflow,
  useDeleteWorkflow,
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
  Plus,
  Pencil,
  Trash2,
  Copy,
  Play,
  Tag,
  UserCheck,
  Clock,
  ArrowRight,
  Settings,
  Megaphone,
  Rocket,
  Loader2,
  ChevronRight,
  Calendar,
  CheckCircle,
  XCircle,
  DollarSign,
} from "lucide-react";
import { useMediaQuery } from "@/lib/hooks/use-media-query";
import { EmptyState } from "@/components/ui/empty-state";

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

export function WorkflowsList() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("workflows");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [workflowToDelete, setWorkflowToDelete] = useState(null);
  const isMobile = useMediaQuery("(max-width: 639px)");

  // TanStack Query hooks
  const { data: workflows = [], isLoading } = useWorkflows();
  const createWorkflow = useCreateWorkflow();
  const updateWorkflow = useUpdateWorkflow();
  const deleteWorkflow = useDeleteWorkflow();

  const handleDuplicate = async (workflow) => {
    try {
      const newWorkflow = await createWorkflow.mutateAsync({
        name: `${workflow.name} (Copy)`,
        description: workflow.description || "",
        triggerType: workflow.triggerType,
        triggerTagId: workflow.triggerTagId || null,
        delayMinutes: workflow.delayMinutes || 0,
        actions: workflow.actions || [],
        active: false, // Start as inactive
      });
      toast.success("Workflow duplicated");
      router.push(`/dashboard/workflows/${newWorkflow.id}`);
    } catch (error) {
      toast.error("Failed to duplicate workflow");
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

  if (isLoading) {
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
      <>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={activeTab === "workflows" ? "default" : "outline"}
              onClick={() => setActiveTab("workflows")}
              className="flex-1 sm:flex-initial h-8.5 sm:h-9"
            >
              <Settings className="size-4.25 sm:size-4.5 mr-1.5" />
              Workflows
            </Button>
            <Button
              size="sm"
              variant={activeTab === "campaigns" ? "default" : "outline"}
              onClick={() => setActiveTab("campaigns")}
              className="flex-1 sm:flex-initial h-8.5 sm:h-9"
            >
              <Megaphone className="size-4.25 sm:size-4.5 mr-1.5" />
              Campaigns
            </Button>
          </div>

          {activeTab === "workflows" && (
            <Button
              size="sm"
              onClick={() => router.push("/dashboard/workflows/new")}
              className="w-full sm:w-auto h-8.5 sm:h-9"
            >
              <Plus className="size-4.25 sm:size-4.5 mr-1.5" />
              {isMobile ? "New" : "Create Workflow"}
            </Button>
          )}
        </div>

        {activeTab === "workflows" && (
          workflows.length === 0 ? (
            <Card className="py-3 sm:py-4 md:py-6">
              <CardContent className="py-8 sm:py-12">
                <EmptyState
                  icon={Settings}
                  iconColor="violet"
                  title="No workflows yet"
                  description="Create workflows to automate actions. For example, send an email when a &quot;hot-lead&quot; tag is added."
                  actionLabel="Create Your First Workflow"
                  actionIcon={<Plus className="size-4 mr-1.5" />}
                  onAction={() => router.push("/dashboard/workflows/new")}
                />
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
                      onClick={() => router.push(`/dashboard/workflows/${workflow.id}`)}
                    >
                      {/* Icon with status indicator */}
                      <div className={cn(
                        "size-11 rounded-full flex items-center justify-center shrink-0",
                        workflow.active ? "bg-indigo-100" : "bg-gray-100"
                      )}>
                        <TriggerIcon className={cn("size-5.5", workflow.active ? "text-indigo-600" : "text-gray-400")} />
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
                            <span className="hig-caption-2 text-muted-foreground shrink-0">
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
                <Card
                  key={workflow.id}
                  className="py-4 overflow-hidden cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => router.push(`/dashboard/workflows/${workflow.id}`)}
                >
                  <CardContent className="pt-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 sm:gap-3 min-w-0 flex-1">
                        <Switch
                          checked={workflow.active}
                          onCheckedChange={() => handleToggleActive(workflow)}
                          onClick={(e) => e.stopPropagation()}
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
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/dashboard/workflows/${workflow.id}`);
                          }}
                          className="h-7 w-7"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicate(workflow);
                          }}
                          className="h-7 w-7"
                          disabled={createWorkflow.isPending}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        {!workflow.isSystem && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              setWorkflowToDelete(workflow);
                              setDeleteDialogOpen(true);
                            }}
                            className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>

                    <Separator className="my-3" />

                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="hig-caption-2 text-muted-foreground">Trigger:</span>
                        <Badge variant="secondary">
                          {TRIGGER_TYPES.find((t) => t.value === workflow.triggerType)?.label || workflow.triggerType}
                        </Badge>
                        {workflow.isSystem && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            System
                          </Badge>
                        )}
                        {workflow.triggerTag && (
                          <Badge className="bg-indigo-100 text-indigo-700">
                            {workflow.triggerTag.name}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="flex items-center gap-1.5">
                          <span className="hig-caption-2 text-muted-foreground">Actions:</span>
                          <Badge variant="secondary" className="bg-indigo-100 text-indigo-700">
                            {workflow.actions?.length || 0}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="hig-caption-2 text-muted-foreground">Runs:</span>
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
          )
        )}

        {activeTab === "campaigns" && (
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
        )}
      </>

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
