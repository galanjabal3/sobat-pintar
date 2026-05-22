"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  ChevronDown,
  Home,
  RotateCcw,
  Sparkles,
  Trophy,
  XCircle,
} from "lucide-react";
import { motion } from "framer-motion";

import { AIMarkdown } from "@/components/ai/AIMarkdown";
import { Button } from "@/components/ui/Button";
import api from "@/lib/api";
import { getApiErrorMessage } from "@/lib/apiError";
import { SOBI_ASSETS } from "@/lib/assets";
import { cn } from "@/lib/utils";
import { useToastStore } from "@/store/toastStore";

type PracticeQuestionResult = {
  id: string;
  question_text: string;
  options: Record<string, string>;
  correct_answer: string;
  user_answer?: string;
  is_correct?: boolean;
  explanation: string;
};

type PracticeResult = {
  session_id: string;
  subject: string;
  difficulty: string;
  score: number;
  total_questions: number;
  correct_answers: number;
  questions?: PracticeQuestionResult[];
};

function PracticeMarkdown({ children, className }: { children: string; className?: string }) {
  return <AIMarkdown className={className}>{children}</AIMarkdown>;
}

function getResultMessage(score: number) {
  if (score >= 90) return "Sempurna! Kamu luar biasa!";
  if (score >= 70) return "Bagus sekali! Pertahankan prestasimu.";
  if (score >= 50) return "Lumayan! Yuk belajar lagi biar makin jago.";
  return "Jangan menyerah! Latihan terus pasti bisa.";
}

function getResultTip(score: number) {
  if (score >= 90) return "Pertahankan ritme belajarmu dan coba tingkat kesulitan yang lebih tinggi.";
  if (score >= 70) return "Cek lagi soal yang belum tepat supaya konsepnya makin kuat.";
  if (score >= 50) return "Kamu sudah mulai paham. Baca pembahasan, lalu ulangi topik yang masih sulit.";
  return "Mulai dari pembahasan soal yang salah dulu. Pelan-pelan, yang penting paham.";
}

