/**
 * ClientFlow Compact Enterprise Theme - JavaScript Constants
 * ===========================================================
 *
 * These constants mirror the CSS custom properties in enterprise-theme.css
 * Use them in JavaScript/React components for consistent theming.
 *
 * Usage:
 * import { theme, cn } from "@/lib/enterprise-theme";
 *
 * <div className={cn(theme.text.sm, theme.spacing.card)}>
 *   Content here
 * </div>
 */

/**
 * Tailwind class mappings for the compact enterprise theme
 * These provide semantic naming for common patterns
 */
export const theme = {
  // ===================
  // Typography
  // ===================
  text: {
    "2xs": "text-[0.625rem]",   // 10px - tiny labels
    xs: "text-[0.6875rem]",     // 11px - small labels, badges
    sm: "text-xs",               // 12px - body small, table cells
    base: "text-[0.8125rem]",   // 13px - default body text
    lg: "text-sm",               // 14px - emphasized text
    xl: "text-base",             // 16px - section headers
    "2xl": "text-lg",            // 18px - page titles
    "3xl": "text-xl",            // 20px - major headings
  },

  // Font weights
  font: {
    normal: "font-normal",
    medium: "font-medium",
    semibold: "font-semibold",
    bold: "font-bold",
  },

  // ===================
  // Colors (Zinc-based)
  // ===================
  colors: {
    // Text colors
    text: {
      primary: "text-zinc-900",
      secondary: "text-zinc-600",
      muted: "text-zinc-500",
      subtle: "text-zinc-400",
      inverse: "text-white",
    },
    // Background colors
    bg: {
      page: "bg-zinc-50",
      card: "bg-white",
      muted: "bg-zinc-100",
      subtle: "bg-zinc-50",
      inverse: "bg-zinc-900",
    },
    // Border colors
    border: {
      default: "border-zinc-200",
      muted: "border-zinc-100",
      strong: "border-zinc-300",
    },
    // Status colors
    status: {
      success: "bg-green-100 text-green-700",
      warning: "bg-amber-100 text-amber-700",
      error: "bg-red-100 text-red-700",
      info: "bg-blue-100 text-blue-700",
    },
  },

  // ===================
  // Spacing Presets
  // ===================
  spacing: {
    // Page layout
    page: "p-4",
    pageX: "px-4",
    pageY: "py-4",

    // Card spacing
    card: "p-4",
    cardCompact: "p-3",
    cardHeader: "pb-3",

    // Section spacing
    section: "space-y-4",
    sectionLarge: "space-y-6",

    // Stack (vertical) spacing
    stack: "space-y-2",
    stackTight: "space-y-1",
    stackLoose: "space-y-3",

    // Inline (horizontal) spacing
    inline: "space-x-2",
    inlineTight: "space-x-1",
    inlineLoose: "space-x-3",

    // Gap utilities
    gap: "gap-2",
    gapTight: "gap-1",
    gapLoose: "gap-3",
    gapSection: "gap-4",
  },

  // ===================
  // Component Sizes
  // ===================
  sizes: {
    // Button sizes
    button: {
      sm: "h-7 px-2.5 text-xs",
      md: "h-8 px-3 text-xs",
      lg: "h-9 px-4 text-sm",
    },

    // Input sizes
    input: {
      sm: "h-7 px-2 text-xs",
      md: "h-8 px-3 text-xs",
      lg: "h-9 px-3 text-sm",
    },

    // Icon sizes
    icon: {
      xs: "h-3 w-3",
      sm: "h-3.5 w-3.5",
      md: "h-4 w-4",
      lg: "h-5 w-5",
      xl: "h-6 w-6",
    },

    // Badge sizes
    badge: "text-[0.625rem] px-1.5 py-0.5",

    // Avatar sizes
    avatar: {
      xs: "h-6 w-6",
      sm: "h-8 w-8",
      md: "h-10 w-10",
      lg: "h-12 w-12",
    },
  },

  // ===================
  // Border Radius
  // ===================
  radius: {
    none: "rounded-none",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl",
    full: "rounded-full",
  },

  // ===================
  // Shadows
  // ===================
  shadow: {
    none: "shadow-none",
    sm: "shadow-sm",
    md: "shadow-md",
    lg: "shadow-lg",
  },

  // ===================
  // Common Patterns
  // ===================
  patterns: {
    // Page header
    pageHeader: "flex items-center justify-between mb-4",
    pageTitle: "text-lg font-semibold text-zinc-900",
    pageDescription: "text-xs text-zinc-500 mt-0.5",

    // Card patterns
    cardTitle: "text-sm font-semibold",
    cardDescription: "text-[0.625rem] text-zinc-500 mt-0.5",

    // Form patterns
    formLabel: "text-xs font-medium",
    formDescription: "text-[0.625rem] text-zinc-500",
    formError: "text-[0.625rem] text-red-500",

    // Table patterns
    tableHeader: "text-xs font-medium text-zinc-500 uppercase tracking-wide",
    tableCell: "text-xs",

    // Alert patterns
    alertInfo: "bg-blue-50 border border-blue-200 rounded-lg p-3",
    alertSuccess: "bg-green-50 border border-green-200 rounded-lg p-3",
    alertWarning: "bg-amber-50 border border-amber-200 rounded-lg p-3",
    alertError: "bg-red-50 border border-red-200 rounded-lg p-3",

    // Empty state
    emptyState: "text-xs text-zinc-400 text-center py-6",
  },
};

