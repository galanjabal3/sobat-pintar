import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Button } from "./Button";
import { SOBI_ASSETS } from "@/lib/assets";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  imageSrc?: string;
  type?: "empty" | "error";
}

export function EmptyState({ 
  title, 
  description, 
  actionLabel, 
  onAction,
  imageSrc,
  type = "empty"
}: EmptyStateProps) {
  const defaultImage = type === "error" 
    ? SOBI_ASSETS.SAD
    : SOBI_ASSETS.MAGNIFIER;

  const finalImageSrc = imageSrc || defaultImage;

  return (
    <div className="flex flex-col items-center justify-center p-4 sm:p-8 text-center w-full max-w-sm mx-auto">
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", bounce: 0.5 }}
        className="relative w-56 h-56 sm:w-64 sm:h-64 mb-4"
      >
        <motion.div
          animate={{ y: [0, -15, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="w-full h-full relative"
        >
          <Image
            src={finalImageSrc}
            alt={`${type} State Mascot`}
            fill
            className="object-contain drop-shadow-2xl"
            priority
          />
        </motion.div>
        
        {/* Subtle shadow on the "floor" */}
        <motion.div 
          animate={{ scale: [1, 0.8, 1], opacity: [0.3, 0.1, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-24 h-4 bg-black/10 rounded-[100%] blur-[4px]"
        />
      </motion.div>

      <motion.h3 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-2xl font-black text-neutral-800 mb-2"
      >
        {title}
      </motion.h3>
      
      <motion.p 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-sm font-medium text-neutral-500 mb-8 max-w-[280px]"
      >
        {description}
      </motion.p>

      {actionLabel && onAction && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="w-full px-4"
        >
          <Button 
            onClick={onAction}
            className="w-full py-4 rounded-[1.5rem] shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all font-black text-sm bg-primary text-white"
          >
            {actionLabel}
          </Button>
        </motion.div>
      )}
    </div>
  );
}
