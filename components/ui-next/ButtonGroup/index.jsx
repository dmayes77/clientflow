"use client";

import * as React from "react";
import styles from "./button-group.module.css";

/**
 * ButtonGroup Component
 * Container for grouping buttons together
 *
 * @param {string} orientation - "horizontal" | "vertical"
 * @param {string} variant - "default" (gap) | "connected" (no gap, shared borders)
 * @param {string} size - Matches button sizes for consistent spacing
 */
const ButtonGroup = React.forwardRef(
  (
    {
      orientation = "horizontal",
      variant = "default",
      size = "default",
      children,
      className,
      ...props
    },
    ref
  ) => {
    const classNames = [
      styles.group,
      styles[orientation],
      styles[variant],
      styles[`size-${size}`],
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <div ref={ref} role="group" className={classNames} {...props}>
        {children}
      </div>
    );
  }
);

ButtonGroup.displayName = "ButtonGroup";

export { ButtonGroup };
