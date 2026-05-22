"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Calendar, ChevronLeft, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import api from "@/lib/api";
import { getApiErrorMessage } from "@/lib/apiError";
import { useToastStore } from "@/store/toastStore";
import { ScheduleResult, ScheduleView } from "@/components/schedule/ScheduleView";

function formatScheduleDate(date?: string) {
  if (!date) return "-";

  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return date;

  return format(parsedDate, "d MMMM yyyy", { locale: idLocale });
}

export default function ScheduleResultPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { addToast } = useToastStore();
  const [result, setResult] = useState<ScheduleResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSchedule = useCallback(async () => {
    if (!id) {
      router.push("/schedule");
      return;
    }

    try {
      const response = await api.get(`/schedule/${id}`);
      setResult(response.data);
    } catch (err: unknown) {
      addToast(getApiErrorMessage(err, "Gagal memuat jadwal belajar."), "error");
      router.push("/schedule");
    } finally {
      setIsLoading(false);
    }
  }, [addToast, id, router]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#FDFEFF] p-6">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-primary/10 text-primary">
          <Sparkles size={26} />
        </div>
        <p className="text-sm font-black text-neutral-700">Memuat jadwal belajar...</p>
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className="min-h-screen bg-[#FDFEFF] relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-primary/5 to-transparent -z-10" />

      <div className="px-6 pt-12 pb-20 max-w-2xl mx-auto">
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 flex items-center gap-4"
        >
          <button
            onClick={() => router.push("/schedule")}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-primary/5 bg-white text-neutral-800 shadow-xl shadow-primary/5"
            aria-label="Kembali ke jadwal"
          >
            <ChevronLeft size={24} strokeWidth={2.5} />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-primary">Jadwal dari Sobi</p>
            <h1 className="truncate text-xl font-black text-neutral-800">Hasil Jadwal Belajar</h1>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-primary/5 bg-white text-primary shadow-xl shadow-primary/5">
            <Calendar size={20} strokeWidth={2.5} />
          </div>
        </motion.header>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[2.5rem] border-2 border-primary/10 bg-white p-6 shadow-2xl shadow-primary/5"
        >
          <div className="mb-5 flex items-center gap-2">
            <Sparkles size={16} className="text-secondary" />
            <h2 className="text-xs font-black uppercase tracking-widest text-neutral-400">Rencana Belajarmu</h2>
          </div>
          <div className="mb-5 rounded-[2rem] bg-primary/5 p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Tanggal Ujian</p>
            <p className="mt-1 text-lg font-black text-neutral-800">{formatScheduleDate(result.exam_date)}</p>
          </div>
          <ScheduleView result={result} />
        </motion.section>
      </div>
    </div>
  );
}
