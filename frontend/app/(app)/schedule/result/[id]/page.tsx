"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AlertCircle, Calendar, ChevronLeft, Plus, Save, Sparkles, Trash2, X } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import api from "@/lib/api";
import { getApiErrorMessage } from "@/lib/apiError";
import { notifyAIQuotaUpdated } from "@/lib/aiQuota";
import { useToastStore } from "@/store/toastStore";
import { DailySchedule, ScheduleResult, ScheduleView, StudySession } from "@/components/schedule/ScheduleView";

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
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftSchedule, setDraftSchedule] = useState<DailySchedule[]>([]);
  const previousStatusRef = useRef<ScheduleResult["status"] | undefined>(undefined);

  const fetchSchedule = useCallback(async () => {
    if (!id) {
      router.push("/schedule");
      return;
    }

    try {
      const response = await api.get(`/schedule/${id}`);
      const nextResult = response.data as ScheduleResult;
      if (previousStatusRef.current === "processing" && nextResult.status !== "processing") {
        notifyAIQuotaUpdated();
      }
      previousStatusRef.current = nextResult.status;
      setResult(nextResult);
      if (!isEditing) {
        setDraftTitle(nextResult.title || "Jadwal Belajar");
        setDraftSchedule(Array.isArray(nextResult.schedule) ? nextResult.schedule : []);
      }
    } catch (err: unknown) {
      addToast(getApiErrorMessage(err, "Gagal memuat jadwal belajar."), "error");
      router.push("/schedule");
    } finally {
      setIsLoading(false);
    }
  }, [addToast, id, isEditing, router]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  useEffect(() => {
    if (result?.status !== "processing") return;

    const intervalID = window.setInterval(fetchSchedule, 2500);
    return () => window.clearInterval(intervalID);
  }, [fetchSchedule, result?.status]);

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

  const startEdit = () => {
    setDraftTitle(result.title || "Jadwal Belajar");
    setDraftSchedule(Array.isArray(result.schedule) ? result.schedule : []);
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setDraftTitle(result.title || "Jadwal Belajar");
    setDraftSchedule(Array.isArray(result.schedule) ? result.schedule : []);
    setIsEditing(false);
  };

  const updateDayDate = (dayIndex: number, date: string) => {
    setDraftSchedule((current) => current.map((day, index) => index === dayIndex ? { ...day, date } : day));
  };

  const addDay = () => {
    const today = new Date().toISOString().slice(0, 10);
    setDraftSchedule((current) => [...current, { date: today, sessions: [{ subject: "", topic: "", duration_minutes: 60 }] }]);
  };

  const removeDay = (dayIndex: number) => {
    setDraftSchedule((current) => current.filter((_, index) => index !== dayIndex));
  };

  const updateSession = (dayIndex: number, sessionIndex: number, patch: Partial<StudySession>) => {
    setDraftSchedule((current) => current.map((day, index) => {
      if (index !== dayIndex) return day;
      return {
        ...day,
        sessions: day.sessions.map((session, itemIndex) => itemIndex === sessionIndex ? { ...session, ...patch } : session),
      };
    }));
  };

  const addSession = (dayIndex: number) => {
    setDraftSchedule((current) => current.map((day, index) => index === dayIndex
      ? { ...day, sessions: [...day.sessions, { subject: "", topic: "", duration_minutes: 60 }] }
      : day
    ));
  };

  const removeSession = (dayIndex: number, sessionIndex: number) => {
    setDraftSchedule((current) => current.map((day, index) => {
      if (index !== dayIndex) return day;
      return { ...day, sessions: day.sessions.filter((_, itemIndex) => itemIndex !== sessionIndex) };
    }).filter((day) => day.sessions.length > 0));
  };

  const saveEdit = async () => {
    if (isSaving) return;
    if (!draftTitle.trim()) {
      addToast("Nama jadwal tidak boleh kosong.", "error");
      return;
    }
    if (draftSchedule.length === 0) {
      addToast("Tambahkan minimal satu sesi belajar.", "error");
      return;
    }

    setIsSaving(true);
    try {
      const response = await api.patch(`/schedule/${id}`, {
        title: draftTitle.trim(),
        schedule: draftSchedule,
        tips: result.tips || [],
      });
      setResult(response.data);
      setDraftTitle(response.data.title || "Jadwal Belajar");
      setDraftSchedule(Array.isArray(response.data.schedule) ? response.data.schedule : []);
      setIsEditing(false);
      addToast("Jadwal berhasil disimpan.", "success");
    } catch (err: unknown) {
      addToast(getApiErrorMessage(err, "Gagal menyimpan jadwal belajar."), "error");
    } finally {
      setIsSaving(false);
    }
  };

  if (result.status === "processing") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#FDFEFF] p-6 text-center">
        <button
          type="button"
          onClick={() => router.push("/schedule")}
          className="absolute left-6 top-12 flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/5 bg-white text-neutral-800 shadow-xl shadow-primary/5"
          aria-label="Kembali ke jadwal"
        >
          <ChevronLeft size={24} strokeWidth={2.5} />
        </button>
        <motion.div
          animate={{ scale: [1, 1.1, 1], rotate: [0, 360] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="mb-8 flex h-20 w-20 items-center justify-center rounded-[2rem] bg-primary/10"
        >
          <Calendar size={32} className="text-primary" />
        </motion.div>
        <p className="text-lg font-black text-neutral-800">Sobi sedang membuat jadwal...</p>
        <p className="mt-1 max-w-xs truncate text-sm font-black text-primary">
          {result.title || "Jadwal Belajar"}
        </p>
        <p className="mt-2 max-w-xs text-sm font-medium leading-relaxed text-neutral-400">
          Boleh kembali, jadwalnya tetap diproses.
        </p>
      </div>
    );
  }

  if (result.status === "failed") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#FDFEFF] p-6 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-[2rem] bg-red-50 text-error">
          <AlertCircle size={34} />
        </div>
        <p className="text-lg font-black text-neutral-800">Sobi gagal membuat jadwal.</p>
        <p className="mt-1 max-w-xs truncate text-sm font-black text-primary">
          {result.title || "Jadwal Belajar"}
        </p>
        <p className="mt-2 max-w-xs text-sm font-medium leading-relaxed text-neutral-400">
          {result.error_message || "Coba buat jadwal lagi sebentar lagi ya."}
        </p>
        <button
          type="button"
          onClick={() => router.push("/schedule")}
          className="mt-8 rounded-2xl bg-primary px-8 py-4 text-sm font-black text-white shadow-lg shadow-primary/20"
        >
          Buat Jadwal Lagi
        </button>
      </div>
    );
  }

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
            <h1 className="line-clamp-2 break-words text-xl font-black leading-tight text-neutral-800">
              {isEditing ? draftTitle || "Edit Jadwal Belajar" : result.title || "Hasil Jadwal Belajar"}
            </h1>
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
          <div className="mb-5 flex flex-wrap gap-2">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={saveEdit}
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-3 text-xs font-black text-white shadow-lg shadow-primary/20 disabled:opacity-60"
                >
                  <Save size={16} /> {isSaving ? "Menyimpan..." : "Simpan Jadwal"}
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 rounded-2xl bg-primary/5 px-4 py-3 text-xs font-black text-primary disabled:opacity-60"
                >
                  <X size={16} /> Batal
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={startEdit}
                className="rounded-2xl bg-primary/10 px-4 py-3 text-xs font-black text-primary"
              >
                Edit Jadwal
              </button>
            )}
          </div>
          <div className="mb-5 rounded-[2rem] bg-primary/5 p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
              {result.exam_date ? "Tanggal Ujian" : "Sumber Jadwal"}
            </p>
            <p className="mt-1 text-lg font-black text-neutral-800">
              {result.exam_date ? formatScheduleDate(result.exam_date) : "Dari foto atau jadwal tanpa tanggal ujian"}
            </p>
          </div>
          {isEditing ? (
            <div className="space-y-5">
              <label className="block">
                <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-neutral-400">Nama Jadwal</span>
                <input
                  value={draftTitle}
                  onChange={(event) => setDraftTitle(event.target.value)}
                  maxLength={100}
                  className="h-14 w-full rounded-2xl border-2 border-primary/10 bg-white px-4 text-sm font-bold text-neutral-700 outline-none focus:border-primary/30"
                />
              </label>

              {draftSchedule.map((day, dayIndex) => (
                <div key={`${day.date}-${dayIndex}`} className="rounded-[2rem] bg-primary/5 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <input
                      type="date"
                      value={day.date}
                      onChange={(event) => updateDayDate(dayIndex, event.target.value)}
                      className="h-12 min-w-0 flex-1 rounded-2xl border-2 border-primary/10 bg-white px-3 text-xs font-black text-neutral-700 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => removeDay(dayIndex)}
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-error"
                      aria-label="Hapus hari"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="space-y-3">
                    {day.sessions.map((session, sessionIndex) => (
                      <div key={`${day.date}-${sessionIndex}`} className="rounded-2xl bg-white p-4">
                        <div className="grid gap-3">
                          <input
                            value={session.subject}
                            onChange={(event) => updateSession(dayIndex, sessionIndex, { subject: event.target.value })}
                            placeholder="Mata pelajaran"
                            className="h-11 rounded-xl border-2 border-primary/5 px-3 text-sm font-bold outline-none focus:border-primary/20"
                          />
                          <input
                            value={session.topic}
                            onChange={(event) => updateSession(dayIndex, sessionIndex, { topic: event.target.value })}
                            placeholder="Topik belajar"
                            className="h-11 rounded-xl border-2 border-primary/5 px-3 text-sm font-bold outline-none focus:border-primary/20"
                          />
                          <div className="flex gap-2">
                            <label className="relative min-w-0 flex-1">
                              <span className="sr-only">Durasi belajar dalam menit</span>
                              <input
                                type="number"
                                min={1}
                                max={480}
                                value={session.duration_minutes}
                                onChange={(event) => updateSession(dayIndex, sessionIndex, { duration_minutes: Number(event.target.value) })}
                                className="h-11 w-full rounded-xl border-2 border-primary/5 px-3 pr-16 text-sm font-bold outline-none focus:border-primary/20"
                              />
                              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase tracking-widest text-neutral-300">
                                menit
                              </span>
                            </label>
                            <button
                              type="button"
                              onClick={() => removeSession(dayIndex, sessionIndex)}
                              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-error"
                              aria-label="Hapus sesi"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addSession(dayIndex)}
                      className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-xs font-black text-primary"
                    >
                      <Plus size={15} /> Tambah Sesi
                    </button>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addDay}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary/20 bg-primary/[0.02] px-4 py-4 text-xs font-black text-primary"
              >
                <Plus size={16} /> Tambah Hari Belajar
              </button>
            </div>
          ) : (
            <ScheduleView result={result} />
          )}
          {!isEditing && (!Array.isArray(result.schedule) || result.schedule.length === 0) && (
            <button
              type="button"
              onClick={() => router.push("/schedule")}
              className="mt-6 w-full rounded-2xl bg-primary px-6 py-4 text-sm font-black text-white shadow-lg shadow-primary/20"
            >
              Scan Ulang atau Buat Manual
            </button>
          )}
        </motion.section>
      </div>
    </div>
  );
}
