"use client";

import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { SOBI_ASSETS } from "@/lib/assets";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { formatAIMarkdown, renderAIMarkdownLink } from "@/lib/aiMarkdown";

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
            src={SOBI_ASSETS.DEFAULT}
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
        {isSobi ? (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
              em: ({ children }) => <em className="italic font-semibold">{children}</em>,
              del: ({ children }) => <del className="text-neutral-500 decoration-2">{children}</del>,
              a: ({ href, children }) => renderAIMarkdownLink(href, children),
            }}
          >
            {formatAIMarkdown(message)}
          </ReactMarkdown>
        ) : (
          message
        )}
      </div>
    </div>
  );
}