export default function PracticeResultPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const { addToast } = useToastStore();

  const [result, setResult] = useState<PracticeResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedQuestionID, setExpandedQuestionID] = useState<string | null>(null);

  const fetchResult = useCallback(async () => {
    if (!id) {
      router.push("/practice");
      return;
    }

    try {
      const response = await api.get(`/practice/sessions/${id}/result`);
      const nextResult = response.data as PracticeResult;
      setResult(nextResult);
      setExpandedQuestionID(nextResult.questions?.find((question) => !question.is_correct)?.id || null);
    } catch (err: unknown) {
      addToast(getApiErrorMessage(err, "Selesaikan semua soal dulu ya."), "error");
      router.push("/practice");
    } finally {
      setIsLoading(false);
    }
  }, [addToast, id, router]);

  useEffect(() => {
    fetchResult();
  }, [fetchResult]);

  const questions = useMemo(() => result?.questions || [], [result?.questions]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#FDFEFF] p-6">
        <motion.div
          animate={{ scale: [1, 1.1, 1], rotate: [0, 360] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="mb-8 flex h-20 w-20 items-center justify-center rounded-[2rem] bg-primary/10"
        >
          <Sparkles size={32} className="text-primary" />
        </motion.div>
        <p className="text-lg font-black text-neutral-800">Menghitung skormu...</p>
      </div>
    );
  }

  const score = result?.score || 0;
  const correct = result?.correct_answers || 0;
  const total = result?.total_questions || 0;
  const wrong = total - correct;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#FDFEFF] px-5 pb-20 pt-12 sm:px-6 sm:pt-16">
      <div className="absolute left-0 top-0 -z-10 h-[420px] w-full bg-gradient-to-b from-primary/10 to-transparent" />
      <div className="fixed -bottom-20 -right-20 -z-10 h-80 w-80 rounded-full bg-primary/5 blur-[100px]" />

      <main className="mx-auto w-full max-w-2xl">
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <div className="relative mx-auto mb-4 h-40 w-40 sm:h-48 sm:w-48">
            <Image
              src={SOBI_ASSETS.TROPHY}
              alt="Sobi membawa piala"
              fill
              unoptimized
              priority
              className="object-contain drop-shadow-2xl"
              sizes="(max-width: 640px) 160px, 192px"
            />
          </div>

          <h1 className="text-2xl font-black leading-tight text-neutral-800 sm:text-3xl">
            {getResultMessage(score)}
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-sm font-bold leading-relaxed text-neutral-500">
            {getResultTip(score)}
          </p>
          <div className="mt-4 inline-flex rounded-full border border-white bg-white/70 px-5 py-2 text-[10px] font-black uppercase tracking-widest text-neutral-500 shadow-sm backdrop-blur-md">
            {result?.subject} • {result?.difficulty}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="relative mb-8 rounded-[2.5rem] border-4 border-white bg-white/75 p-6 shadow-[0_30px_70px_rgba(0,0,0,0.08)] backdrop-blur-2xl sm:p-8"
        >
          <div className="absolute -top-7 left-1/2 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-2xl border-4 border-white bg-secondary text-white shadow-2xl shadow-secondary/30">
            <Trophy size={28} strokeWidth={2.5} />
          </div>

          <div className="pt-5 text-center">
            <p className="mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400">
              Skor Akhir Kamu
            </p>
            <div className="text-7xl font-black leading-none text-primary sm:text-8xl">
              {score}
            </div>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-3 border-t-2 border-gray-50 pt-6">
            <div className="rounded-3xl border-2 border-primary/10 bg-primary/5 p-4 text-center">
              <p className="text-xl font-black text-primary">{total}</p>
              <p className="mt-1 text-[9px] font-black uppercase tracking-widest text-primary/50">Soal</p>
            </div>
            <div className="rounded-3xl border-2 border-green-50 bg-green-50/70 p-4 text-center">
              <p className="text-xl font-black text-green-600">{correct}</p>
              <p className="mt-1 text-[9px] font-black uppercase tracking-widest text-green-600/50">Benar</p>
            </div>
            <div className="rounded-3xl border-2 border-red-50 bg-red-50/70 p-4 text-center">
              <p className="text-xl font-black text-red-600">{wrong}</p>
              <p className="mt-1 text-[9px] font-black uppercase tracking-widest text-red-600/50">Salah</p>
            </div>
          </div>
        </motion.section>

        {questions.length > 0 ? (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-primary">
                  Review Jawaban
                </p>
                <h2 className="text-xl font-black text-neutral-800">Cek pembahasanmu</h2>
              </div>
              <div className="rounded-full bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-neutral-400 shadow-sm">
                {questions.length} Soal
              </div>
            </div>

            <div className="space-y-3">
              {questions.map((question, index) => {
                const isExpanded = expandedQuestionID === question.id;
                const isCorrect = Boolean(question.is_correct);
                const userAnswerText = question.user_answer
                  ? question.options[question.user_answer]
                  : "Belum dijawab";
                const correctAnswerText = question.options[question.correct_answer] || "";

                return (
                  <article
                    key={question.id}
                    className={cn(
                      "overflow-hidden rounded-[2rem] border-2 bg-white/80 shadow-xl shadow-primary/5 transition-all",
                      isCorrect ? "border-green-100" : "border-red-100"
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedQuestionID(isExpanded ? null : question.id)}
                      className="flex w-full items-center gap-3 p-4 text-left"
                    >
                      <span
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-sm font-black",
                          isCorrect ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                        )}
                      >
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          {isCorrect ? (
                            <CheckCircle2 size={16} className="text-green-500" />
                          ) : (
                            <XCircle size={16} className="text-red-500" />
                          )}
                          <p
                            className={cn(
                              "text-[10px] font-black uppercase tracking-widest",
                              isCorrect ? "text-green-600" : "text-red-600"
                            )}
                          >
                            {isCorrect ? "Benar" : "Perlu dipelajari"}
                          </p>
                        </div>
                        <PracticeMarkdown className="line-clamp-2 text-sm font-black leading-relaxed text-neutral-800">
                          {question.question_text}
                        </PracticeMarkdown>
                      </div>
                      <ChevronDown
                        size={20}
                        className={cn(
                          "shrink-0 text-neutral-300 transition-transform",
                          isExpanded && "rotate-180"
                        )}
                      />
                    </button>

                    {isExpanded ? (
                      <div className="border-t border-gray-100 px-4 pb-5 pt-4">
                        <PracticeMarkdown className="mb-4 text-sm font-bold leading-relaxed text-neutral-700">
                          {question.question_text}
                        </PracticeMarkdown>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <div
                            className={cn(
                              "rounded-2xl border-2 p-4",
                              isCorrect ? "border-green-100 bg-green-50/70" : "border-red-100 bg-red-50/70"
                            )}
                          >
                            <p className="mb-2 text-[9px] font-black uppercase tracking-widest text-neutral-400">
                              Jawabanmu
                            </p>
                            <p className="text-xs font-black text-neutral-800">
                              {question.user_answer || "-"}
                            </p>
                            <PracticeMarkdown className="mt-1 text-xs font-bold leading-relaxed text-neutral-600">
                              {userAnswerText}
                            </PracticeMarkdown>
                          </div>

                          <div className="rounded-2xl border-2 border-green-100 bg-green-50/70 p-4">
                            <p className="mb-2 text-[9px] font-black uppercase tracking-widest text-green-600">
                              Jawaban Benar
                            </p>
                            <p className="text-xs font-black text-green-700">
                              {question.correct_answer}
                            </p>
                            <PracticeMarkdown className="mt-1 text-xs font-bold leading-relaxed text-green-800">
                              {correctAnswerText}
                            </PracticeMarkdown>
                          </div>
                        </div>

                        <div className="mt-3 rounded-2xl bg-primary/5 p-4">
                          <p className="mb-2 text-[9px] font-black uppercase tracking-widest text-primary">
                            Pembahasan Sobi
                          </p>
                          <PracticeMarkdown className="text-xs font-bold leading-relaxed text-neutral-700">
                            {question.explanation || "Belum ada pembahasan untuk soal ini."}
                          </PracticeMarkdown>
                        </div>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </motion.section>
        ) : null}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          <Button
            onClick={() => router.push("/practice")}
            className="h-auto w-full rounded-[2.5rem] py-7 text-xl font-black shadow-[0_20px_50px_rgba(2,212,143,0.3)]"
          >
            Latihan Lagi
            <RotateCcw size={20} className="ml-2" />
          </Button>
          <Button
            onClick={() => router.push("/dashboard")}
            variant="outline"
            className="h-auto w-full rounded-[2.5rem] border-4 border-white bg-white/60 py-7 text-xl font-black text-neutral-600 shadow-xl shadow-black/5 backdrop-blur-md hover:bg-white"
          >
            <Home size={20} className="mr-2" />
            Kembali ke Beranda
          </Button>
        </motion.div>
      </main>
    </div>
  );
}
