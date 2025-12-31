"use client";

import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Image as ImageIcon, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * ImageSelectionDialog - Reusable image picker from media library
 *
 * @param {object} props
 * @param {boolean} props.open - Dialog open state
 * @param {function} props.onOpenChange - Handler for open state changes
 * @param {Array} props.images - Array of image objects with id, url, filename
 * @param {string} props.selectedId - Currently selected image ID
 * @param {function} props.onSelect - Called with image object when selected
 * @param {boolean} props.loading - Show loading state
 * @param {string} props.title - Dialog title (default: "Select Image")
 * @param {string} props.description - Dialog description
 * @param {React.ReactNode} props.emptyState - Custom empty state content
 * @param {number} props.columns - Number of grid columns (default: 4)
 */
export function ImageSelectionDialog({
  open,
  onOpenChange,
  images = [],
  selectedId,
  onSelect,
  loading = false,
  title = "Select Image",
  description = "Choose an image from your library",
  emptyState,
  columns = 4,
}) {
  const handleSelect = (image) => {
    onSelect?.(image);
    onOpenChange?.(false);
  };

  const gridCols = {
    2: "grid-cols-2",
    3: "grid-cols-2 sm:grid-cols-3",
    4: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
    5: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-96">
          {loading ? (
            <div className="py-12 text-center">
              <Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground mt-2">
                Loading images...
              </p>
            </div>
          ) : images.length === 0 ? (
            emptyState || (
              <div className="py-8 text-center text-muted-foreground">
                <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No images in your library</p>
                <p className="text-sm">Upload an image to get started</p>
              </div>
            )
          ) : (
            <div className={cn("grid gap-3 p-1", gridCols[columns] || gridCols[4])}>
              {images.map((img) => (
                <button
                  key={img.id}
                  type="button"
                  className={cn(
                    "relative aspect-square rounded-lg overflow-hidden border-2 transition-all",
                    selectedId === img.id
                      ? "border-primary ring-2 ring-primary/20"
                      : "border-transparent hover:border-muted-foreground/30"
                  )}
                  onClick={() => handleSelect(img)}
                >
                  <Image
                    src={img.url}
                    alt={img.filename || img.alt || "Image"}
                    fill
                    sizes="(max-width: 640px) 150px, (max-width: 1024px) 120px, 100px"
                    className="object-cover"
                  />
                  {selectedId === img.id && (
                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                      <Check className="h-6 w-6 text-primary" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange?.(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
