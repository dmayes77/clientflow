"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

/**
 * PreviewSheet - A reusable bottom sheet for previewing items with actions
 *
 * @param {boolean} open - Whether the sheet is open
 * @param {function} onOpenChange - Callback when open state changes
 * @param {string} title - Sheet title (for accessibility)
 * @param {React.ReactNode} header - Header content (avatar, name, etc.)
 * @param {React.ReactNode} children - Body content
 * @param {React.ReactNode} actions - Action bar content
 * @param {number} actionColumns - Number of action columns (default: 5)
 * @param {boolean} scrollable - Whether body content should be scrollable
 * @param {string} className - Additional classes for the sheet content
 */
export function PreviewSheet({
  open,
  onOpenChange,
  title = "Preview",
  header,
  children,
  actions,
  actionColumns = 5,
  scrollable = false,
  className = "",
}) {
  const gridColsClass = actionColumns === 4 ? "grid-cols-4" : "grid-cols-5";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className={cn(
          "rounded-t-2xl px-0 pb-0",
          scrollable ? "h-[85vh] flex flex-col" : "h-auto max-h-[85vh]",
          className
        )}
      >
        <SheetHeader className="sr-only">
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>

        {/* Drag Handle */}
        <div className="flex justify-center pt-2 pb-3 shrink-0 hig-safe-top">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        <div className={cn("flex flex-col", scrollable && "flex-1 min-h-0")}>
          {/* Header */}
          {header && (
            <div className="px-5 pb-3 shrink-0">
              {header}
            </div>
          )}

          {/* Body Content */}
          {scrollable ? (
            <ScrollArea className="flex-1 min-h-0">
              {children}
            </ScrollArea>
          ) : (
            <div className="flex-1 overflow-y-auto">
              {children}
            </div>
          )}

          {/* Actions */}
          {actions && (
            <div className={cn("border-t bg-muted/30 px-5 py-2 grid gap-1 shrink-0", gridColsClass)}>
              {actions}
            </div>
          )}

          {/* Safe area padding for mobile */}
          <div className="hig-safe-bottom" />
        </div>
      </SheetContent>
    </Sheet>
  );
}

/**
 * PreviewSheetAction - A single action button for the PreviewSheet
 */
export function PreviewSheetAction({
  icon: Icon,
  label,
  onClick,
  href,
  className = "",
  iconClassName = "",
  disabled = false,
}) {
  const content = (
    <>
      <Icon className={cn("h-5 w-5", iconClassName || "text-foreground")} />
      <span className="hig-caption-2">{label}</span>
    </>
  );

  const baseClass = cn(
    "flex flex-col items-center gap-0.5 py-1.5 hig-touch-target focus-visible:outline-none",
    disabled && "opacity-40 cursor-not-allowed",
    className
  );

  if (href && !disabled) {
    return (
      <a href={href} className={baseClass}>
        {content}
      </a>
    );
  }

  return (
    <button className={baseClass} onClick={disabled ? undefined : onClick} disabled={disabled}>
      {content}
    </button>
  );
}

/**
 * PreviewSheetHeader - Standard header layout with avatar and info
 */
export function PreviewSheetHeader({
  avatar,
  avatarClassName = "",
  children,
}) {
  return (
    <div className="flex items-center gap-3">
      {avatar && (
        <div className={`shrink-0 size-12 rounded-full flex items-center justify-center hig-subheadline font-semibold ${avatarClassName}`}>
          {avatar}
        </div>
      )}
      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  );
}

/**
 * PreviewSheetContent - Container for body content with consistent padding
 */
export function PreviewSheetContent({ children, className = "" }) {
  return (
    <div className={`px-8 space-y-3 pb-4 ${className}`}>
      {children}
    </div>
  );
}

/**
 * PreviewSheetSection - A section within the preview sheet body (no padding, use inside PreviewSheetContent)
 */
export function PreviewSheetSection({ children, className = "" }) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}

/**
 * PreviewSheetStats - A row of stat cards
 */
export function PreviewSheetStats({ children }) {
  return (
    <div className="grid grid-cols-3 gap-2 text-center">
      {children}
    </div>
  );
}

/**
 * PreviewSheetStat - A single stat card
 */
export function PreviewSheetStat({ value, label }) {
  return (
    <div className="bg-muted/50 rounded-lg py-1.5">
      <div className="hig-subheadline font-semibold">{value}</div>
      <div className="hig-caption-2 text-muted-foreground">{label}</div>
    </div>
  );
}
