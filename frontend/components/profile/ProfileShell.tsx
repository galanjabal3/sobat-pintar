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

      <main className={cn("px-6 pt-12 pb-16 max-w-2xl mx-auto", className)}>
        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
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
            <h1 className="text-2xl font-black text-neutral-800 leading-tight">
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
            className="mb-8 bg-secondary/10 border-2 border-white rounded-[2rem] p-5 flex items-center gap-4 shadow-xl shadow-secondary/5 overflow-hidden relative"
          >
            <div className="relative w-20 h-20 shrink-0">
              <Image
                src={SOBI_ASSETS.WAVING}
                alt="Sobi"
                fill
                className="object-contain drop-shadow-lg"
                sizes="80px"
              />
            </div>
            <p className="relative z-10 text-sm font-bold text-neutral-700 leading-relaxed">
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
