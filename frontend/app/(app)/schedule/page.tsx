"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Calendar, Camera, ChevronLeft, Trash2, Type, X, Zap } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import api from "@/lib/api";
import { getApiErrorMessage } from "@/lib/apiError";
import { notifyAIQuotaUpdated } from "@/lib/aiQuota";
import { SOBI_ASSETS } from "@/lib/assets";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { AIProcessNotice } from "@/components/ai/AIProcessNotice";
import { QuotaBadge } from "@/components/ai/QuotaBadge";
import { useToastStore } from "@/store/toastStore";
import { MAX_SCHEDULE_SUBJECT_CHARS, MAX_SCHEDULE_SUBJECT_COUNT } from "@/lib/aiLimits";
import { ScheduleResult } from "@/components/schedule/ScheduleView";
import { useBeforeUnloadWarning } from "@/hooks/useBeforeUnloadWarning";
import { useAsyncStatusToasts } from "@/hooks/useAsyncStatusToasts";

const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
const MAX_SCHEDULE_IMAGE_SIZE = 5 * 1024 * 1024;
const SUPPORTED_SCHEDULE_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

type ScheduleSourceType = "manual" | "image";

interface UploadAttachmentResponse {
  url?: string;
  data?: {
    url?: string;
  };
}

function todayInputValue() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toExamDate(value: string) {
  return `${value}T00:00:00+07:00`;
}

function formatScheduleDate(date?: string) {
  if (!date) return "Jadwal Belajar";

  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return date;

  return format(parsedDate, "d MMMM yyyy", { locale: idLocale });
}

function getScheduleStatusLabel(status?: ScheduleResult["status"]) {
  if (status === "processing") return "Diproses";
  if (status === "failed") return "Gagal";
  return "Selesai";
}

function getScheduleStatusClassName(status?: ScheduleResult["status"]) {
  if (status === "processing") return "bg-secondary/10 text-secondary";
  if (status === "failed") return "bg-red-50 text-error";
  return "bg-primary/10 text-primary";
}

