"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tag, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { ALL_SYSTEM_TAGS } from "@/lib/system-tags";

/**
 * TagFilter Component
 *
 * A reusable component for filtering lists by tags with multi-select support.
 *
 * @param {Object[]} tags - Array of tag objects with { id, name, color, type }
 * @param {string[]} selectedTagIds - Array of currently selected tag IDs
 * @param {Function} onSelectionChange - Callback when selection changes (receives array of tag IDs)
 * @param {string} placeholder - Placeholder text for the button (default: "Filter by tags")
 * @param {string} type - Filter by tag type (optional: "contact", "invoice", "booking", "general")
 * @param {boolean} excludeSystemTags - If true, excludes system status tags from the filter
 */
export function TagFilter({
  tags = [],
  selectedTagIds = [],
  onSelectionChange,
  placeholder = "Filter by tags",
  type = null,
  excludeSystemTags = false,
}) {
  const [open, setOpen] = useState(false);

  // Filter tags based on type and system tag exclusion
  const availableTags = useMemo(() => {
    let filtered = tags;

    // Filter by type if specified
    if (type) {
      filtered = filtered.filter((tag) => tag.type === type || tag.type === "general");
    }

    // Exclude system tags if requested (status tags)
    if (excludeSystemTags) {
      const systemTagNames = ALL_SYSTEM_TAGS.map((t) => t.name);
      filtered = filtered.filter((tag) => !systemTagNames.includes(tag.name));
    }

    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }, [tags, type, excludeSystemTags]);

  // Get selected tags for display
  const selectedTags = useMemo(() => {
    return availableTags.filter((tag) => selectedTagIds.includes(tag.id));
  }, [availableTags, selectedTagIds]);

  // Handle tag selection toggle
  const handleToggle = (tagId) => {
    const newSelection = selectedTagIds.includes(tagId)
      ? selectedTagIds.filter((id) => id !== tagId)
      : [...selectedTagIds, tagId];

    onSelectionChange(newSelection);
  };

  // Clear all selected tags
  const handleClear = () => {
    onSelectionChange([]);
    setOpen(false);
  };

  // Get color classes for tag badges
  const getTagColorClasses = (color) => {
    const colorMap = {
      red: "bg-red-100 text-red-800 border-red-300",
      orange: "bg-orange-100 text-orange-800 border-orange-300",
      yellow: "bg-yellow-100 text-yellow-800 border-yellow-300",
      green: "bg-green-100 text-green-800 border-green-300",
      blue: "bg-blue-100 text-blue-800 border-blue-300",
      indigo: "bg-indigo-100 text-indigo-800 border-indigo-300",
      purple: "bg-purple-100 text-purple-800 border-purple-300",
      pink: "bg-pink-100 text-pink-800 border-pink-300",
      gray: "bg-gray-100 text-gray-800 border-gray-300",
      slate: "bg-slate-100 text-slate-800 border-slate-300",
    };
    return colorMap[color] || colorMap.blue;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 border-dashed">
          <Tag className="mr-2 h-4 w-4" />
          {selectedTags.length > 0 ? (
            <>
              {selectedTags.length} tag{selectedTags.length !== 1 ? "s" : ""}
              {selectedTags.length <= 2 && (
                <span className="ml-1 hidden sm:inline">
                  ({selectedTags.map((t) => t.name).join(", ")})
                </span>
              )}
            </>
          ) : (
            placeholder
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-75 p-0" align="start">
        <Command>
          <CommandInput placeholder="Search tags..." />
          <CommandList>
            <CommandEmpty>No tags found.</CommandEmpty>
            <CommandGroup>
              {availableTags.map((tag) => {
                const isSelected = selectedTagIds.includes(tag.id);
                return (
                  <CommandItem
                    key={tag.id}
                    onSelect={() => handleToggle(tag.id)}
                    className="cursor-pointer"
                  >
                    <div
                      className={cn(
                        "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "opacity-50 [&_svg]:invisible"
                      )}
                    >
                      <Check className="h-4 w-4" />
                    </div>
                    <div className="flex items-center gap-2 flex-1">
                      <span>{tag.name}</span>
                      <Badge
                        variant="outline"
                        className={cn(
                          "ml-auto text-xs",
                          getTagColorClasses(tag.color)
                        )}
                      >
                        {tag.type}
                      </Badge>
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
            {selectedTags.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={handleClear}
                    className="justify-center text-center cursor-pointer"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Clear filters
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