/**
 * Common class combinations for frequently used patterns
 */
export const presets = {
  // Page layout
  page: "space-y-4",
  pageHeader: {
    wrapper: "flex items-center justify-between",
    title: "text-lg font-semibold text-zinc-900",
    description: "text-xs text-zinc-500 mt-0.5",
  },

  // Card layout
  card: {
    base: "border border-zinc-200 rounded-lg bg-white",
    header: "px-4 pt-4 pb-3",
    content: "px-4 pb-4",
    title: "text-sm font-semibold",
  },

  // Form elements
  form: {
    field: "space-y-1.5",
    label: "text-xs font-medium",
    input: "text-xs",
    hint: "text-[0.625rem] text-zinc-500",
  },

  // Button styles
  button: {
    primary: "bg-zinc-900 text-white hover:bg-zinc-800",
    secondary: "bg-zinc-100 text-zinc-900 hover:bg-zinc-200",
    outline: "border border-zinc-200 bg-white hover:bg-zinc-50",
    ghost: "hover:bg-zinc-100",
    destructive: "bg-red-600 text-white hover:bg-red-700",
  },

  // Status badges
  badge: {
    default: "bg-zinc-100 text-zinc-700 text-[0.625rem]",
    success: "bg-green-100 text-green-700 text-[0.625rem]",
    warning: "bg-amber-100 text-amber-700 text-[0.625rem]",
    error: "bg-red-100 text-red-700 text-[0.625rem]",
    info: "bg-blue-100 text-blue-700 text-[0.625rem]",
  },

  // Info alerts
  alert: {
    info: "bg-blue-50 border border-blue-200 rounded-lg p-3 flex gap-2",
    success: "bg-green-50 border border-green-200 rounded-lg p-3 flex gap-2",
    warning: "bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2",
    error: "bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2",
    iconClass: "h-4 w-4 shrink-0 mt-0.5",
    textClass: "text-xs",
  },
};

/**
 * CSS variable references for use in inline styles
 * These match the CSS custom properties in enterprise-theme.css
 */
export const cssVars = {
  // Colors
  background: "hsl(var(--et-background))",
  foreground: "hsl(var(--et-foreground))",
  primary: "hsl(var(--et-primary))",
  secondary: "hsl(var(--et-secondary))",
  muted: "hsl(var(--et-muted))",
  mutedForeground: "hsl(var(--et-muted-foreground))",
  border: "hsl(var(--et-border))",
  ring: "hsl(var(--et-ring))",

  // Status
  success: "hsl(var(--et-success))",
  warning: "hsl(var(--et-warning))",
  error: "hsl(var(--et-error))",
  info: "hsl(var(--et-info))",

  // Spacing
  space: (n) => `var(--et-space-${n})`,

  // Typography
  fontSize: (size) => `var(--et-text-${size})`,

  // Radius
  radius: (size = "md") => `var(--et-radius-${size})`,

  // Transitions
  transition: (speed = "normal") => `var(--et-transition-${speed})`,
};

/**
 * Tailwind config extension values
 * Use these to extend your Tailwind config if needed
 */
export const tailwindExtend = {
  fontSize: {
    "2xs": ["0.625rem", { lineHeight: "1rem" }],
    xs: ["0.6875rem", { lineHeight: "1rem" }],
    sm: ["0.75rem", { lineHeight: "1.25rem" }],
    base: ["0.8125rem", { lineHeight: "1.5rem" }],
  },
  spacing: {
    "0.5": "0.125rem",
    "1.5": "0.375rem",
    "2.5": "0.625rem",
    "3.5": "0.875rem",
  },
  borderRadius: {
    sm: "0.25rem",
    md: "0.375rem",
    lg: "0.5rem",
  },
};

export default theme;
