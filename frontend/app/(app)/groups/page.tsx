"use client";

import React from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

export default function GroupsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#FDFEFF] relative overflow-hidden">
      {/* Premium Background Mesh */}
      <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-primary/5 to-transparent -z-10" />
      
      <div className="px-6 pt-12 pb-20 max-w-2xl mx-auto">
        <header className="flex items-center gap-4 mb-12">
          <button
            onClick={() => router.push("/dashboard")}
            className="p-3 bg-white hover:bg-gray-50 rounded-2xl shadow-xl shadow-primary/5 border border-primary/5 transition-all"
          >
            <ChevronLeft size={24} />
          </button>
          <div>
            <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-0.5">Kolaborasi</p>
            <h1 className="text-xl font-black text-neutral-800">Grup Belajar</h1>
          </div>
        </header>

        <div className="py-10">
          <EmptyState 
            title="Sedang Disiapkan"
            description="Fitur Grup Belajar sedang dalam tahap pengembangan. Sobi sedang menyusun meja belajarnya!"
            actionLabel="Kembali ke Beranda"
            onAction={() => router.push("/dashboard")}
          />
        </div>
      </div>
    </div>
  );
}
