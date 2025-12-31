"use client"

import * as React from "react"
import * as SheetPrimitive from "@radix-ui/react-dialog"
import { XIcon } from "lucide-react"

import { cn } from "@/lib/utils"

// Hook to detect mobile breakpoint
function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640); // sm breakpoint
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return isMobile;
}

function Sheet({
  ...props
}) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />;
}

function SheetTrigger({
  ...props
}) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

function SheetClose({
  ...props
}) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />;
}

function SheetPortal({
  ...props
}) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />;
}

function SheetOverlay({
  className,
  ...props
}) {
  return (
    <SheetPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/50 backdrop-blur-[1px]",
        className
      )}
      {...props} />
  );
}

function SheetContent({
  className,
  children,
  side = "right",
  responsive = false,
  ...props
}) {
  const isMobile = useIsMobile();
  const effectiveSide = responsive && isMobile ? "bottom" : side;

  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        data-side={effectiveSide}
        className={cn(
          "bg-popover text-popover-foreground fixed z-50 flex flex-col gap-4 shadow-lg",
          effectiveSide === "right" &&
            "inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm",
          effectiveSide === "left" &&
            "inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm",
          effectiveSide === "top" &&
            "inset-x-0 top-0 h-auto border-b",
          effectiveSide === "bottom" &&
            "inset-x-0 bottom-0 h-auto max-h-[90vh] border-t rounded-t-xl overflow-y-auto",
          className
        )}
        {...props}>
        {children}
        <SheetPrimitive.Close
          className="cursor-pointer ring-offset-background focus:ring-ring data-[state=open]:bg-secondary absolute top-4 right-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:pointer-events-none">
          <XIcon className="size-4" />
          <span className="sr-only">Close</span>
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPortal>
  );
}

function SheetHeader({
  className,
  ...props
}) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-1.5 p-4", className)}
      {...props} />
  );
}

function SheetFooter({
  className,
  ...props
}) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      {...props} />
  );
}

function SheetTitle({
  className,
  ...props
}) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn(
        "text-foreground font-semibold",
        "tablet:text-base desktop:text-sm",
        /* HIG headline (mobile default) */
        "text-[17px] tracking-[-0.408px]",
        className
      )}
      {...props} />
  );
}

function SheetDescription({
  className,
  ...props
}) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn(
        "text-muted-foreground",
        "tablet:text-sm desktop:text-xs",
        /* HIG footnote (mobile default) */
        "text-[13px] tracking-[-0.078px] leading-4.5",
        className
      )}
      {...props} />
  );
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
