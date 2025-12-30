"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tags, X } from "lucide-react";

/**
 * Reusable filter dropdown component with support for single-select options and multi-select tags
 *
 * @param {Object} props
 * @param {string} props.value - Current selected filter value (single-select)
 * @param {function} props.onChange - Callback when filter changes (single-select)
 * @param {Array} props.options - Array of filter options: { value, label, icon: LucideIcon, count }
 * @param {Array} props.optionGroups - Alternative: Array of option groups: { label, options: [...] }
 * @param {Array} props.tags - Optional: Array of tags for multi-select filtering
 * @param {Array} props.selectedTagIds - Optional: Currently selected tag IDs
 * @param {function} props.onTagsChange - Optional: Callback when tag selection changes
 * @param {string} props.label - Dropdown menu label (e.g., "Filter by Status")
 * @param {string} props.placeholder - Default text when "all" is selected
 * @param {React.ElementType} props.icon - Default icon for the trigger button
 * @param {string} props.className - Additional classes for the trigger button
 * @param {string} props.width - Custom width class for the dropdown content (default: "w-56")
 */
export function StatusFilterDropdown({
  value,
  onChange,
  options,
  optionGroups,
  tags = [],
  selectedTagIds = [],
  onTagsChange,
  label = "Filter by Status",
  placeholder = "All",
  icon: DefaultIcon,
  className = "",
  width = "w-56",
}) {
  // Flatten all options for finding current selection
  const allOptions = optionGroups
    ? optionGroups.flatMap((group) => group.options)
    : options || [];

  // Find the current selected option
  const currentOption = allOptions.find((opt) => opt.value === value);
  const CurrentIcon = currentOption?.icon || DefaultIcon;
  const currentLabel = currentOption?.label || placeholder;
  const currentCount = currentOption?.count ?? 0;

  // Get all option labels to filter out overlapping tags
  const optionLabels = allOptions.map((opt) => opt.label?.toLowerCase());

  // Filter out system tags and tags that overlap with status options
  const displayTags = tags.filter((tag) => {
    if (tag.isSystem) return false;
    // Exclude tags whose name matches a status option label
    const tagNameLower = tag.name?.toLowerCase();
    return !optionLabels.some((label) =>
      label?.includes(tagNameLower) || tagNameLower?.includes(label?.split(" ")[0])
    );
  });
  const hasTagsSection = displayTags.length > 0 && onTagsChange;
  const activeTagCount = selectedTagIds.length;

  // Build display label
  const getDisplayLabel = () => {
    if (activeTagCount > 0 && value === "all") {
      return `${activeTagCount} tag${activeTagCount > 1 ? "s" : ""}`;
    }
    if (activeTagCount > 0) {
      return `${currentLabel} + ${activeTagCount}`;
    }
    return currentLabel;
  };

  const handleTagToggle = (tagId) => {
    if (selectedTagIds.includes(tagId)) {
      onTagsChange(selectedTagIds.filter((id) => id !== tagId));
    } else {
      onTagsChange([...selectedTagIds, tagId]);
    }
  };

  const handleClearTags = (e) => {
    e.stopPropagation();
    onTagsChange([]);
  };

  const renderOption = (option) => {
    const OptionIcon = option.icon;
    return (
      <DropdownMenuCheckboxItem
        key={option.value}
        checked={value === option.value}
        onCheckedChange={() => onChange(option.value)}
      >
        {OptionIcon && <OptionIcon className="h-3 w-3 mr-2" />}
        {option.label} ({option.count ?? 0})
      </DropdownMenuCheckboxItem>
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={activeTagCount > 0 ? "secondary" : "outline"}
          size="sm"
          className={`min-w-36 justify-between ${className}`}
        >
          <span className="flex items-center gap-2 truncate">
            {CurrentIcon && <CurrentIcon className="h-3 w-3 shrink-0" />}
            <span className="truncate">{getDisplayLabel()}</span>
          </span>
          <span className="text-muted-foreground shrink-0 ml-2">
            ({currentCount})
          </span>
          {activeTagCount > 0 && (
            <X
              className="h-3 w-3 ml-1 shrink-0 hover:text-destructive"
              onClick={handleClearTags}
            />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className={`${width} max-h-80 overflow-y-auto`}>
        {optionGroups ? (
          // Render grouped options
          optionGroups.map((group, index) => (
            <div key={group.label}>
              {index > 0 && <DropdownMenuSeparator />}
              <DropdownMenuLabel>{group.label}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {group.options.map(renderOption)}
            </div>
          ))
        ) : options ? (
          // Render flat options
          <>
            <DropdownMenuLabel>{label}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {options.map(renderOption)}
          </>
        ) : null}

        {/* Tags section (multi-select) */}
        {hasTagsSection && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="flex items-center gap-2">
              <Tags className="h-3 w-3" />
              Tags
              {activeTagCount > 0 && (
                <Badge variant="secondary" className="ml-auto text-xs px-1.5 py-0">
                  {activeTagCount}
                </Badge>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {displayTags.map((tag) => (
              <DropdownMenuCheckboxItem
                key={tag.id}
                checked={selectedTagIds.includes(tag.id)}
                onCheckedChange={() => handleTagToggle(tag.id)}
              >
                <span
                  className="h-2 w-2 rounded-full mr-2 shrink-0"
                  style={{ backgroundColor: tag.color || "#6b7280" }}
                />
                {tag.name}
              </DropdownMenuCheckboxItem>
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
