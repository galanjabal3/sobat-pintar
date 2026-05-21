"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ChevronLeft, MessageSquare } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import api from "@/lib/api";
import { useToastStore } from "@/store/toastStore";

interface HistoryItem {
  id: string;
  question_text: string;
  image_url?: string;
  created_at: string;
}

export default function ExplainHistoryPage() {
  const router = useRouter();
  const { addToast } = useToastStore();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    try {
      const response = await api.get("/explain/history");
      setHistory(response.data || []);
    } catch (err) {
      console.error(err);
      addToast("Gagal memuat riwayat penjelasan.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return (
    <div className="px-6 pt-12 pb-24">
      <header className="flex items-center gap-4 mb-8">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-black text-neutral-800">Riwayat Penjelasan</h1>
      </header>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-50 rounded-[2rem] animate-pulse" />
          ))}
        </div>
      ) : history.length === 0 ? (
        <div className="py-10">
          <EmptyState 
            title="Belum Ada Pertanyaan"
            description="Ada soal yang bikin bingung? Foto atau ketik soalnya, Sobi siap bantu jelasin!"
            actionLabel="Tanya Sobi Sekarang"
            onAction={() => router.push("/explain")}
          />
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((item) => (
            <button
              key={item.id}
              onClick={() => router.push(`/explain/result?id=${item.id}`)}
              className="w-full text-left p-5 bg-white border border-gray-100 rounded-[2rem] hover:border-primary/30 transition-all shadow-sm active:scale-[0.98] flex items-start gap-4"
            >
              <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shadow-sm overflow-hidden border border-primary/10">
                {item.image_url ? (
                  <Image
                    src={item.image_url}
                    alt="Soal"
                    width={48}
                    height={48}
                    className="h-full w-full object-cover"
                    sizes="48px"
                  />
                ) : (
                  <MessageSquare size={20} className="text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-neutral-700 text-sm font-medium line-clamp-2 mb-1">
                  {item.question_text || "Lihat Gambar Soal"}
                </p>
                <p className="text-[10px] text-neutral-400">
                  {new Date(item.created_at).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
