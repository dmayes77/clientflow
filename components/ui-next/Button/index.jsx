"use client";

import * as React from "react";
import { Button as BaseButton } from "@base-ui-components/react/button";
import styles from "./button.module.css";

/**
 * Button Component (Base UI + CSS Modules)
 * Single source of truth: button.module.css
 */
const Button = React.forwardRef(
  ({ variant = "default", size = "default", render, children, ...props }, ref) => {
    const classNames = [
      styles.button,
      styles[variant],
      styles[`size-${size}`],
    ].join(" ");

    return (
      <BaseButton ref={ref} className={classNames} render={render} {...props}>
        {children}
      </BaseButton>
    );
  }
);

Button.displayName = "Button";

export { Button };
