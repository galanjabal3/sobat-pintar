"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { motion } from "framer-motion";

import { SOBI_ASSETS } from "@/lib/assets";
import { cn } from "@/lib/utils";

interface ProfileShellProps {
  title: string;
  eyebrow?: string;
  description?: string;
  backHref?: string;
  mascotMessage?: string;
  children: React.ReactNode;
  className?: string;
}

export function ProfileShell({
  title,
  eyebrow = "Sobat Pintar",
  description,
  backHref = "/profile",
  mascotMessage,
  children,
  className,
}: ProfileShellProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#FDFEFF] relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-[320px] bg-gradient-to-b from-primary/5 to-transparent -z-10" />
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-secondary/10 rounded-full blur-[100px] -z-10" />
      <div className="absolute top-1/2 -left-28 w-64 h-64 bg-primary/10 rounded-full blur-[100px] -z-10" />

      <main className={cn("px-5 pt-10 pb-14 max-w-2xl mx-auto sm:px-6 sm:pt-12 sm:pb-16", className)}>
        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-7 flex items-center gap-3 sm:mb-8 sm:gap-4"
        >
          <button
            onClick={() => router.push(backHref)}
            className="w-12 h-12 bg-white rounded-2xl shadow-xl shadow-primary/5 flex items-center justify-center border border-primary/5 text-neutral-800 shrink-0"
            aria-label="Kembali"
          >
            <ChevronLeft size={24} strokeWidth={2.5} />
          </button>
          <div className="min-w-0">
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-0.5">
              {eyebrow}
            </p>
            <h1 className="text-[1.6rem] font-black leading-tight text-neutral-800 sm:text-2xl">
              {title}
            </h1>
            {description ? (
              <p className="mt-1 text-xs font-bold text-neutral-400 leading-relaxed">
                {description}
              </p>
            ) : null}
          </div>
        </motion.header>

        {mascotMessage ? (
          <motion.section
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.05 }}
            className="relative mb-7 flex items-center gap-4 overflow-hidden rounded-[1.75rem] border-2 border-white bg-secondary/10 p-4 shadow-xl shadow-secondary/5 sm:mb-8 sm:rounded-[2rem] sm:p-5"
          >
            <div className="relative h-16 w-16 shrink-0 sm:h-20 sm:w-20">
              <Image
                src={SOBI_ASSETS.WAVING}
                alt="Sobi"
                fill
                className="object-contain drop-shadow-lg"
                sizes="80px"
              />
            </div>
            <p className="relative z-10 text-[13px] font-bold leading-relaxed text-neutral-700 sm:text-sm">
              {mascotMessage}
            </p>
            <div className="absolute -right-8 -bottom-8 w-28 h-28 rounded-full bg-secondary/10" />
          </motion.section>
        ) : null}

        {children}
      </main>
    </div>
  );
}
