"use client";

import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/ui/sidebar";

/**
 * Height of the bottom action bar including padding.
 * Use this to add bottom padding to content that sits behind the bar.
 * Example: <div className="pb-20"> or style={{ paddingBottom: BOTTOM_ACTION_BAR_HEIGHT }}
 */
export const BOTTOM_ACTION_BAR_HEIGHT = 80; // ~5rem (h-20)

/**
 * BottomActionBar - Fixed footer for form/page actions
 *
 * A mobile-first, fixed-to-bottom action bar for primary page actions.
 * Handles safe-area-inset for mobile devices and adjusts for sidebar on desktop.
 *
 * @example
 * // Basic usage
 * <BottomActionBar>
 *   <Button variant="outline" onClick={onCancel}>Cancel</Button>
 *   <Button onClick={onSave}>Save</Button>
 * </BottomActionBar>
 *
 * @example
 * // With left/right grouping
 * <BottomActionBar
 *   left={<Button variant="destructive">Delete</Button>}
 * >
 *   <Button variant="outline">Cancel</Button>
 *   <Button>Save</Button>
 * </BottomActionBar>
 */
export function BottomActionBar({
  children,
  left,
  className,
  contentClassName,
}) {
  const { open: sidebarOpen } = useSidebar();

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0",
        "pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] px-4",
        "border-t bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80",
        "z-50 transition-[left] duration-200",
        sidebarOpen && "md:left-64",
        className
      )}
    >
      <div className={cn(
        "flex items-center gap-2 md:gap-3",
        left ? "justify-between" : "justify-end",
        contentClassName
      )}>
        {left && (
          <div className="flex items-center gap-2">
            {left}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * BottomActionBarSpacer - Adds appropriate spacing at the bottom of content
 *
 * Place this at the end of scrollable content to ensure nothing
 * is hidden behind the BottomActionBar.
 *
 * @example
 * <div className="overflow-auto">
 *   {content}
 *   <BottomActionBarSpacer />
 * </div>
 */
export function BottomActionBarSpacer({ className }) {
  return <div className={cn("h-20", className)} />;
}