export default function SchedulePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToast } = useToastStore();
  const [title, setTitle] = useState("");
  const [subjectInput, setSubjectInput] = useState("");
  const [subjects, setSubjects] = useState<string[]>([]);
  const [examDate, setExamDate] = useState("");
  const [availableDays, setAvailableDays] = useState<string[]>(["Senin", "Rabu", "Jumat"]);
  const [hoursPerDay, setHoursPerDay] = useState("2");
  const [history, setHistory] = useState<ScheduleResult[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [sourceType, setSourceType] = useState<ScheduleSourceType>("manual");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const minExamDate = useMemo(() => todayInputValue(), []);

  useBeforeUnloadWarning(isSubmitting);

  const parsedHoursPerDay = Number(hoursPerDay);
  const hasLongSubject = subjects.some((subject) => subject.length > MAX_SCHEDULE_SUBJECT_CHARS);
  const canSubmitManual =
    subjects.length > 0 &&
    subjects.length <= MAX_SCHEDULE_SUBJECT_COUNT &&
    !hasLongSubject &&
    Boolean(examDate) &&
    availableDays.length > 0 &&
    Number.isFinite(parsedHoursPerDay) &&
    parsedHoursPerDay >= 1 &&
    parsedHoursPerDay <= 8;
  const canSubmit = sourceType === "image" ? Boolean(imageFile) : canSubmitManual;

  useAsyncStatusToasts(history, {
    completedMessage: (item) => `${item.title || "Jadwal Belajar"} sudah selesai dibuat.`,
    failedMessage: (item) => `${item.title || "Jadwal Belajar"} gagal dibuat.`,
    onStatusSettled: notifyAIQuotaUpdated,
    showToast: addToast,
  });

  useEffect(() => {
    const mode = searchParams.get("mode");
    if (mode === "image") {
      setSourceType("image");
    } else if (mode === "manual") {
      setSourceType("manual");
    }
  }, [searchParams]);

  const fetchSchedules = useCallback(async () => {
    try {
      const response = await api.get("/schedule");
      setHistory(response.data || []);
    } catch {
      setHistory([]);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  useEffect(() => {
    if (!history.some((item) => item.status === "processing")) return;

    const intervalID = window.setInterval(fetchSchedules, 7500);
    return () => window.clearInterval(intervalID);
  }, [fetchSchedules, history]);

  const toggleDay = (day: string) => {
    setAvailableDays((current) =>
      current.includes(day) ? current.filter((item) => item !== day) : [...current, day]
    );
  };

  const clearImage = () => {
    setImageFile(null);
    setPreviewUrl((currentUrl) => {
      if (currentUrl) URL.revokeObjectURL(currentUrl);
      return null;
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!SUPPORTED_SCHEDULE_IMAGE_TYPES.includes(file.type)) {
      addToast("Gunakan foto JPG, PNG, atau WEBP ya.", "error");
      event.target.value = "";
      return;
    }
    if (file.size > MAX_SCHEDULE_IMAGE_SIZE) {
      addToast("Ukuran foto maksimal 5MB ya.", "error");
      event.target.value = "";
      return;
    }

    setImageFile(file);
    setPreviewUrl((currentUrl) => {
      if (currentUrl) URL.revokeObjectURL(currentUrl);
      return URL.createObjectURL(file);
    });
  };

  const addSubject = (rawValue = subjectInput) => {
    const nextSubjects = rawValue
      .split(",")
      .map((subject) => subject.trim())
      .filter(Boolean);

    if (nextSubjects.length === 0) return;

    const validSubjects: string[] = [];
    for (const subject of nextSubjects) {
      if (subject.length > MAX_SCHEDULE_SUBJECT_CHARS) {
        addToast(`Nama mata pelajaran maksimal ${MAX_SCHEDULE_SUBJECT_CHARS} karakter.`, "error");
        continue;
      }
      if (subjects.some((item) => item.toLowerCase() === subject.toLowerCase()) || validSubjects.some((item) => item.toLowerCase() === subject.toLowerCase())) {
        continue;
      }
      validSubjects.push(subject);
    }

    if (subjects.length + validSubjects.length > MAX_SCHEDULE_SUBJECT_COUNT) {
      addToast(`Maksimal ${MAX_SCHEDULE_SUBJECT_COUNT} mata pelajaran ya.`, "error");
      return;
    }

    setSubjects((current) => [...current, ...validSubjects]);
    setSubjectInput("");
  };

  const removeSubject = (subject: string) => {
    setSubjects((current) => current.filter((item) => item !== subject));
  };

  const handleDelete = (event: React.MouseEvent, id: string) => {
    event.stopPropagation();
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    try {
      await api.delete(`/schedule/${deleteId}`);
      setHistory((current) => current.filter((item) => item.id !== deleteId));
      addToast("Jadwal belajar berhasil dihapus.", "success");
    } catch (err: unknown) {
      addToast(getApiErrorMessage(err, "Gagal menghapus jadwal belajar."), "error");
    } finally {
      setDeleteId(null);
    }
  };

  const handleGenerate = async () => {
    if (isSubmitting) return;

    if (!canSubmit) {
      if (sourceType === "image") {
        addToast("Pilih foto jadwal belajar dulu ya.", "error");
        return;
      }
      if (subjects.length > MAX_SCHEDULE_SUBJECT_COUNT) {
        addToast(`Maksimal ${MAX_SCHEDULE_SUBJECT_COUNT} mata pelajaran ya.`, "error");
      } else if (hasLongSubject) {
        addToast(`Nama mata pelajaran maksimal ${MAX_SCHEDULE_SUBJECT_CHARS} karakter.`, "error");
      } else {
        addToast("Lengkapi mata pelajaran, tanggal ujian, dan hari belajarmu dulu ya.", "error");
      }
      return;
    }

    setIsSubmitting(true);
    try {
      let requestBody;
      if (sourceType === "image" && imageFile) {
        const formData = new FormData();
        formData.append("image", imageFile);
        const uploadResponse = await api.post<UploadAttachmentResponse>("/upload/attachments", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        const imageUrl = uploadResponse.data.url || uploadResponse.data.data?.url;
        if (!imageUrl) {
          throw new Error("Upload response did not include an image URL");
        }
        requestBody = {
          source_type: "image",
          title: title.trim(),
          image_url: imageUrl,
        };
      } else {
        requestBody = {
          source_type: "manual",
          title: title.trim(),
          subjects,
          exam_dates: [toExamDate(examDate)],
          available_days: availableDays,
          hours_per_day: parsedHoursPerDay,
        };
      }

      const response = await api.post("/schedule/generate", requestBody);

      setHistory((current) => [response.data, ...current.filter((item) => item.id !== response.data.id)]);
      setSubjectInput("");
      setTitle("");
      setSubjects([]);
      setExamDate("");
      setAvailableDays(["Senin", "Rabu", "Jumat"]);
      setHoursPerDay("2");
      clearImage();
      notifyAIQuotaUpdated();
      addToast(sourceType === "image" ? "Foto jadwal sedang discan." : "Jadwal belajar sedang dibuat.", "success");
      router.push(`/schedule/result/${response.data.id}`);
    } catch (err: unknown) {
      addToast(getApiErrorMessage(err, "Gagal membuat jadwal belajar."), "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  return (
    <div className="min-h-screen bg-[#FDFEFF] relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-primary/5 to-transparent -z-10" />
      <div className="absolute -top-24 -left-24 w-64 h-64 bg-secondary/10 rounded-full blur-[100px] -z-10" />

      <div className="px-6 pt-12 pb-20 max-w-2xl mx-auto">
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-10"
        >
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => router.push("/dashboard")}
            className="w-12 h-12 bg-white rounded-2xl shadow-xl shadow-primary/5 flex items-center justify-center border border-primary/5 text-neutral-800"
            aria-label="Kembali ke dashboard"
          >
            <ChevronLeft size={24} strokeWidth={2.5} />
          </motion.button>
          <div>
            <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-0.5">Atur Waktumu</p>
            <h1 className="text-xl font-black text-neutral-800">Jadwal Belajar</h1>
          </div>
        </motion.header>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/70 backdrop-blur-2xl border-4 border-white p-5 rounded-[2rem] mb-10 relative overflow-hidden shadow-2xl shadow-primary/5 sm:p-8 sm:rounded-[3rem]"
        >
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <Zap size={16} className="text-secondary fill-secondary" />
              <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Sobi Smart Schedule</p>
            </div>
            <h3 className="text-2xl font-black text-neutral-800 leading-tight mb-6">
              Bikin jadwal belajar <br /> otomatis bareng <span className="text-primary">Sobi!</span>
            </h3>

            <div className="mb-5 grid grid-cols-2 rounded-2xl bg-gray-50 p-1.5">
              <button
                type="button"
                onClick={() => setSourceType("manual")}
                className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-[11px] font-black transition-all ${
                  sourceType === "manual" ? "bg-white text-primary shadow-sm" : "text-neutral-400"
                }`}
                aria-pressed={sourceType === "manual"}
              >
                <Type size={16} /> Buat Manual
              </button>
              <button
                type="button"
                onClick={() => setSourceType("image")}
                className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-[11px] font-black transition-all ${
                  sourceType === "image" ? "bg-white text-primary shadow-sm" : "text-neutral-400"
                }`}
                aria-pressed={sourceType === "image"}
              >
                <Camera size={16} /> Scan Foto
              </button>
            </div>

            <div className="space-y-5">
              <label className="block">
                <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-neutral-400">Nama Jadwal</span>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  maxLength={100}
                  placeholder={sourceType === "image" ? "Contoh: Jadwal UTS Semester 2" : "Opsional, contoh: Persiapan Ujian IPA"}
                  className="h-14 w-full rounded-2xl border-2 border-primary/5 bg-white/70 px-4 text-sm font-bold text-neutral-700 outline-none transition-all placeholder:text-neutral-300 focus:border-primary/20 focus:ring-4 focus:ring-primary/5"
                />
              </label>

              {sourceType === "image" ? (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  {previewUrl ? (
                    <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border-2 border-primary/10">
                      <Image src={previewUrl} alt="Pratinjau foto jadwal" fill unoptimized className="object-cover" />
                      <button
                        type="button"
                        onClick={clearImage}
                        aria-label="Hapus foto jadwal"
                        className="absolute right-3 top-3 rounded-xl bg-white p-2.5 text-red-500 shadow-lg"
                      >
                        <X size={18} strokeWidth={3} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex min-h-52 w-full flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed border-primary/15 bg-primary/[0.02] px-5 text-center transition-colors hover:border-primary/35"
                    >
                      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <Camera size={30} strokeWidth={2.5} />
                      </span>
                      <span>
                        <span className="block text-sm font-black text-neutral-800">Pilih Foto Jadwal</span>
                        <span className="mt-1 block text-xs font-medium leading-relaxed text-neutral-400">
                          Scan jadwal cetak, screenshot, atau jadwal yang dibagikan. JPG, PNG, atau WEBP. Maksimal 5MB.
                        </span>
                      </span>
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <label className="block">
                    <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-neutral-400">Mata Pelajaran</span>
                    <div className="rounded-3xl border-2 border-primary/5 bg-white/70 p-4 transition-all focus-within:border-primary/20 focus-within:ring-4 focus-within:ring-primary/5">
                      <div className="mb-3 flex min-h-12 flex-wrap gap-2">
                        {subjects.map((subject) => (
                          <button
                            key={subject}
                            type="button"
                            onClick={() => removeSubject(subject)}
                            className="inline-flex max-w-full min-w-0 items-center gap-2 rounded-2xl bg-primary px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-primary/10"
                            aria-label={`Hapus ${subject}`}
                          >
                            <span className="min-w-0 truncate">{subject}</span>
                            <span className="shrink-0 text-sm leading-none">×</span>
                          </button>
                        ))}
                        {subjects.length === 0 && (
                          <span className="py-2 text-sm font-bold text-neutral-300">Tambah mata pelajaran...</span>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 min-[420px]:flex-row">
                        <input
                          value={subjectInput}
                          onChange={(event) => {
                            const value = event.target.value;
                            if (value.includes(",")) {
                              addSubject(value);
                            } else {
                              setSubjectInput(value);
                            }
                          }}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" && !event.nativeEvent.isComposing) {
                              event.preventDefault();
                              addSubject();
                            } else if (event.key === "Backspace" && !subjectInput && subjects.length > 0) {
                              removeSubject(subjects[subjects.length - 1]);
                            }
                          }}
                          onBlur={() => addSubject()}
                          maxLength={MAX_SCHEDULE_SUBJECT_CHARS}
                          placeholder="Ketik lalu tekan Enter"
                          className="h-12 min-w-0 flex-1 rounded-2xl bg-primary/5 px-4 text-sm font-bold text-neutral-700 outline-none placeholder:text-neutral-300"
                        />
                        <button
                          type="button"
                          onClick={() => addSubject()}
                          disabled={!subjectInput.trim() || subjects.length >= MAX_SCHEDULE_SUBJECT_COUNT}
                          className="h-12 rounded-2xl bg-primary px-5 text-[10px] font-black uppercase tracking-widest text-white disabled:opacity-40 min-[420px]:w-auto"
                        >
                          Tambah
                        </button>
                      </div>
                    </div>
                    <span className="mt-2 block text-[10px] font-bold text-neutral-300">
                      {subjects.length}/{MAX_SCHEDULE_SUBJECT_COUNT} mata pelajaran
                    </span>
                  </label>

                  <div className="grid grid-cols-1 gap-4 min-[760px]:grid-cols-2">
                    <label className="block min-w-0">
                      <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-neutral-400">Tanggal Ujian</span>
                      <input
                        type="date"
                        min={minExamDate}
                        value={examDate}
                        onChange={(event) => {
                          const value = event.target.value;
                          setExamDate(value && value < minExamDate ? minExamDate : value);
                        }}
                        className="h-14 w-full min-w-0 rounded-2xl border-2 border-primary/5 bg-white/70 px-3 text-[12px] font-bold text-neutral-700 outline-none transition-all focus:border-primary/20 focus:ring-4 focus:ring-primary/5 min-[380px]:px-4"
                      />
                    </label>

                    <label className="block min-w-0">
                      <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-neutral-400">Jam per Hari</span>
                      <input
                        type="number"
                        min={1}
                        max={8}
                        value={hoursPerDay}
                        onChange={(event) => setHoursPerDay(event.target.value)}
                        onBlur={() => {
                          if (!hoursPerDay) return;
                          const nextValue = Math.min(Math.max(Number(hoursPerDay), 1), 8);
                          setHoursPerDay(String(nextValue));
                        }}
                        className="h-14 w-full min-w-0 rounded-2xl border-2 border-primary/5 bg-white/70 px-3 text-sm font-black text-neutral-700 outline-none transition-all focus:border-primary/20 focus:ring-4 focus:ring-primary/5 min-[380px]:px-4"
                      />
                    </label>
                  </div>

                  <div>
                    <span className="mb-3 block text-[10px] font-black uppercase tracking-widest text-neutral-400">Hari Belajar</span>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {DAYS.map((day) => {
                        const active = availableDays.includes(day);
                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => toggleDay(day)}
                            className={[
                              "rounded-2xl border-2 px-3 py-3 text-[10px] font-black uppercase tracking-widest transition-all",
                              active
                                ? "border-primary bg-primary text-white shadow-lg shadow-primary/20"
                                : "border-primary/5 bg-white/70 text-neutral-400",
                            ].join(" ")}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            <Button
              onClick={handleGenerate}
              isLoading={isSubmitting}
              disabled={!canSubmit || isSubmitting}
              className="mt-7 h-auto w-full rounded-2xl px-6 py-5 font-black shadow-xl shadow-primary/20 group sm:w-auto sm:px-8 sm:py-6"
              hideChildrenWhenLoading
            >
              {sourceType === "image" ? "Scan Jadwal" : "Buat Jadwal Baru"}
              <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <AIProcessNotice show={isSubmitting} className="mt-3 max-w-[360px] text-left" />
            <div className="mt-4 max-w-[360px] pr-20 sm:pr-32">
              <QuotaBadge feature="schedule" />
            </div>
          </div>

          <div className="absolute -bottom-6 -right-6 z-0 w-28 h-28 pointer-events-none drop-shadow-2xl opacity-60 sm:w-36 sm:h-36">
            <Image
              src={SOBI_ASSETS.CALENDAR}
              alt="Sobi Calendar"
              fill
              className="object-contain"
              priority
              sizes="176px"
            />
          </div>
        </motion.div>

        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xs font-black text-neutral-400 uppercase tracking-widest flex items-center gap-2">
              <Calendar size={14} /> Jadwal Tersimpan
            </h2>
            <span className="text-[10px] font-black text-primary bg-primary/10 px-3 py-1 rounded-full">
              {history.length} Jadwal
            </span>
          </div>

          {isLoadingHistory ? (
            <div className="h-28 rounded-[2.5rem] bg-gray-100 animate-pulse" />
          ) : history.length > 0 ? (
            <div className="space-y-3">
              {history.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => router.push(`/schedule/result/${item.id}`)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      router.push(`/schedule/result/${item.id}`);
                    }
                  }}
                  className="w-full rounded-[2rem] border-2 border-primary/5 bg-white p-5 text-left shadow-xl shadow-primary/5 transition-all hover:border-primary/20"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="mb-2 flex min-w-0 flex-col items-start gap-2 min-[420px]:flex-row min-[420px]:items-center">
                        <p className="line-clamp-2 min-w-0 break-words text-sm font-black leading-snug text-neutral-800">
                          {item.title || "Jadwal Belajar"}
                        </p>
                        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-widest ${getScheduleStatusClassName(item.status)}`}>
                          {getScheduleStatusLabel(item.status)}
                        </span>
                      </div>
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-neutral-300">
                        {item.status === "processing"
                          ? "Sedang diproses"
                          : item.status === "failed"
                            ? "Gagal dibuat"
                            : item.schedule?.length
                              ? `Mulai ${formatScheduleDate(item.schedule?.[0]?.date)} • ${item.schedule.length} hari belajar`
                              : "Belum ada sesi belajar"}
                      </p>
                      <p className="mt-4 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary">
                        {item.status === "processing" ? "Lihat Proses" : "Buka Jadwal"} <ArrowRight size={12} strokeWidth={3} />
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={(event) => handleDelete(event, item.id)}
                        className="rounded-xl p-2 text-neutral-300 transition-all hover:bg-red-50 hover:text-red-500"
                        aria-label="Hapus jadwal belajar"
                      >
                        <Trash2 size={16} />
                      </button>
                      <Calendar size={20} className="text-primary" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6">
              <EmptyState
                title="Belum Ada Jadwal"
                description="Isi form di atas untuk mulai mengatur jadwal belajarmu bareng Sobi!"
                imageSrc={SOBI_ASSETS.CALENDAR}
              />
            </div>
          )}
        </div>

      </div>

      <div className="fixed -bottom-20 -right-20 w-64 h-64 bg-primary/5 rounded-full blur-[80px] pointer-events-none -z-10" />

      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Hapus Jadwal?"
        description="Jadwal belajar yang dihapus tidak bisa dikembalikan lagi. Kamu yakin?"
        confirmText="Ya, Hapus"
        cancelText="Batal"
        variant="danger"
      />
    </div>
  );
}
