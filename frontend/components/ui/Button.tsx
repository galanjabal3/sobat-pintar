import React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  isLoading?: boolean;
  hideChildrenWhenLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", isLoading, hideChildrenWhenLoading = false, children, ...props }, ref) => {
    const variants = {
      primary: "bg-primary text-white hover:bg-opacity-90",
      secondary: "bg-secondary text-neutral-900 hover:bg-opacity-90",
      outline: "border-2 border-primary text-primary bg-transparent hover:bg-primary hover:text-white",
      ghost: "bg-transparent text-neutral-600 hover:bg-gray-100",
    };

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-2xl px-6 py-3 text-base font-semibold transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none",
          variants[variant],
          className
        )}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading ? (
          <div
            className={cn(
              "h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent",
              !hideChildrenWhenLoading && "mr-2"
            )}
          />
        ) : null}
        {isLoading && hideChildrenWhenLoading ? null : children}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };
