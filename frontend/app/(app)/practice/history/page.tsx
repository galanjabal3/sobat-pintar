"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Trophy } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import api from "@/lib/api";
import { useToastStore } from "@/store/toastStore";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface PracticeHistory {
  id: string;
  subject: string;
  difficulty: string;
  score: number | { Int64: number; Valid: boolean } | null;
  completed_at: string;
}

function getPracticeScore(score: PracticeHistory["score"]) {
  if (typeof score === "number") return score;
  if (score?.Valid) return score.Int64;
  return 0;
}

export default function PracticeHistoryPage() {
  const router = useRouter();
  const { addToast } = useToastStore();
  const [history, setHistory] = useState<PracticeHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get("/practice/history");
        setHistory(res.data || []);
      } catch (err) {
        console.error(err);
        addToast("Gagal memuat riwayat latihan.", "error");
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, [addToast]);

  return (
    <div className="px-6 pt-12 pb-24">
      <header className="flex items-center gap-4 mb-8">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-black text-neutral-800">Riwayat Latihan</h1>
      </header>

      {isLoading ? (
        <div className="space-y-4" aria-label="Memuat riwayat latihan">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="flex h-[90px] animate-pulse items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5"
            >
              <div className="h-12 w-12 rounded-xl bg-gray-100" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-28 rounded-full bg-gray-100" />
                <div className="h-3 w-36 rounded-full bg-gray-100" />
              </div>
              <div className="h-6 w-10 rounded-full bg-gray-100" />
            </div>
          ))}
        </div>
      ) : history.length === 0 ? (
        <div className="py-10">
          <EmptyState 
            title="Belum Ada Latihan"
            description="Ayo mulai latihan pertamamu bersama Sobi dan kumpulkan poinnya!"
            actionLabel="Mulai Latihan Sekarang"
            onAction={() => router.push("/practice")}
          />
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((item) => (
            <button
              type="button"
              key={item.id}
              onClick={() => router.push(`/practice/result?id=${item.id}`)}
              className="flex w-full cursor-pointer items-center justify-between rounded-2xl border border-gray-100 bg-white p-5 text-left shadow-sm transition-all hover:border-primary/30"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                  <Trophy size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-neutral-800 capitalize">{item.subject}</h3>
                  <p className="text-xs text-neutral-400 font-medium capitalize">{item.difficulty} • {format(new Date(item.completed_at), "d MMM yyyy", { locale: id })}</p>
                </div>
              </div>
              <div className="text-xl font-black text-primary">{getPracticeScore(item.score)}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
