"use client";

import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type AutoGrowTextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  minRows?: number;
  maxRows?: number;
};

export const AutoGrowTextarea = React.forwardRef<HTMLTextAreaElement, AutoGrowTextareaProps>(
  ({ className, minRows = 1, maxRows = 8, style, value, onChange, ...props }, forwardedRef) => {
    const innerRef = useRef<HTMLTextAreaElement | null>(null);

    useEffect(() => {
      const textarea = innerRef.current;
      if (!textarea) return;

      const lineHeight = parseFloat(getComputedStyle(textarea).lineHeight || "24");
      const minHeight = lineHeight * minRows;
      const maxHeight = lineHeight * maxRows;

      textarea.style.height = "auto";
      const nextHeight = Math.min(textarea.scrollHeight, maxHeight);
      textarea.style.height = `${Math.max(nextHeight, minHeight)}px`;
      textarea.style.overflowY = textarea.scrollHeight > maxHeight ? "auto" : "hidden";
    }, [value, minRows, maxRows]);

    return (
      <textarea
        ref={(node) => {
          innerRef.current = node;
          if (typeof forwardedRef === "function") {
            forwardedRef(node);
          } else if (forwardedRef) {
            forwardedRef.current = node;
          }
        }}
        value={value}
        onChange={onChange}
        style={{
          ...style,
          resize: "none",
          overflowY: "hidden",
        }}
        className={cn(className)}
        {...props}
      />
    );
  }
);

AutoGrowTextarea.displayName = "AutoGrowTextarea";
