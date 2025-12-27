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
  const [errors, setErrors] = useState({});

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

  const validateField = (field, value) => {
    if (field.required) {
      if (!value || (typeof value === 'string' && !value.trim())) {
        return `${field.name} is required`;
      }
    }
    return null;
  };

  const validateAllFields = () => {
    const newErrors = {};
    let isValid = true;

    customFields.forEach((field) => {
      const value = fieldValues[field.id] || "";
      const error = validateField(field, value);
      if (error) {
        newErrors[field.id] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleFieldChange = (fieldId, value) => {
    setFieldValues((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
    setHasChanges(true);

    // Clear error for this field when user starts typing
    const field = customFields.find((f) => f.id === fieldId);
    if (field) {
      const error = validateField(field, value);
      setErrors((prev) => {
        const newErrors = { ...prev };
        if (error) {
          newErrors[fieldId] = error;
        } else {
          delete newErrors[fieldId];
        }
        return newErrors;
      });
    }
  };

  const handleSave = async () => {
    // Validate all fields before saving
    if (!validateAllFields()) {
      toast.error("Please fill in all required custom fields");
      return;
    }

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
    const error = errors[field.id];
    const errorId = `${field.id}-error`;

    switch (field.fieldType) {
      case "text":
        return (
          <>
            <Input
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              placeholder={`Enter ${field.name.toLowerCase()}`}
              className={error ? "border-red-500 focus-visible:ring-red-500" : ""}
              aria-invalid={!!error}
              aria-describedby={error ? errorId : undefined}
            />
            {error && <p id={errorId} className="text-sm text-red-500">{error}</p>}
          </>
        );

      case "number":
        return (
          <>
            <Input
              type="number"
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              placeholder={`Enter ${field.name.toLowerCase()}`}
              className={error ? "border-red-500 focus-visible:ring-red-500" : ""}
              aria-invalid={!!error}
              aria-describedby={error ? errorId : undefined}
            />
            {error && <p id={errorId} className="text-sm text-red-500">{error}</p>}
          </>
        );

      case "date":
        return (
          <>
            <Input
              type="date"
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              className={error ? "border-red-500 focus-visible:ring-red-500" : ""}
              aria-invalid={!!error}
              aria-describedby={error ? errorId : undefined}
            />
            {error && <p id={errorId} className="text-sm text-red-500">{error}</p>}
          </>
        );

      case "textarea":
        return (
          <>
            <Textarea
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              placeholder={`Enter ${field.name.toLowerCase()}`}
              rows={3}
              className={error ? "border-red-500 focus-visible:ring-red-500" : ""}
              aria-invalid={!!error}
              aria-describedby={error ? errorId : undefined}
            />
            {error && <p id={errorId} className="text-sm text-red-500">{error}</p>}
          </>
        );

      case "select":
        return (
          <>
            <Select value={value} onValueChange={(val) => handleFieldChange(field.id, val)}>
              <SelectTrigger
                className={error ? "border-red-500 focus:ring-red-500" : ""}
                aria-invalid={!!error}
                aria-describedby={error ? errorId : undefined}
              >
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
            {error && <p id={errorId} className="text-sm text-red-500">{error}</p>}
          </>
        );

      case "multiselect":
        return (
          <div className="space-y-2">
            <div className={error ? "border border-red-500 rounded-md p-2" : ""}>
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
                      aria-invalid={!!error}
                      aria-describedby={error ? errorId : undefined}
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
            {error && <p id={errorId} className="text-sm text-red-500">{error}</p>}
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
            <Button
              size="sm"
              onClick={handleSave}
              disabled={setCustomFieldsMutation.isPending || Object.keys(errors).length > 0}
            >
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
        <div className="space-y-6">
          {/* Ungrouped fields */}
          {customFields.filter((f) => !f.group).length > 0 && (
            <div className="space-y-4">
              {customFields
                .filter((f) => !f.group)
                .sort((a, b) => a.order - b.order)
                .map((field) => (
                  <div key={field.id} className="space-y-2">
                    <Label>
                      {field.name}
                      {field.required && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    {renderField(field)}
                  </div>
                ))}
            </div>
          )}

          {/* Grouped fields */}
          {Object.entries(
            customFields
              .filter((f) => f.group)
              .reduce((acc, field) => {
                const group = field.group;
                if (!acc[group]) acc[group] = [];
                acc[group].push(field);
                return acc;
              }, {})
          ).map(([groupName, fields]) => {
            // Sort fields within group by order
            const sortedFields = [...fields].sort((a, b) => a.order - b.order);
            return (
            <div key={groupName} className="space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b">
                <h4 className="font-semibold text-sm">{groupName}</h4>
              </div>
              <div className="grid grid-cols-1 tablet:grid-cols-2 desktop:grid-cols-3 gap-4">
                {sortedFields.map((field) => (
                  <div key={field.id} className="space-y-2">
                    <Label>
                      {field.name}
                      {field.required && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    {renderField(field)}
                  </div>
                ))}
              </div>
            </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
