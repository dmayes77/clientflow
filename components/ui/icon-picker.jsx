"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const DEFAULT_EMOJIS = ["📁", "✂️", "💇", "💼", "📸", "🎨", "🏠", "💻", "🎯", "⚡", "🔧", "📋"];

/**
 * IconPicker - Input for selecting an emoji or icon name with quick-pick grid
 *
 * @param {object} props
 * @param {string} props.value - Current icon value
 * @param {function} props.onChange - Called with new icon value
 * @param {string} props.label - Field label (default: "Icon")
 * @param {string} props.placeholder - Input placeholder
 * @param {Array} props.quickPicks - Array of quick-pick emojis (default: common emojis)
 * @param {string} props.previewColor - Background color for preview (optional)
 * @param {boolean} props.showPreview - Show preview of selected icon (default: true)
 * @param {string} props.id - Input ID
 * @param {string} props.className - Additional classes
 */
export function IconPicker({
  value,
  onChange,
  label = "Icon",
  placeholder = "📁 or icon name",
  quickPicks = DEFAULT_EMOJIS,
  previewColor,
  showPreview = true,
  id = "icon",
  className,
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label htmlFor={id}>{label}</Label>
      )}
      <div className="flex gap-2">
        <Input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1"
        />
        {showPreview && value && (
          <div
            className="h-10 w-10 rounded-lg flex items-center justify-center text-white shrink-0"
            style={{ backgroundColor: previewColor || "#6366f1" }}
          >
            {value}
          </div>
        )}
      </div>
      {quickPicks && quickPicks.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {quickPicks.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => onChange(emoji)}
              className={cn(
                "h-8 w-8 rounded border hover:bg-muted transition-colors text-lg",
                value === emoji && "bg-muted border-primary"
              )}
              title={`Use ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const DEFAULT_COLORS = [
  { value: "#ef4444", name: "Red" },
  { value: "#f97316", name: "Orange" },
  { value: "#eab308", name: "Yellow" },
  { value: "#22c55e", name: "Green" },
  { value: "#06b6d4", name: "Cyan" },
  { value: "#3b82f6", name: "Blue" },
  { value: "#6366f1", name: "Indigo" },
  { value: "#8b5cf6", name: "Violet" },
  { value: "#d946ef", name: "Fuchsia" },
  { value: "#ec4899", name: "Pink" },
  { value: "#64748b", name: "Slate" },
  { value: "#78716c", name: "Stone" },
];

/**
 * ColorPicker - Grid of color swatches for selection
 *
 * @param {object} props
 * @param {string} props.value - Currently selected color (hex)
 * @param {function} props.onChange - Called with new color value
 * @param {string} props.label - Field label (default: "Color")
 * @param {Array} props.colors - Array of { value, name } (default: common colors)
 * @param {number} props.columns - Number of grid columns (default: 7)
 * @param {string} props.className - Additional classes
 */
export function ColorPicker({
  value,
  onChange,
  label = "Color",
  colors = DEFAULT_COLORS,
  columns = 7,
  className,
}) {
  const gridCols = {
    4: "grid-cols-4",
    5: "grid-cols-5",
    6: "grid-cols-6",
    7: "grid-cols-7",
    8: "grid-cols-8",
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && <Label>{label}</Label>}
      <div className={cn("grid gap-2", gridCols[columns] || "grid-cols-7")}>
        {colors.map((colorOption) => (
          <button
            key={colorOption.value}
            type="button"
            onClick={() => onChange(colorOption.value)}
            className={cn(
              "h-10 rounded-lg border-2 transition-all hover:scale-110",
              value === colorOption.value
                ? "border-foreground ring-2 ring-offset-2 ring-foreground/20"
                : "border-transparent"
            )}
            style={{ backgroundColor: colorOption.value }}
            title={colorOption.name}
          >
            {value === colorOption.value && (
              <svg
                className="h-4 w-4 text-white mx-auto"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * IconColorPicker - Combined icon and color picker
 *
 * @param {object} props
 * @param {string} props.icon - Current icon value
 * @param {function} props.onIconChange - Called with new icon value
 * @param {string} props.color - Current color value
 * @param {function} props.onColorChange - Called with new color value
 * @param {string} props.iconLabel - Icon field label
 * @param {string} props.colorLabel - Color field label
 * @param {Array} props.quickPicks - Icon quick-picks
 * @param {Array} props.colors - Color options
 * @param {string} props.className - Additional classes
 */
export function IconColorPicker({
  icon,
  onIconChange,
  color,
  onColorChange,
  iconLabel = "Icon",
  colorLabel = "Color",
  quickPicks,
  colors,
  className,
}) {
  return (
    <div className={cn("space-y-4", className)}>
      <ColorPicker
        value={color}
        onChange={onColorChange}
        label={colorLabel}
        colors={colors}
      />
      <IconPicker
        value={icon}
        onChange={onIconChange}
        label={iconLabel}
        quickPicks={quickPicks}
        previewColor={color}
      />
    </div>
  );
}
