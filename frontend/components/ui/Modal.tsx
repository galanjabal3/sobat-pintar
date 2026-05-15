"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertCircle, Trash2, LogOut, HelpCircle } from "lucide-react";
import { Button } from "./Button";
import { cn } from "@/lib/utils";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info" | "logout";
}

export function Modal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Ya, Lanjutkan",
  cancelText = "Batal",
  variant = "info",
}: ModalProps) {
  const icons = {
    danger: <Trash2 className="text-red-500" size={24} />,
    warning: <AlertCircle className="text-orange-500" size={24} />,
    info: <HelpCircle className="text-primary" size={24} />,
    logout: <LogOut className="text-red-500" size={24} />,
  };

  const colors = {
    danger: "bg-red-50",
    warning: "bg-orange-50",
    info: "bg-primary/5",
    logout: "bg-red-50",
  };

  const buttonVariants = {
    danger: "bg-red-500 hover:bg-red-600 shadow-red-500/20",
    warning: "bg-orange-500 hover:bg-orange-600 shadow-orange-500/20",
    info: "bg-primary hover:bg-primary/90 shadow-primary/20",
    logout: "bg-red-500 hover:bg-red-600 shadow-red-500/20",
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-sm bg-white rounded-[3rem] shadow-2xl overflow-hidden border-4 border-white"
          >
            <div className="p-8 flex flex-col items-center text-center">
              {/* Icon Container */}
              <div className={cn("w-16 h-16 rounded-[1.5rem] flex items-center justify-center mb-6", colors[variant])}>
                {icons[variant]}
              </div>

              <h3 className="text-xl font-black text-neutral-800 mb-2">{title}</h3>
              <p className="text-sm font-medium text-neutral-400 mb-8 leading-relaxed">
                {description}
              </p>

              <div className="flex flex-col w-full gap-3">
                <Button 
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className={cn("w-full py-4 h-auto rounded-2xl font-black shadow-lg transition-all active:scale-95", buttonVariants[variant])}
                >
                  {confirmText}
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={onClose}
                  className="w-full py-4 h-auto rounded-2xl font-black text-neutral-400 hover:text-neutral-600"
                >
                  {cancelText}
                </Button>
              </div>
            </div>

            {/* Decoration */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
