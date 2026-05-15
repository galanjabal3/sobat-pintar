"use client";

import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface SobiMessageProps {
  message: string;
  isSobi?: boolean;
}

export default function SobiMessage({ message, isSobi = true }: SobiMessageProps) {
  return (
    <div className={cn("flex gap-3 mb-4", isSobi ? "flex-row" : "flex-row-reverse")}>
      {isSobi && (
        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0 border border-primary/20">
          <Image
            src="https://res.cloudinary.com/dzzflhq79/image/upload/v1778706261/image_tyr7o1.png"
            alt="Sobi"
            width={32}
            height={32}
            className="object-contain"
          />
        </div>
      )}
      <div className={cn(
        "p-4 rounded-3xl max-w-[80%] text-sm leading-relaxed",
        isSobi 
          ? "bg-white text-neutral-700 rounded-tl-none border border-gray-100 shadow-sm" 
          : "bg-secondary text-neutral-900 rounded-tr-none font-medium"
      )}>
        {message}
      </div>
    </div>
  );
}
