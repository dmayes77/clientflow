"use client";

import { useState, useEffect } from "react";
import { useContactCustomFields, useSetContactCustomFields } from "@/lib/hooks";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Save, Sliders } from "lucide-react";

export function ContactCustomFields({ contactId }) {
  const { data: customFields = [], isLoading } = useContactCustomFields(contactId);
  const setCustomFieldsMutation = useSetContactCustomFields();
  const [fieldValues, setFieldValues] = useState({});
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize field values when data loads
  useEffect(() => {
    if (customFields.length > 0) {
      const initialValues = {};
      customFields.forEach((field) => {
        initialValues[field.id] = field.value || "";
      });
      setFieldValues(initialValues);
    }
  }, [customFields]);

  const handleFieldChange = (fieldId, value) => {
    setFieldValues((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      const values = Object.entries(fieldValues).map(([fieldId, value]) => ({
        fieldId,
        value,
      }));

      await setCustomFieldsMutation.mutateAsync({
        contactId,
        values,
      });

      toast.success("Custom fields saved");
      setHasChanges(false);
    } catch (error) {
      toast.error(error.message || "Failed to save custom fields");
    }
  };

  const renderField = (field) => {
    const value = fieldValues[field.id] || "";

    switch (field.fieldType) {
      case "text":
        return (
          <Input
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={`Enter ${field.name.toLowerCase()}`}
          />
        );

      case "number":
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={`Enter ${field.name.toLowerCase()}`}
          />
        );

      case "date":
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
          />
        );

      case "textarea":
        return (
          <Textarea
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={`Enter ${field.name.toLowerCase()}`}
            rows={3}
          />
        );

      case "select":
        return (
          <Select value={value} onValueChange={(val) => handleFieldChange(field.id, val)}>
            <SelectTrigger>
              <SelectValue placeholder={`Select ${field.name.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "multiselect":
        return (
          <div className="space-y-2">
            {field.options?.map((option) => {
              const selectedValues = value ? value.split(",") : [];
              const isChecked = selectedValues.includes(option);

              return (
                <div key={option} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${field.id}-${option}`}
                    checked={isChecked}
                    onCheckedChange={(checked) => {
                      let newValues;
                      if (checked) {
                        newValues = [...selectedValues, option];
                      } else {
                        newValues = selectedValues.filter((v) => v !== option);
                      }
                      handleFieldChange(field.id, newValues.join(","));
                    }}
                  />
                  <label
                    htmlFor={`${field.id}-${option}`}
                    className="text-sm cursor-pointer"
                  >
                    {option}
                  </label>
                </div>
              );
            })}
          </div>
        );

      case "boolean":
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={field.id}
              checked={value === "true" || value === true}
              onCheckedChange={(checked) => handleFieldChange(field.id, String(checked))}
            />
            <label htmlFor={field.id} className="text-sm cursor-pointer">
              {field.name}
            </label>
          </div>
        );

      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sliders className="h-5 w-5" />
            Custom Fields
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (customFields.length === 0) {
    return null; // Don't show card if no custom fields exist
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sliders className="h-5 w-5" />
              Custom Fields
            </CardTitle>
            <CardDescription>Additional information for this contact</CardDescription>
          </div>
          {hasChanges && (
            <Button size="sm" onClick={handleSave} disabled={setCustomFieldsMutation.isPending}>
              {setCustomFieldsMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-1" />
              )}
              Save
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {customFields.map((field) => (
            <div key={field.id} className="space-y-2">
              <Label>
                {field.name}
                {field.required && <span className="text-destructive ml-1">*</span>}
              </Label>
              {renderField(field)}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
