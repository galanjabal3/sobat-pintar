"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import { SOBI_ASSETS } from "@/lib/assets";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/Button";
import { GraduationCap, BookOpen, Users, School, Camera, MessageCircle, FileText, Sparkles, CalendarDays } from "lucide-react";

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
    { label: "Jelasin Soal", description: "Foto soal, dapat langkah jawaban", icon: Camera, color: "bg-primary/10", text: "text-primary" },
    { label: "Tanya Sobi", description: "Tanya materi kapan saja", icon: MessageCircle, color: "bg-secondary/15", text: "text-secondary" },
    { label: "Latihan Soal", description: "Belajar lewat soal pilihan", icon: BookOpen, color: "bg-orange-50", text: "text-orange-500" },
    { label: "Rangkuman", description: "Ringkas materi panjang", icon: FileText, color: "bg-blue-50", text: "text-blue-500" },
    { label: "Jadwal Belajar", description: "Bikin rencana belajar otomatis", icon: CalendarDays, color: "bg-cyan-50", text: "text-cyan-500", wide: true },
  ];

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-[#FDFEFF] px-7 pb-10 pt-10">
      {/* Background decoration */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-24 -left-24 w-64 h-64 bg-secondary/5 rounded-full blur-3xl" />

      {/* Mascot Area */}
      <div className="relative z-10 flex flex-col items-center text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
          <Sparkles size={14} />
          Teman Belajar AI
        </div>

        <div className="relative mb-2 h-44 w-44">
          <Image
            src={SOBI_ASSETS.WAVING}
            alt="Sobi"
            fill
            priority
            sizes="176px"
            className="object-contain drop-shadow-2xl"
          />
        </div>

        <h1 className="mb-3 max-w-sm text-[2.45rem] font-black leading-[1.04] tracking-tight text-neutral-800 min-[420px]:text-5xl">
          Belajar Bareng Sobi
        </h1>

        <p className="max-w-[320px] text-sm font-bold leading-relaxed text-neutral-500">
          Foto soal, tanya materi, buat rangkuman, latihan soal, dan susun jadwal belajar dalam satu tempat.
        </p>
      </div>

      {/* Main Action Button */}
      <div className="relative z-10 mt-7 space-y-3">
        <Button
          onClick={() => router.push("/register")}
          className="group h-auto w-full gap-2 rounded-[1.7rem] bg-secondary py-5 text-lg font-black text-neutral-900 shadow-xl shadow-secondary/30"
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

      <div className="relative z-10 mt-6 grid grid-cols-2 gap-3">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <div
              key={feature.label}
              className={[
                "rounded-[1.5rem] border-2 border-white bg-white/70 p-4 text-center shadow-lg shadow-primary/5",
                feature.wide ? "col-span-2 flex items-center justify-start gap-4 px-5 text-left" : "",
              ].join(" ")}
            >
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${feature.wide ? "" : "mx-auto mb-2"} ${feature.color}`}>
                <Icon size={19} className={feature.text} strokeWidth={3} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-black leading-tight text-neutral-700">
                  {feature.label}
                </p>
                <p className="mt-1 text-[9px] font-bold leading-snug text-neutral-400">
                  {feature.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Level Selection Preview */}
      <div className="relative z-10 mt-auto pt-10">
        <div className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-3 w-full">
            <div className="h-[1px] bg-gray-100 flex-1" />
            <p className="text-[10px] font-black text-neutral-300 uppercase tracking-[0.2em]">Cocok untuk semua jenjang</p>
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
