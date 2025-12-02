import { createTheme, rem } from "@mantine/core";

/**
 * Compact theme for the dashboard
 * Provides a denser, more software-like feel with smaller fonts and tighter spacing
 */
export const dashboardTheme = createTheme({
  // Inherit Inter from body (set via next/font className in layout.js)
  fontFamily: "inherit",
  fontFamilyMonospace: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace",

  // Smaller font sizes across the board
  fontSizes: {
    xs: rem(11),
    sm: rem(12),
    md: rem(13),
    lg: rem(14),
    xl: rem(16),
  },

  // Tighter spacing
  spacing: {
    xs: rem(6),
    sm: rem(8),
    md: rem(12),
    lg: rem(16),
    xl: rem(20),
  },

  // Smaller default radius
  radius: {
    xs: rem(2),
    sm: rem(4),
    md: rem(6),
    lg: rem(8),
    xl: rem(12),
  },

  // Compact heading sizes
  headings: {
    fontWeight: "600",
    sizes: {
      h1: { fontSize: rem(22), lineHeight: "1.3" },
      h2: { fontSize: rem(18), lineHeight: "1.35" },
      h3: { fontSize: rem(15), lineHeight: "1.4" },
      h4: { fontSize: rem(13), lineHeight: "1.45" },
      h5: { fontSize: rem(12), lineHeight: "1.5" },
      h6: { fontSize: rem(11), lineHeight: "1.5" },
    },
  },

  // Component-specific overrides for compact feel
  components: {
    Button: {
      defaultProps: {
        size: "sm",
      },
      styles: {
        root: {
          fontWeight: 500,
        },
      },
    },

    TextInput: {
      defaultProps: {
        size: "sm",
      },
      styles: {
        label: {
          fontSize: rem(11),
          fontWeight: 500,
          marginBottom: rem(4),
        },
        input: {
          fontSize: rem(13),
        },
      },
    },

    Textarea: {
      defaultProps: {
        size: "sm",
      },
      styles: {
        label: {
          fontSize: rem(11),
          fontWeight: 500,
          marginBottom: rem(4),
        },
        input: {
          fontSize: rem(13),
        },
      },
    },

    Select: {
      defaultProps: {
        size: "sm",
      },
      styles: {
        label: {
          fontSize: rem(11),
          fontWeight: 500,
          marginBottom: rem(4),
        },
        input: {
          fontSize: rem(13),
        },
      },
    },

    NumberInput: {
      defaultProps: {
        size: "sm",
      },
      styles: {
        label: {
          fontSize: rem(11),
          fontWeight: 500,
          marginBottom: rem(4),
        },
        input: {
          fontSize: rem(13),
        },
      },
    },

    Checkbox: {
      defaultProps: {
        size: "sm",
      },
      styles: {
        label: {
          fontSize: rem(12),
        },
      },
    },

    Switch: {
      defaultProps: {
        size: "sm",
      },
      styles: {
        label: {
          fontSize: rem(12),
        },
      },
    },

    Badge: {
      defaultProps: {
        size: "sm",
      },
    },

    Table: {
      styles: {
        th: {
          fontSize: rem(11),
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          color: "var(--mantine-color-gray-6)",
        },
        td: {
          fontSize: rem(12),
        },
      },
    },

    Tabs: {
      styles: {
        tab: {
          fontSize: rem(12),
          fontWeight: 500,
          padding: `${rem(8)} ${rem(12)}`,
        },
      },
    },

    Modal: {
      defaultProps: {
        radius: "md",
      },
      styles: {
        title: {
          fontSize: rem(14),
          fontWeight: 600,
        },
      },
    },

    Paper: {
      defaultProps: {
        radius: "sm",
      },
    },

    Card: {
      defaultProps: {
        radius: "sm",
      },
    },

    ActionIcon: {
      defaultProps: {
        size: "sm",
      },
    },

    Menu: {
      styles: {
        item: {
          fontSize: rem(12),
        },
        label: {
          fontSize: rem(10),
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        },
      },
    },

    Popover: {
      defaultProps: {
        radius: "sm",
      },
    },

    Tooltip: {
      defaultProps: {
        radius: "sm",
      },
      styles: {
        tooltip: {
          fontSize: rem(11),
        },
      },
    },

    NavLink: {
      styles: {
        root: {
          fontSize: rem(13),
        },
      },
    },

    Divider: {
      styles: {
        root: {
          marginTop: rem(8),
          marginBottom: rem(8),
        },
      },
    },
  },

  // Other theme settings
  primaryColor: "blue",
  defaultRadius: "sm",
  cursorType: "pointer",
});
