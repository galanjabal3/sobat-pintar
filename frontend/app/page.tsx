"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/Button";
import { GraduationCap, BookOpen, Users, School } from "lucide-react";

export default function LandingPage() {
  const user = useAuthStore((state) => state.user);
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }
  }, [user, router]);

  const levels = [
    { label: "TK", icon: GraduationCap, color: "bg-teal-50", text: "text-primary" },
    { label: "SD", icon: BookOpen, color: "bg-blue-50", text: "text-blue-500" },
    { label: "SMP", icon: School, color: "bg-orange-50", text: "text-orange-500" },
    { label: "SMA", icon: Users, color: "bg-yellow-50", text: "text-secondary" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-white px-8 pt-16 pb-12 overflow-hidden relative">
      {/* Background decoration */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-24 -left-24 w-64 h-64 bg-secondary/5 rounded-full blur-3xl" />

      {/* Mascot Area */}
      <div className="flex flex-col items-center mb-10 relative">
        <div className="w-64 h-64 relative mb-4">
          <Image
            src="https://res.cloudinary.com/dzzflhq79/image/upload/v1778706261/image_tyr7o1.png"
            alt="Sobi Mascot"
            fill
            priority
            sizes="(max-width: 768px) 256px, 256px"
            className="object-contain"
          />
        </div>
        <h1 className="text-4xl font-black text-neutral-800 tracking-tight mb-2">
          Sobat Pintar
        </h1>
        <p className="text-neutral-400 text-sm font-medium text-center max-w-[200px] leading-relaxed">
          Teman belajar AI untuk semua pelajar Indonesia
        </p>
      </div>

      {/* Main Action Button */}
      <div className="mt-4 mb-16">
        <Button
          onClick={() => router.push("/register")}
          className="w-full py-7 h-auto text-lg rounded-3xl shadow-xl shadow-secondary/30 bg-secondary text-neutral-900 font-black flex items-center justify-center gap-2 group"
        >
          Mulai Belajar
          <span className="text-xl transition-transform group-hover:translate-x-1">→</span>
        </Button>
      </div>

      {/* Level Selection Preview */}
      <div className="mt-auto">
        <div className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-3 w-full">
            <div className="h-[1px] bg-gray-100 flex-1" />
            <p className="text-[10px] font-black text-neutral-300 uppercase tracking-[0.2em]">Pilih Jenjang Kamu</p>
            <div className="h-[1px] bg-gray-100 flex-1" />
          </div>
          
          <div className="flex justify-between w-full max-w-sm">
            {levels.map((level) => {
              const Icon = level.icon;
              return (
                <div key={level.label} className="flex flex-col items-center gap-2">
                  <div className={`w-12 h-12 ${level.color} rounded-2xl flex items-center justify-center ${level.text} shadow-sm border border-white`}>
                    <Icon size={24} />
                  </div>
                  <span className="text-[10px] font-black text-neutral-400 uppercase">{level.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer text */}
      <p className="text-[10px] text-neutral-300 font-medium text-center mt-12">
        Belajar seru dengan AI cerdas
      </p>
    </div>
  );
}
