"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { GripVertical, Trash2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * SortableListItem - Reusable drag-and-drop list item
 *
 * @param {object} props
 * @param {string} props.id - Unique ID for the sortable item
 * @param {React.ReactNode} props.children - Content to display
 * @param {function} props.onRemove - Called when remove button clicked
 * @param {boolean} props.showCheckIcon - Show check icon before content
 * @param {boolean} props.showRemoveButton - Show remove button (default: true)
 * @param {string} props.className - Additional classes for wrapper
 * @param {boolean} props.disabled - Disable drag and remove
 * @param {React.ReactNode} props.leadingContent - Content before the main content
 * @param {React.ReactNode} props.trailingContent - Content after main content (before remove)
 */
export function SortableListItem({
  id,
  children,
  onRemove,
  showCheckIcon = false,
  showRemoveButton = true,
  className,
  disabled = false,
  leadingContent,
  trailingContent,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 p-3 bg-muted/30 rounded-lg border hover:bg-muted/50 transition-colors group",
        isDragging && "bg-muted/70 z-10",
        disabled && "opacity-50",
        className
      )}
    >
      {/* Drag handle */}
      {!disabled && (
        <div
          {...attributes}
          {...listeners}
          className="shrink-0 touch-none cursor-grab active:cursor-grabbing p-1 -m-1"
          aria-label="Drag to reorder"
          role="button"
          tabIndex={0}
        >
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </div>
      )}

      {/* Leading content or check icon */}
      {leadingContent}
      {showCheckIcon && !leadingContent && (
        <Check className="h-4 w-4 text-green-600 shrink-0" />
      )}

      {/* Main content */}
      <span className="flex-1 text-sm min-w-0">{children}</span>

      {/* Trailing content */}
      {trailingContent}

      {/* Remove button */}
      {showRemoveButton && onRemove && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
          onClick={() => onRemove(id)}
          disabled={disabled}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

/**
 * SortableIncludeItem - Specialized version for includes lists
 * Convenience component that matches the existing pattern in ServiceForm/PackageForm
 */
export function SortableIncludeItem({ id, item, index, onRemove }) {
  return (
    <SortableListItem
      id={id}
      onRemove={() => onRemove(typeof index === "number" ? index : item)}
      showCheckIcon
    >
      {item}
    </SortableListItem>
  );
}
