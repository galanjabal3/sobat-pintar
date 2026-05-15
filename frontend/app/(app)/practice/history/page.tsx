"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Trophy, Calendar } from "lucide-react";
import { Button } from "@/components/ui/Button";
import api from "@/lib/api";
import { useToastStore } from "@/store/toastStore";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface PracticeHistory {
  id: string;
  subject: string;
  difficulty: string;
  score: any;
  completed_at: string;
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
        <div className="text-center py-20 text-neutral-400">Memuat riwayat...</div>
      ) : history.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-[2rem] border border-gray-100">
          <p className="text-neutral-500 font-medium">Belum ada riwayat latihan.</p>
          <Button onClick={() => router.push("/practice")} className="mt-4">Mulai Latihan!</Button>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((item) => (
            <div
              key={item.id}
              onClick={() => router.push(`/practice/result?id=${item.id}`)}
              className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:border-primary/30 transition-all flex items-center justify-between cursor-pointer"
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
              <div className="text-xl font-black text-primary">{item.score && typeof item.score === 'object' && item.score.Valid ? item.score.Int64 : (typeof item.score === 'number' ? item.score : 0)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
