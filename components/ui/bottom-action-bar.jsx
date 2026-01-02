"use client";

import { Children } from "react";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/ui/sidebar";

/**
 * Height of the bottom action bar including padding.
 * Use this to add bottom padding to content that sits behind the bar.
 * Example: <div className="pb-20"> or style={{ paddingBottom: BOTTOM_ACTION_BAR_HEIGHT }}
 */
export const BOTTOM_ACTION_BAR_HEIGHT = 80; // ~5rem (h-20)

/**
 * ActionButtonGroup - Flexible button layout with equal-width buttons
 *
 * Renders buttons in a flex-wrap layout with equal widths (max 4 per row).
 * When there are 4+ buttons, automatically switches to icon-only mode.
 *
 * @example
 * <ActionButtonGroup left={<Button>Delete</Button>}>
 *   <Button>Cancel</Button>
 *   <Button>Save</Button>
 * </ActionButtonGroup>
 */
export function ActionButtonGroup({ children, left, className }) {
  // Use React.Children to properly handle children (works with fragments, arrays, single elements)
  const childrenArray = Children.toArray(children);

  // Count total buttons to determine grid columns (max 4 per row)
  const leftCount = left ? 1 : 0;
  const totalButtons = leftCount + childrenArray.length;
  const cols = Math.min(totalButtons, 4);

  // When 4+ buttons, show icon-only (hide text, keep svg icons)
  const iconOnlyClass = cols >= 4 && "[&_button]:gap-0 [&_button>*:not(svg)]:sr-only";

  return (
    <div
      className={cn(
        "grid gap-2",
        cols === 1 && "grid-cols-1",
        cols === 2 && "grid-cols-2",
        cols === 3 && "grid-cols-3",
        cols === 4 && "grid-cols-4",
        iconOnlyClass,
        className
      )}
    >
      {left && <div className="*:w-full *:h-full">{left}</div>}
      {childrenArray.map((child, i) => (
        <div key={i} className="*:w-full *:h-full">{child}</div>
      ))}
    </div>
  );
}

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
        // Desktop: right-align the action group
        "flex justify-end",
        sidebarOpen && "md:left-64",
        className
      )}
    >
      <ActionButtonGroup
        left={left}
        className={cn(
          // Mobile: full width, Desktop: max-width with right alignment
          "w-full tablet:w-auto tablet:min-w-80 tablet:max-w-md",
          contentClassName
        )}
      >
        {children}
      </ActionButtonGroup>
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
