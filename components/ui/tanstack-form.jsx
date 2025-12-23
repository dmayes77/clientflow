"use client";

import * as React from "react";
import { useForm } from "@tanstack/react-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Context for sharing form instance
const FormContext = React.createContext(null);

export function useFormContext() {
  const context = React.useContext(FormContext);
  if (!context) {
    throw new Error("useFormContext must be used within a FormProvider");
  }
  return context;
}

// Form Provider wrapper
export function FormProvider({ form, children }) {
  return <FormContext.Provider value={form}>{children}</FormContext.Provider>;
}

// Hook to create a TanStack Form with Zod validation
export function useTanstackForm({ defaultValues, onSubmit, validators }) {
  return useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      await onSubmit({ value });
    },
    validatorAdapter: zodValidator(),
    validators,
  });
}

// Base field wrapper component
function FieldWrapper({
  label,
  description,
  error,
  required,
  icon: Icon,
  className,
  children,
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label className={cn("flex items-center gap-2", error && "text-destructive")}>
          {Icon && <Icon className="h-4 w-4" />}
          {label}
          {required && <span className="text-destructive">*</span>}
        </Label>
      )}
      {children}
      {description && !error && (
        <p className="hig-caption2 text-muted-foreground">{description}</p>
      )}
      {error && <p className="hig-caption2 text-destructive">{error}</p>}
    </div>
  );
}

