"use client";

import { useState } from "react";
import { useCustomFields, useCreateCustomField, useUpdateCustomField, useDeleteCustomField } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Trash2, Edit, Sliders, Loader2 } from "lucide-react";

export default function CustomFieldsPage() {
  const { data: customFields = [], isLoading } = useCustomFields();
  const createMutation = useCreateCustomField();
  const updateMutation = useUpdateCustomField();
  const deleteMutation = useDeleteCustomField();

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    key: "",
    group: "",
    fieldType: "text",
    options: "",
    required: false,
    active: true,
  });

  const handleOpenSheet = (field = null) => {
    if (field) {
      setEditingField(field);
      setFormData({
        name: field.name,
        key: field.key,
        group: field.group || "",
        fieldType: field.fieldType,
        options: field.options?.join(", ") || "",
        required: field.required,
        active: field.active,
      });
    } else {
      setEditingField(null);
      setFormData({
        name: "",
        key: "",
        group: "",
        fieldType: "text",
        options: "",
        required: false,
        active: true,
      });
    }
    setIsSheetOpen(true);
  };

  const generateKey = (name) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
  };

  const handleNameChange = (name) => {
    setFormData((prev) => ({
      ...prev,
      name,
      key: editingField ? prev.key : generateKey(name),
    }));
  };

  const handleSave = async () => {
    try {
      const data = {
        name: formData.name,
        key: formData.key,
        group: formData.group || null,
        fieldType: formData.fieldType,
        required: formData.required,
        active: formData.active,
      };

      // Parse options if field type is select/multiselect
      if (formData.fieldType === "select" || formData.fieldType === "multiselect") {
        data.options = formData.options
          .split(",")
          .map((opt) => opt.trim())
          .filter((opt) => opt);
      }

      if (editingField) {
        await updateMutation.mutateAsync({ id: editingField.id, ...data });
        toast.success("Custom field updated");
      } else {
        await createMutation.mutateAsync(data);
        toast.success("Custom field created");
      }

      setIsSheetOpen(false);
    } catch (error) {
      toast.error(error.message || "Failed to save custom field");
    }
  };

  const handleDelete = async (field) => {
    if (!confirm(`Delete custom field "${field.name}"?`)) return;

    try {
      await deleteMutation.mutateAsync(field.id);
      toast.success("Custom field deleted");
    } catch (error) {
      toast.error(error.message || "Failed to delete custom field");
    }
  };

  const fieldTypeLabels = {
    text: "Text",
    number: "Number",
    date: "Date",
    select: "Dropdown",
    multiselect: "Checkboxes",
    boolean: "Checkbox",
    textarea: "Long Text",
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold">Custom Fields</h1>
          <p className="text-muted-foreground">Create custom fields for your contacts</p>
        </div>
        <Button onClick={() => handleOpenSheet()}>
          <Plus className="h-4 w-4 mr-2" />
          New Field
        </Button>
      </div>

      {customFields.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Sliders className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No custom fields yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create custom fields to capture additional information about your contacts
            </p>
            <Button onClick={() => handleOpenSheet()}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Field
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {customFields.map((field) => (
            <Card key={field.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{field.name}</CardTitle>
                    <CardDescription className="flex items-center gap-2 flex-wrap">
                      <code className="text-xs bg-muted px-2 py-0.5 rounded">{field.key}</code>
                      {field.group && <Badge variant="secondary">{field.group}</Badge>}
                      <Badge variant="outline">{fieldTypeLabels[field.fieldType]}</Badge>
                      {field.required && <Badge variant="destructive">Required</Badge>}
                      {!field.active && <Badge variant="secondary">Inactive</Badge>}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleOpenSheet(field)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(field)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {field.options && field.options.length > 0 && (
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground mb-2">Options:</p>
                  <div className="flex flex-wrap gap-1">
                    {field.options.map((option) => (
                      <Badge key={option} variant="secondary">
                        {option}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="flex flex-col">
          <SheetHeader>
            <SheetTitle>{editingField ? "Edit" : "Create"} Custom Field</SheetTitle>
            <SheetDescription>
              {editingField
                ? "Update the custom field details"
                : "Add a new custom field for your contacts"}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-4">
            <div className="space-y-4 mt-6">
            <div className="space-y-2">
              <Label htmlFor="name">Field Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g., Pet Name, Property Address"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="key">Field Key *</Label>
              <Input
                id="key"
                value={formData.key}
                onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                placeholder="e.g., pet_name, property_address"
                disabled={!!editingField}
              />
              <p className="text-xs text-muted-foreground">
                {editingField ? "Key cannot be changed after creation" : "Auto-generated from name"}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="group">Group (Optional)</Label>
              <Input
                id="group"
                value={formData.group}
                onChange={(e) => setFormData({ ...formData, group: e.target.value })}
                placeholder="e.g., Vehicle Information, Emergency Contact"
              />
              <p className="text-xs text-muted-foreground">
                Group related fields together for better organization
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fieldType">Field Type *</Label>
              <Select value={formData.fieldType} onValueChange={(value) => setFormData({ ...formData, fieldType: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text (single line)</SelectItem>
                  <SelectItem value="textarea">Long Text (multi-line)</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="select">Dropdown (single choice)</SelectItem>
                  <SelectItem value="multiselect">Checkboxes (multiple choice)</SelectItem>
                  <SelectItem value="boolean">Checkbox (yes/no)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(formData.fieldType === "select" || formData.fieldType === "multiselect") && (
              <div className="space-y-2">
                <Label htmlFor="options">Options *</Label>
                <Input
                  id="options"
                  value={formData.options}
                  onChange={(e) => setFormData({ ...formData, options: e.target.value })}
                  placeholder="Option 1, Option 2, Option 3"
                />
                <p className="text-xs text-muted-foreground">Separate options with commas</p>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Checkbox
                id="required"
                checked={formData.required}
                onCheckedChange={(checked) => setFormData({ ...formData, required: checked })}
              />
              <Label htmlFor="required" className="cursor-pointer">
                Required field
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="active"
                checked={formData.active}
                onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
              />
              <Label htmlFor="active" className="cursor-pointer">
                Active
              </Label>
            </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setIsSheetOpen(false)}>
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSave}
                  disabled={!formData.name || !formData.key || createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  {editingField ? "Update" : "Create"}
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
