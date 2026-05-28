"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, CheckCircle2, XCircle, Sparkles, ArrowRight, HelpCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { getApiErrorMessage } from "@/lib/apiError";
import { useToastStore } from "@/store/toastStore";
import SobiEncouragement from "@/components/sobi/SobiEncouragement";
import { motion, AnimatePresence } from "framer-motion";
import { Modal } from "@/components/ui/Modal";
import { AIMarkdown } from "@/components/ai/AIMarkdown";

interface Question {
  id: string;
  question_text: string;
  options: Record<string, string>;
  user_answer?: string;
  is_correct?: boolean;
  explanation?: string;
  correct_answer?: string;
}

function PracticeMarkdown({ children, className }: { children: string; className?: string }) {
  return <AIMarkdown className={className}>{children}</AIMarkdown>;
}

function formatTimer(milliseconds: number) {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function PracticeSessionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionID = searchParams.get("id");
  const { addToast } = useToastStore();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  
  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [explanation, setExplanation] = useState<string>("");
  const [correctAnswer, setCorrectAnswer] = useState<string | null>(null);
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);
  const [isHintModalOpen, setIsHintModalOpen] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [timerDeadlineMs, setTimerDeadlineMs] = useState<number | null>(null);
  const [timeRemainingMs, setTimeRemainingMs] = useState<number | null>(null);
  const timerFinishedRef = useRef(false);
  const contentTopRef = React.useRef<HTMLDivElement>(null);
  const feedbackRef = React.useRef<HTMLDivElement>(null);
  const timerStorageKey = useMemo(
    () => (sessionID ? `sobat-pintar-practice-timer:${sessionID}` : null),
    [sessionID]
  );

  const clearPracticeTimer = useCallback(() => {
    if (!timerStorageKey) return;
    sessionStorage.removeItem(timerStorageKey);
    setTimerDeadlineMs(null);
    setTimeRemainingMs(null);
  }, [timerStorageKey]);

  const finishSession = useCallback(
    async (successMessage?: string) => {
      if (!sessionID || isFinishing) return;

      setIsFinishing(true);
      try {
        await api.post(`/practice/sessions/${sessionID}/finish`);
        clearPracticeTimer();
        if (successMessage) {
          addToast(successMessage, "success");
        }
        router.push(`/practice/result?id=${sessionID}`);
      } catch (err: unknown) {
        addToast(getApiErrorMessage(err, "Gagal menyelesaikan latihan."), "error");
        setIsFinishing(false);
      }
    },
    [addToast, clearPracticeTimer, isFinishing, router, sessionID]
  );

  useEffect(() => {
    if (!sessionID) {
      router.push("/practice");
      return;
    }

    const fetchSession = async () => {
      try {
        const res = await api.get(`/practice/sessions/${sessionID}`);
        const loadedQuestions: Question[] = res.data.questions || [];
        const firstUnansweredIndex = loadedQuestions.findIndex((question) => !question.user_answer);

        setQuestions(loadedQuestions);

        if (loadedQuestions.length === 0) {
          return;
        }

        if (firstUnansweredIndex === -1) {
          clearPracticeTimer();
          router.push(`/practice/result?id=${sessionID}`);
          return;
        }

        setCurrentIndex(firstUnansweredIndex);
      } catch (err: unknown) {
        addToast(getApiErrorMessage(err, "Gagal memuat sesi latihan."), "error");
      }
    };

    fetchSession();
  }, [addToast, clearPracticeTimer, router, sessionID]);

  const currentQuestion = questions[currentIndex];
  const hasUnansweredQuestions = questions.some((question) => !question.user_answer);

  useEffect(() => {
    if (!currentQuestion) return;

    if (currentQuestion.user_answer) {
      setSelectedOption(currentQuestion.user_answer);
      setIsCorrect(Boolean(currentQuestion.is_correct));
      setExplanation(currentQuestion.explanation || "");
      setCorrectAnswer(currentQuestion.correct_answer || null);
      setHasSubmitted(true);
      return;
    }

    setSelectedOption(null);
    setIsCorrect(false);
    setExplanation("");
    setCorrectAnswer(null);
    setHasSubmitted(false);
  }, [currentQuestion]);

  useEffect(() => {
    if (!sessionID || questions.length === 0 || !hasUnansweredQuestions || isFinishing) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [sessionID, questions.length, hasUnansweredQuestions, isFinishing]);

  useEffect(() => {
    contentTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [currentIndex]);

  useEffect(() => {
    if (!hasSubmitted) return;
    feedbackRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [hasSubmitted]);

  useEffect(() => {
    if (!timerStorageKey) return;

    const rawTimer = sessionStorage.getItem(timerStorageKey);
    if (!rawTimer) return;

    try {
      const parsedTimer = JSON.parse(rawTimer) as { deadline_ms?: number };
      if (!parsedTimer.deadline_ms || parsedTimer.deadline_ms <= Date.now()) {
        timerFinishedRef.current = true;
        finishSession("Waktu habis. Sobi menghitung hasil latihanmu.");
        return;
      }
      setTimerDeadlineMs(parsedTimer.deadline_ms);
      setTimeRemainingMs(parsedTimer.deadline_ms - Date.now());
    } catch {
      sessionStorage.removeItem(timerStorageKey);
    }
  }, [finishSession, timerStorageKey]);

  useEffect(() => {
    if (!timerDeadlineMs || isFinishing) return;

    const tick = () => {
      const remaining = timerDeadlineMs - Date.now();
      setTimeRemainingMs(Math.max(0, remaining));

      if (remaining <= 0 && !timerFinishedRef.current) {
        timerFinishedRef.current = true;
        finishSession("Waktu habis. Sobi menghitung hasil latihanmu.");
      }
    };

    tick();
    const intervalID = window.setInterval(tick, 1000);
    return () => window.clearInterval(intervalID);
  }, [finishSession, isFinishing, timerDeadlineMs]);

  const handleSubmit = async () => {
    if (isSubmitting || hasSubmitted) return;

    if (!selectedOption || !currentQuestion) return;
    
    setIsSubmitting(true);
    try {
      const res = await api.post(`/practice/questions/${currentQuestion.id}/answer`, {
        question_id: currentQuestion.id,
        answer: selectedOption,
      });
      setIsCorrect(res.data.is_correct);
      setExplanation(res.data.explanation);
      setCorrectAnswer(res.data.correct_answer);
      setHasSubmitted(true);
      setQuestions((prevQuestions) =>
        prevQuestions.map((question) =>
          question.id === currentQuestion.id
            ? {
                ...question,
                user_answer: selectedOption,
                is_correct: res.data.is_correct,
                explanation: res.data.explanation,
                correct_answer: res.data.correct_answer,
              }
            : question
        )
      );
    } catch (err: unknown) {
      addToast(getApiErrorMessage(err, "Gagal mengirim jawaban. Coba lagi."), "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      clearPracticeTimer();
      router.push(`/practice/result?id=${sessionID}`);
    }
  };

  const handleFinishSession = async () => {
    await finishSession();
  };

  if (!currentQuestion) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-[#FDFEFF]">
        <motion.div 
          animate={{ scale: [1, 1.1, 1], rotate: [0, 360] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center mb-8"
        >
          <Sparkles size={32} className="text-primary" />
        </motion.div>
        <p className="text-neutral-800 font-black text-lg">Sobi sedang menyiapkan soal...</p>
      </div>
    );
  }

  const isLastQuestion = currentIndex === questions.length - 1;
  const progress = ((currentIndex) / questions.length) * 100;
  const hasTimer = timeRemainingMs !== null;
  const isTimerLow = hasTimer && timeRemainingMs <= 60 * 1000;

  return (
    <div className="min-h-screen bg-[#FDFEFF] relative overflow-hidden flex flex-col">
      {/* Premium Background Mesh */}
      <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-primary/5 to-transparent -z-10" />
      
      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/70 backdrop-blur-xl px-6 pt-12 pb-6 border-b-4 border-white sticky top-0 z-20 shadow-xl shadow-primary/5"
      >
        <div className="flex justify-between items-center mb-5">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
	            onClick={() => setIsExitModalOpen(true)}
	            className="w-10 h-10 bg-white rounded-xl shadow-lg shadow-black/5 flex items-center justify-center border border-gray-100 text-neutral-800"
	            aria-label="Keluar dari latihan"
          >
            <ChevronLeft size={20} strokeWidth={3} />
          </motion.button>
          
          <div className="flex min-w-0 flex-col items-center gap-2">
            <div className="bg-primary/10 px-4 py-1.5 rounded-full border border-primary/10">
              <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">
                Soal {currentIndex + 1} / {questions.length}
              </span>
            </div>
            {hasTimer && (
              <div
                className={cn(
                  "flex min-w-[92px] items-center justify-center gap-2 rounded-full border-2 px-4 py-1.5 text-xs font-black uppercase tracking-widest",
                  isTimerLow
                    ? "border-red-100 bg-red-50 text-red-500"
                    : "border-secondary/15 bg-secondary/10 text-secondary"
                )}
              >
                <Clock size={14} strokeWidth={3} />
                {formatTimer(timeRemainingMs)}
              </div>
            )}
          </div>
          
          <button
            type="button"
            onClick={() => setIsHintModalOpen(true)}
            className="w-10 h-10 bg-white rounded-xl shadow-lg shadow-black/5 flex items-center justify-center border border-gray-100 text-secondary"
            aria-label="Lihat petunjuk latihan"
          >
            <HelpCircle size={20} strokeWidth={3} />
          </button>
        </div>

        {/* Progress Bar Upgrade */}
        <div className="w-full bg-gray-100/50 rounded-full h-3 overflow-hidden border border-gray-100/50">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="bg-primary h-full rounded-full shadow-[0_0_15px_rgba(2,212,143,0.5)]"
          />
        </div>
      </motion.header>

      <main className="flex-1 px-6 pt-10 pb-20 max-w-2xl mx-auto w-full">
        <div ref={contentTopRef} />
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-10"
          >
            {/* Question Card Upgrade */}
            <div className="bg-white p-5 rounded-[2rem] border-4 border-white shadow-[0_20px_50px_rgba(0,0,0,0.05)] relative overflow-hidden sm:p-8 sm:rounded-[3rem]">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -z-10" />
              <PracticeMarkdown className="text-base font-black text-neutral-800 leading-relaxed text-center sm:text-xl">
                {currentQuestion.question_text}
              </PracticeMarkdown>
            </div>

            {/* Options Upgrade */}
            <div className="space-y-4">
              {Object.entries(currentQuestion.options).map(([key, value]) => {
                const isSelected = selectedOption === key;
                const isCorrectOption = hasSubmitted && correctAnswer === key;
                
                let optionStyle = "bg-white border-white text-neutral-600 shadow-xl shadow-black/5";
                let icon = null;

                if (isSelected && !hasSubmitted) {
                  optionStyle = "border-primary bg-primary/5 text-primary scale-[1.02] shadow-2xl shadow-primary/10";
                } else if (hasSubmitted) {
                  if (isSelected) {
                    if (isCorrect) {
                      optionStyle = "bg-green-50 border-green-500 text-green-700 font-bold scale-[1.02] shadow-2xl shadow-green-500/10";
                      icon = <CheckCircle2 size={24} className="text-green-500" />;
                    } else {
                      optionStyle = "bg-red-50 border-red-500 text-red-700 font-bold scale-[1.02] shadow-2xl shadow-red-500/10";
                      icon = <XCircle size={24} className="text-red-500" />;
                    }
                  } else if (isCorrectOption) {
                    optionStyle = "bg-green-50 border-green-500 text-green-700 font-bold shadow-2xl shadow-green-500/10";
                    icon = <CheckCircle2 size={24} className="text-green-500" />;
                  } else {
                    optionStyle = "bg-white border-white text-neutral-300 opacity-50";
                  }
                }

                return (
                  <motion.button
                    key={key}
                    whileHover={!hasSubmitted ? { y: -2 } : {}}
                    whileTap={!hasSubmitted ? { scale: 0.98 } : {}}
                    disabled={hasSubmitted}
                    onClick={() => setSelectedOption(key)}
                    className={cn(
                      "w-full p-4 rounded-[2rem] border-4 text-left transition-all flex items-center justify-between sm:p-6 sm:rounded-[2.5rem]",
                      optionStyle
                    )}
                  >
                    <div className="flex items-center gap-3 sm:gap-5">
                      <span className={cn(
                        "w-10 h-10 flex items-center justify-center rounded-2xl text-sm font-black transition-colors",
                        isCorrectOption
                          ? "bg-green-100 text-green-600"
                          : (isSelected || hasSubmitted) && isSelected 
                          ? (hasSubmitted ? (isCorrect ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600") : "bg-primary text-white") 
                          : "bg-gray-50 text-neutral-400"
                      )}>
                        {key}
                      </span>
                      <PracticeMarkdown className="text-[15px] font-black leading-relaxed">
                        {value}
                      </PracticeMarkdown>
                    </div>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: icon ? 1 : 0 }}
                    >
                      {icon}
                    </motion.div>
                  </motion.button>
                );
              })}
            </div>

            {/* Action Button Upgrade */}
            {!hasSubmitted ? (
              <Button
                onClick={handleSubmit}
                disabled={!selectedOption || isSubmitting}
                isLoading={isSubmitting}
                className="w-full py-5 h-auto text-base rounded-[2rem] shadow-[0_20px_50px_rgba(2,212,143,0.3)] font-black mt-4 sm:py-7 sm:text-xl sm:rounded-[2.5rem]"
                hideChildrenWhenLoading
              >
                Cek Jawaban
              </Button>
            ) : (
              <motion.div 
                ref={feedbackRef}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="pt-4 space-y-8"
              >
                <SobiEncouragement
                  isCorrect={isCorrect}
                  message={explanation}
                />
                {!isCorrect && correctAnswer && currentQuestion.options[correctAnswer] && (
                  <div className="rounded-[2rem] border-2 border-green-100 bg-green-50 p-5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-green-600">Jawaban Benar</p>
                    <div className="mt-2 flex items-start gap-3 text-sm font-bold leading-relaxed text-green-800">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-green-100 text-xs font-black text-green-700">
                        {correctAnswer}
                      </span>
                      <PracticeMarkdown>{currentQuestion.options[correctAnswer]}</PracticeMarkdown>
                    </div>
                  </div>
                )}
                <Button
                  onClick={handleNext}
                  className="w-full py-5 h-auto text-base rounded-[2rem] shadow-[0_20px_50px_rgba(2,212,143,0.3)] font-black group sm:py-7 sm:text-xl sm:rounded-[2.5rem]"
                >
                  {isLastQuestion ? "Lihat Hasil Akhir" : "Soal Berikutnya"}
                  <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Background Decoration */}
      <div className="fixed -bottom-20 -right-20 w-80 h-80 bg-primary/5 rounded-full blur-[100px] pointer-events-none -z-10" />

      <Modal 
        isOpen={isExitModalOpen}
        onClose={() => setIsExitModalOpen(false)}
        onConfirm={handleFinishSession}
        title="Selesaikan Latihan?"
        description="Latihan akan langsung selesai dan nilai dihitung dari jawaban yang sudah kamu kirim."
        confirmText={isFinishing ? "Menyelesaikan..." : "Selesaikan"}
        cancelText="Lanjut Belajar"
        variant="warning"
      />
      <Modal
        isOpen={isHintModalOpen}
        onClose={() => setIsHintModalOpen(false)}
        onConfirm={() => undefined}
        title="Petunjuk Latihan"
        description="Pilih jawaban terbaik dulu, lalu tekan Cek Jawaban. Setelah itu Sobi akan menampilkan pembahasan dan jawaban benar kalau pilihanmu belum tepat."
        confirmText="Mengerti"
        cancelText="Tutup"
        variant="info"
      />
    </div>
  );
}

export default function PracticeSessionPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PracticeSessionContent />
    </Suspense>
  );
}
