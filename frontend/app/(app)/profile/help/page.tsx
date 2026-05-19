"use client";

import React from "react";
import { BookOpen, ChevronDown, Mail, MessageCircle, Search, Video } from "lucide-react";

import { ProfileCard } from "@/components/profile/ProfileCard";
import { ProfileShell } from "@/components/profile/ProfileShell";
import { useToastStore } from "@/store/toastStore";

const FAQS = [
  {
    question: "Bagaimana cara memulai belajar?",
    answer:
      "Mulai dari dashboard, pilih fitur yang kamu butuhkan seperti Jelasin Soal, Latihan Soal, Tanya Sobi, atau Rangkuman.",
  },
  {
    question: "Kenapa jawaban Sobi kadang gagal?",
    answer:
      "Biasanya karena koneksi internet atau layanan AI sedang sibuk. Coba kirim ulang pertanyaan beberapa saat lagi.",
  },
  {
    question: "Bagaimana cara melihat poin?",
    answer:
      "Poin dan streak utama bisa dilihat dari dashboard. Detail peringkat bisa dibuka dari halaman leaderboard.",
  },
  {
    question: "Apakah rangkuman bisa dibagikan?",
    answer:
      "Bisa. Buka hasil rangkuman, lalu gunakan tombol bagikan untuk membuat link publik.",
  },
];

const EDUCATION_ITEMS = [
  {
    icon: Video,
    title: "Cara memakai Jelasin Soal",
    meta: "Panduan singkat",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: BookOpen,
    title: "Tips belajar efektif di rumah",
    meta: "Artikel belajar",
    color: "bg-secondary/15 text-secondary",
  },
  {
    icon: MessageCircle,
    title: "Cara bertanya ke Sobi",
    meta: "Contoh prompt",
    color: "bg-orange-100 text-orange-500",
  },
];

export default function HelpPage() {
  const { addToast } = useToastStore();
  const [query, setQuery] = React.useState("");

  const filteredFaqs = FAQS.filter((item) => {
    const normalizedQuery = query.toLowerCase();
    return (
      item.question.toLowerCase().includes(normalizedQuery) ||
      item.answer.toLowerCase().includes(normalizedQuery)
    );
  });

  const showComingSoon = () => {
    addToast("Kontak dukungan segera tersedia.", "info");
  };

  return (
    <ProfileShell
      title="Bantuan"
      description="Cari jawaban cepat atau hubungi tim dukungan."
      mascotMessage="Kalau bingung, mulai dari pertanyaan umum dulu. Sobi bantu arahkan."
    >
      <div className="space-y-6">
        <ProfileCard>
          <label className="relative block">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300"
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full rounded-2xl border-2 border-primary/5 bg-gray-50/70 p-4 pl-12 text-sm font-bold text-neutral-800 outline-none transition-all focus:border-primary/30 focus:bg-white focus:ring-4 focus:ring-primary/5"
              placeholder="Cari bantuan di sini..."
            />
          </label>
        </ProfileCard>

        <ProfileCard>
          <div className="mb-4">
            <h2 className="text-base font-black text-neutral-800">
              Pertanyaan Umum
            </h2>
            <p className="text-[11px] font-bold text-neutral-400">
              Jawaban cepat untuk kendala yang sering muncul.
            </p>
          </div>

          <div className="space-y-3">
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((item) => (
                <details
                  key={item.question}
                  className="group rounded-2xl bg-gray-50/70 p-4"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-black text-neutral-800">
                    {item.question}
                    <ChevronDown
                      size={18}
                      className="shrink-0 text-neutral-300 transition-transform group-open:rotate-180"
                    />
                  </summary>
                  <p className="mt-3 text-xs font-bold leading-relaxed text-neutral-500">
                    {item.answer}
                  </p>
                </details>
              ))
            ) : (
              <p className="rounded-2xl bg-gray-50 p-4 text-center text-xs font-bold text-neutral-400">
                Belum ada bantuan yang cocok.
              </p>
            )}
          </div>
        </ProfileCard>

        <div className="grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={showComingSoon}
            className="rounded-[2rem] bg-primary p-5 text-left text-white shadow-xl shadow-primary/20 transition-transform active:scale-95"
          >
            <MessageCircle size={24} strokeWidth={2.5} />
            <p className="mt-4 text-base font-black">WhatsApp Support</p>
            <p className="mt-1 text-xs font-bold text-white/75">
              Bantuan langsung dari tim Sobi.
            </p>
          </button>

          <button
            type="button"
            onClick={showComingSoon}
            className="rounded-[2rem] bg-secondary p-5 text-left text-neutral-900 shadow-xl shadow-secondary/20 transition-transform active:scale-95"
          >
            <Mail size={24} strokeWidth={2.5} />
            <p className="mt-4 text-base font-black">Email Dukungan</p>
            <p className="mt-1 text-xs font-bold text-neutral-700">
              Kirim detail masalahmu ke tim kami.
            </p>
          </button>
        </div>

        <ProfileCard>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-neutral-800">
                Pusat Edukasi
              </h2>
              <p className="text-[11px] font-bold text-neutral-400">
                Materi bantuan tambahan.
              </p>
            </div>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-primary">
              Segera
            </span>
          </div>

          <div className="space-y-3">
            {EDUCATION_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="flex items-center gap-4 rounded-2xl bg-gray-50/70 p-4"
                >
                  <div className={`w-11 h-11 rounded-2xl ${item.color} flex items-center justify-center`}>
                    <Icon size={21} strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-neutral-800">
                      {item.title}
                    </p>
                    <p className="text-[11px] font-bold text-neutral-400">
                      {item.meta}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </ProfileCard>

        <div className="rounded-[2rem] bg-primary/10 p-5">
          <p className="text-sm font-black text-primary">Status Sistem</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-green-500" />
            <p className="text-xs font-bold text-neutral-600">
              Semua sistem lancar.
            </p>
          </div>
        </div>
      </div>
    </ProfileShell>
  );
}