// Text Input Field
export function TextField({
  form,
  name,
  label,
  description,
  placeholder,
  type = "text",
  required,
  icon,
  className,
  inputClassName,
  disabled,
  validators,
}) {
  return (
    <form.Field name={name} validators={validators}>
      {(field) => (
        <FieldWrapper
          label={label}
          description={description}
          error={field.state.meta.isTouched && field.state.meta.errors[0]}
          required={required}
          icon={icon}
          className={className}
        >
          <Input
            id={field.name}
            name={field.name}
            type={type}
            placeholder={placeholder}
            value={field.state.value ?? ""}
            onChange={(e) => field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
            disabled={disabled}
            className={cn(
              field.state.meta.isTouched && field.state.meta.errors[0] && "border-destructive",
              inputClassName
            )}
          />
        </FieldWrapper>
      )}
    </form.Field>
  );
}

// Number Input Field
export function NumberField({
  form,
  name,
  label,
  description,
  placeholder,
  required,
  icon,
  className,
  inputClassName,
  disabled,
  min,
  max,
  step,
  validators,
}) {
  return (
    <form.Field name={name} validators={validators}>
      {(field) => (
        <FieldWrapper
          label={label}
          description={description}
          error={field.state.meta.isTouched && field.state.meta.errors[0]}
          required={required}
          icon={icon}
          className={className}
        >
          <Input
            id={field.name}
            name={field.name}
            type="number"
            placeholder={placeholder}
            value={field.state.value ?? ""}
            onChange={(e) => field.handleChange(parseFloat(e.target.value) || 0)}
            onBlur={field.handleBlur}
            disabled={disabled}
            min={min}
            max={max}
            step={step}
            className={cn(
              field.state.meta.isTouched && field.state.meta.errors[0] && "border-destructive",
              inputClassName
            )}
          />
        </FieldWrapper>
      )}
    </form.Field>
  );
}

// Textarea Field
export function TextareaField({
  form,
  name,
  label,
  description,
  placeholder,
  required,
  icon,
  className,
  textareaClassName,
  disabled,
  rows = 3,
  validators,
}) {
  return (
    <form.Field name={name} validators={validators}>
      {(field) => (
        <FieldWrapper
          label={label}
          description={description}
          error={field.state.meta.isTouched && field.state.meta.errors[0]}
          required={required}
          icon={icon}
          className={className}
        >
          <Textarea
            id={field.name}
            name={field.name}
            placeholder={placeholder}
            value={field.state.value ?? ""}
            onChange={(e) => field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
            disabled={disabled}
            rows={rows}
            className={cn(
              field.state.meta.isTouched && field.state.meta.errors[0] && "border-destructive",
              textareaClassName
            )}
          />
        </FieldWrapper>
      )}
    </form.Field>
  );
}

// Select Field
export function SelectField({
  form,
  name,
  label,
  description,
  placeholder = "Select...",
  required,
  icon,
  className,
  disabled,
  options = [],
  validators,
}) {
  return (
    <form.Field name={name} validators={validators}>
      {(field) => (
        <FieldWrapper
          label={label}
          description={description}
          error={field.state.meta.isTouched && field.state.meta.errors[0]}
          required={required}
          icon={icon}
          className={className}
        >
          <Select
            value={field.state.value ?? ""}
            onValueChange={field.handleChange}
            disabled={disabled}
          >
            <SelectTrigger
              className={cn(
                field.state.meta.isTouched && field.state.meta.errors[0] && "border-destructive"
              )}
            >
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldWrapper>
      )}
    </form.Field>
  );
}

// Switch Field
export function SwitchField({
  form,
  name,
  label,
  description,
  className,
  disabled,
  validators,
}) {
  return (
    <form.Field name={name} validators={validators}>
      {(field) => (
        <div className={cn("flex items-center justify-between rounded-lg border p-3", className)}>
          <div>
            {label && <Label htmlFor={field.name} className="font-medium">{label}</Label>}
            {description && (
              <p className="text-muted-foreground">{description}</p>
            )}
          </div>
          <Switch
            id={field.name}
            checked={field.state.value ?? false}
            onCheckedChange={field.handleChange}
            disabled={disabled}
          />
        </div>
      )}
    </form.Field>
  );
}

// Checkbox Field
export function CheckboxField({
  form,
  name,
  label,
  description,
  className,
  disabled,
  validators,
}) {
  return (
    <form.Field name={name} validators={validators}>
      {(field) => (
        <div className={cn("flex items-start space-x-2", className)}>
          <Checkbox
            id={field.name}
            checked={field.state.value ?? false}
            onCheckedChange={field.handleChange}
            disabled={disabled}
          />
          <div className="grid gap-1.5 leading-none">
            {label && (
              <Label htmlFor={field.name} className="cursor-pointer">
                {label}
              </Label>
            )}
            {description && (
              <p className="text-muted-foreground hig-caption2">{description}</p>
            )}
          </div>
        </div>
      )}
    </form.Field>
  );
}

// Checkbox Group Field (for multi-select via checkboxes)
export function CheckboxGroupField({
  form,
  name,
  label,
  description,
  className,
  options = [],
  validators,
}) {
  return (
    <form.Field name={name} validators={validators}>
      {(field) => {
        const values = field.state.value ?? [];

        const handleToggle = (value) => {
          const newValues = values.includes(value)
            ? values.filter((v) => v !== value)
            : [...values, value];
          field.handleChange(newValues);
        };

        return (
          <FieldWrapper
            label={label}
            description={description}
            error={field.state.meta.isTouched && field.state.meta.errors[0]}
            className={className}
          >
            <div className="rounded-md border p-3 space-y-2 max-h-[200px] overflow-y-auto">
              {options.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${field.name}-${option.value}`}
                    checked={values.includes(option.value)}
                    onCheckedChange={() => handleToggle(option.value)}
                  />
                  <label
                    htmlFor={`${field.name}-${option.value}`}
                    className="font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                  >
                    {option.label}
                    {option.extra && (
                      <span className="text-muted-foreground ml-2">{option.extra}</span>
                    )}
                  </label>
                </div>
              ))}
            </div>
            <p className="hig-caption2 text-muted-foreground">
              {values.length} item{values.length !== 1 ? "s" : ""} selected
            </p>
          </FieldWrapper>
        );
      }}
    </form.Field>
  );
}

// Price Field (handles cents conversion)
export function PriceField({
  form,
  name,
  label,
  description,
  required,
  icon,
  className,
  disabled,
  validators,
}) {
  return (
    <form.Field name={name} validators={validators}>
      {(field) => (
        <FieldWrapper
          label={label}
          description={description}
          error={field.state.meta.isTouched && field.state.meta.errors[0]}
          required={required}
          icon={icon}
          className={className}
        >
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
            <Input
              id={field.name}
              name={field.name}
              type="number"
              min="0"
              step="0.01"
              value={field.state.value ?? 0}
              onChange={(e) => field.handleChange(parseFloat(e.target.value) || 0)}
              onBlur={field.handleBlur}
              disabled={disabled}
              className={cn(
                "pl-7",
                field.state.meta.isTouched && field.state.meta.errors[0] && "border-destructive"
              )}
            />
          </div>
        </FieldWrapper>
      )}
    </form.Field>
  );
}

// Duration Field (minutes input)
export function DurationField({
  form,
  name,
  label,
  description,
  required,
  icon,
  className,
  disabled,
  validators,
}) {
  return (
    <form.Field name={name} validators={validators}>
      {(field) => (
        <FieldWrapper
          label={label}
          description={description}
          error={field.state.meta.isTouched && field.state.meta.errors[0]}
          required={required}
          icon={icon}
          className={className}
        >
          <div className="relative">
            <Input
              id={field.name}
              name={field.name}
              type="number"
              min="0"
              step="5"
              value={field.state.value ?? 0}
              onChange={(e) => field.handleChange(parseInt(e.target.value) || 0)}
              onBlur={field.handleBlur}
              disabled={disabled}
              className={cn(
                "pr-16",
                field.state.meta.isTouched && field.state.meta.errors[0] && "border-destructive"
              )}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              minutes
            </span>
          </div>
        </FieldWrapper>
      )}
    </form.Field>
  );
}

// Submit Button component
export function SubmitButton({
  form,
  children,
  className,
  variant = "default",
  loadingText = "Saving...",
}) {
  return (
    <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
      {([canSubmit, isSubmitting]) => (
        <button
          type="submit"
          disabled={!canSubmit || isSubmitting}
          className={cn(
            "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            "disabled:pointer-events-none disabled:opacity-50",
            variant === "default" && "bg-primary text-primary-foreground shadow hover:bg-primary/90",
            variant === "success" && "bg-green-600 text-white shadow hover:bg-green-700",
            variant === "destructive" && "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
            "h-9 px-4 py-2",
            className
          )}
        >
          {isSubmitting ? loadingText : children}
        </button>
      )}
    </form.Subscribe>
  );
}
