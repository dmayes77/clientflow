"use client";

import { useRef, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { ActionButtonGroup } from "./bottom-action-bar";

/**
 * BottomSheet - Mobile-optimized slide-up sheet with action bar
 *
 * A professional bottom sheet component for mobile views that slides up
 * with a drag handle, content area, and anchored action bar at the bottom.
 */
export function BottomSheet({
  open,
  onOpenChange,
  children,
  title,
  description,
  icon,
  actions,
  minHeight = "75vh",
  className,
  showCloseButton = true,
}) {
  const sheetRef = useRef(null);
  const dragControls = useDragControls();
  const [mounted, setMounted] = useState(false);

  // Only render on client to avoid hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const handleDragEnd = (event, info) => {
    // If dragged down more than 100px or with high velocity, close
    if (info.offset.y > 100 || info.velocity.y > 500) {
      onOpenChange(false);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[1px]"
            onClick={() => onOpenChange(false)}
          />

          {/* Sheet */}
          <motion.div
            ref={sheetRef}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            drag="y"
            dragControls={dragControls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={handleDragEnd}
            style={{ minHeight }}
            className={cn(
              "fixed inset-x-0 bottom-0 z-50 bg-background rounded-t-xl",
              "flex flex-col",
              className
            )}
          >
            {/* Drag handle */}
            <div
              className="flex justify-center pt-3 pb-4 cursor-grab active:cursor-grabbing touch-none"
              onPointerDown={(e) => dragControls.start(e)}
            >
              <div className="w-10 h-1 rounded-full bg-muted-foreground/20" />
            </div>

            {/* Close button */}
            {showCloseButton && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-3 right-3 size-8"
                onClick={() => onOpenChange(false)}
              >
                <X className="size-4" />
              </Button>
            )}

            {/* Header */}
            {(title || icon) && (
              <div className="px-6 pb-4 shrink-0">
                <div className="flex items-center gap-4">
                  {icon && <div className="shrink-0">{icon}</div>}
                  <div className="flex-1 min-w-0 pr-8">
                    {title && (
                      <h2 className="text-xl font-semibold truncate">{title}</h2>
                    )}
                    {description && (
                      <div className="text-muted-foreground text-sm mt-0.5">
                        {description}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Content - scrollable area, flex-1 pushes actions to bottom */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {children}
            </div>

            {/* Actions - anchored to bottom with safe area padding */}
            {actions && (
              <div className="shrink-0 border-t bg-background pb-[env(safe-area-inset-bottom)] mt-auto">
                {actions}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}

/**
 * BottomSheetActions - Action bar for BottomSheet
 *
 * Wraps ActionButtonGroup with proper styling for use inside BottomSheet.
 * Always anchored to the bottom of the sheet.
 */
export function BottomSheetActions({ children, left, className }) {
  return (
    <ActionButtonGroup left={left} className={cn("px-4 py-2.5", className)}>
      {children}
    </ActionButtonGroup>
  );
}

/**
 * BottomSheetStats - Grid of stat cards for BottomSheet
 *
 * Displays stats in a responsive grid layout.
 */
export function BottomSheetStats({ children, columns = 3, className }) {
  return (
    <div
      className={cn(
        "grid gap-3",
        columns === 2 && "grid-cols-2",
        columns === 3 && "grid-cols-3",
        columns === 4 && "grid-cols-4",
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * BottomSheetStat - Individual stat card for BottomSheetStats
 */
export function BottomSheetStat({ icon: Icon, value, label, className }) {
  return (
    <div className={cn("bg-muted/50 rounded-lg p-3 text-center", className)}>
      {Icon && (
        <div className="flex justify-center mb-1">
          <Icon className="size-5 text-muted-foreground" />
        </div>
      )}
      <div className="font-semibold text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
