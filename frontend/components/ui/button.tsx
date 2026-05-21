import * as React from "react";

import { cn } from "@/lib/utils";

export type ButtonVariant = "default" | "secondary" | "ghost";
export type ButtonSize = "default" | "sm" | "icon";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600/20 disabled:pointer-events-none disabled:opacity-50 dark:focus-visible:ring-red-500/25";

const variants: Record<ButtonVariant, string> = {
  default:
    "bg-red-600 text-white shadow-sm hover:bg-red-700 dark:bg-red-600 dark:text-white dark:hover:bg-red-700",
  secondary:
    "bg-red-50 text-red-700 hover:bg-red-100 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800",
  ghost:
    "bg-transparent text-neutral-900 hover:bg-neutral-100 dark:text-neutral-100 dark:hover:bg-neutral-900"
};

const sizes: Record<ButtonSize, string> = {
  default: "h-11 px-4",
  sm: "h-9 px-3",
  icon: "h-10 w-10"
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
