"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import { SOBI_ASSETS } from "@/lib/assets";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/Button";
import { GraduationCap, BookOpen, Users, School, Camera, MessageCircle, FileText, Sparkles } from "lucide-react";

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

  const features = [
    { label: "Jelasin Soal", icon: Camera, color: "bg-primary/10", text: "text-primary" },
    { label: "Tanya Sobi", icon: MessageCircle, color: "bg-secondary/15", text: "text-secondary" },
    { label: "Latihan Soal", icon: BookOpen, color: "bg-orange-50", text: "text-orange-500" },
    { label: "Rangkuman", icon: FileText, color: "bg-blue-50", text: "text-blue-500" },
  ];

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-[#FDFEFF] px-7 pb-10 pt-12">
      {/* Background decoration */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-24 -left-24 w-64 h-64 bg-secondary/5 rounded-full blur-3xl" />

      {/* Mascot Area */}
      <div className="relative z-10 flex flex-col items-center text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
          <Sparkles size={14} />
          Teman Belajar AI
        </div>

        <div className="relative mb-3 h-52 w-52">
          <Image
            src={SOBI_ASSETS.WAVING}
            alt="Sobi"
            fill
            priority
            sizes="208px"
            className="object-contain drop-shadow-2xl"
          />
        </div>

        <h1 className="mb-3 text-4xl font-black tracking-tight text-neutral-800">
          Sobat Pintar
        </h1>

        <p className="max-w-[280px] text-sm font-bold leading-relaxed text-neutral-500">
          Teman belajar AI untuk semua pelajar Indonesia
        </p>
      </div>

      {/* Main Action Button */}
      <div className="relative z-10 mt-9 space-y-3">
        <Button
          onClick={() => router.push("/register")}
          className="group h-auto w-full gap-2 rounded-[1.7rem] bg-secondary py-6 text-lg font-black text-neutral-900 shadow-xl shadow-secondary/30"
        >
          Mulai Belajar
          <span className="text-xl transition-transform group-hover:translate-x-1">→</span>
        </Button>

        <Link
          href="/login"
          className="flex h-14 items-center justify-center rounded-[1.4rem] text-sm font-black text-primary transition-colors hover:bg-primary/5"
        >
          Sudah punya akun? Masuk
        </Link>
      </div>

      <div className="relative z-10 mt-8 grid grid-cols-2 gap-3">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <div
              key={feature.label}
              className="rounded-[1.5rem] border-2 border-white bg-white/70 p-4 text-center shadow-lg shadow-primary/5"
            >
              <div className={`mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-2xl ${feature.color}`}>
                <Icon size={19} className={feature.text} strokeWidth={3} />
              </div>
              <p className="text-[11px] font-black leading-tight text-neutral-700">
                {feature.label}
              </p>
            </div>
          );
        })}
      </div>

      {/* Level Selection Preview */}
      <div className="relative z-10 mt-auto pt-10">
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
      <p className="relative z-10 mt-8 text-center text-[10px] font-medium text-neutral-300">
        Belajar seru dengan AI cerdas
      </p>
    </div>
  );
}
