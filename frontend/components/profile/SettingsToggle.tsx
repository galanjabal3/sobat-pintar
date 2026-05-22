"use client";

import React from "react";

import { cn } from "@/lib/utils";

interface SettingsToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
  badge?: string;
}

export function SettingsToggle({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  badge,
}: SettingsToggleProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-[1.35rem] bg-gray-50/70 px-4 py-3.5 sm:gap-4 sm:p-4",
        disabled && "opacity-70"
      )}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[13px] font-black text-neutral-800 sm:text-sm">{label}</p>
          {badge ? (
            <span className="rounded-full bg-secondary/15 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-secondary">
              {badge}
            </span>
          ) : null}
        </div>
        {description ? (
          <p className="mt-1 text-[10px] font-bold leading-relaxed text-neutral-400 sm:text-[11px]">
            {description}
          </p>
        ) : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-7 w-12 shrink-0 rounded-full transition-colors shadow-inner",
          checked ? "bg-primary" : "bg-neutral-200",
          disabled && "cursor-not-allowed"
        )}
      >
        <span
          className={cn(
            "absolute left-0 top-1 h-5 w-5 rounded-full bg-white shadow-md transition-transform",
            checked ? "translate-x-6" : "translate-x-1"
          )}
        />
      </button>
    </div>
  );
}
