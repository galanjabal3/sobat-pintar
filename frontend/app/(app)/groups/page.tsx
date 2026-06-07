"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, MessageCircle, ShieldCheck, Users } from "lucide-react";

const ROADMAP_ITEMS = [
  {
    icon: Users,
    title: "Ruang Belajar Kelas",
    description: "Buat grup kecil untuk teman sekelas atau kelompok tugas.",
  },
  {
    icon: MessageCircle,
    title: "Diskusi Materi",
    description: "Bahas soal, rangkuman, dan jadwal belajar bersama.",
  },
  {
    icon: ShieldCheck,
    title: "Moderasi Aman",
    description: "Interaksi grup akan dibuat tetap aman untuk pelajar.",
  },
];

export default function GroupsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#FDFEFF] relative overflow-hidden">
      {/* Premium Background Mesh */}
      <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-primary/5 to-transparent -z-10" />
      
      <div className="px-6 pt-12 pb-20 max-w-2xl mx-auto">
        <header className="flex items-center gap-4 mb-12">
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="p-3 bg-white hover:bg-gray-50 rounded-2xl shadow-xl shadow-primary/5 border border-primary/5 transition-all"
            aria-label="Kembali ke dashboard"
          >
            <ChevronLeft size={24} />
          </button>
          <div>
            <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-0.5">Kolaborasi</p>
            <h1 className="text-xl font-black text-neutral-800">Grup Belajar</h1>
          </div>
        </header>

        <div className="rounded-[2.5rem] border-2 border-primary/10 bg-white p-6 shadow-2xl shadow-primary/5">
          <div className="mb-6 rounded-[2rem] bg-primary/5 p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-primary">Dalam Rencana</p>
            <h2 className="mt-2 text-2xl font-black leading-tight text-neutral-800">
              Grup belajar akan hadir setelah fitur AI utama stabil.
            </h2>
            <p className="mt-3 text-sm font-bold leading-relaxed text-neutral-500">
              Untuk sekarang, fokus belajar bisa lewat Tanya Sobi, Latihan Soal, Rangkuman, dan Jadwal Belajar.
            </p>
          </div>

          <div className="space-y-3">
            {ROADMAP_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex gap-4 rounded-2xl bg-gray-50/70 p-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-primary shadow-sm">
                    <Icon size={20} strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-neutral-800">{item.title}</p>
                    <p className="mt-1 text-xs font-bold leading-relaxed text-neutral-400">{item.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="mt-6 w-full rounded-2xl bg-primary px-6 py-4 text-sm font-black text-white shadow-lg shadow-primary/20"
          >
            Kembali ke Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
