"use client";

import React from "react";
import { useToastStore } from "@/store/toastStore";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 left-0 right-0 z-[100] flex flex-col items-center gap-3 pointer-events-none px-4">
      {toasts.map((toast) => {
        let Icon = Info;
        let colorClass = "bg-white text-neutral-800 border-gray-100";
        let iconColorClass = "text-blue-500";

        if (toast.type === "error") {
          Icon = AlertCircle;
          colorClass = "bg-red-50 text-red-900 border-red-200 shadow-red-500/10";
          iconColorClass = "text-red-500";
        } else if (toast.type === "success") {
          Icon = CheckCircle2;
          colorClass = "bg-green-50 text-green-900 border-green-200 shadow-green-500/10";
          iconColorClass = "text-green-500";
        }

        return (
          <div
            key={toast.id}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-lg max-w-sm w-full pointer-events-auto animate-in slide-in-from-top-5 fade-in duration-300",
              colorClass
            )}
          >
            <Icon size={20} className={iconColorClass} />
            <p className="text-sm font-medium flex-1">{toast.message}</p>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="p-1 hover:bg-black/5 rounded-full transition-colors"
              aria-label="Tutup notifikasi"
            >
              <X size={16} className="opacity-50" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
