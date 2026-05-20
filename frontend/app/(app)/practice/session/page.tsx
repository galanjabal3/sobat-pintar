"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, CheckCircle2, XCircle, Sparkles, ArrowRight, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { getApiErrorMessage } from "@/lib/apiError";
import { useToastStore } from "@/store/toastStore";
import SobiEncouragement from "@/components/sobi/SobiEncouragement";
import { motion, AnimatePresence } from "framer-motion";
import { Modal } from "@/components/ui/Modal";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { formatAIMarkdown, renderAIMarkdownLink } from "@/lib/aiMarkdown";

interface Question {
  id: string;
  question_text: string;
  options: Record<string, string>;
  user_answer?: string;
  is_correct?: boolean;
  explanation?: string;
}

function PracticeMarkdown({ children, className }: { children: string; className?: string }) {
  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="m-0">{children}</p>,
          strong: ({ children }) => <strong className="font-black text-neutral-900">{children}</strong>,
          em: ({ children }) => <em className="italic font-black text-neutral-900">{children}</em>,
          del: ({ children }) => <del className="text-neutral-500 decoration-2">{children}</del>,
          code: ({ children }) => (
            <code className="rounded-lg bg-primary/10 px-1.5 py-0.5 font-black text-primary">{children}</code>
          ),
          a: ({ href, children }) => renderAIMarkdownLink(href, children),
          ul: ({ children }) => <ul className="my-2 list-disc space-y-1 pl-5 text-left">{children}</ul>,
          ol: ({ children }) => <ol className="my-2 list-decimal space-y-1 pl-5 text-left">{children}</ol>,
          li: ({ children }) => <li className="pl-1">{children}</li>,
        }}
      >
        {formatAIMarkdown(children)}
      </ReactMarkdown>
    </div>
  );
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
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);

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
          router.push(`/practice/result?id=${sessionID}`);
          return;
        }

        setCurrentIndex(firstUnansweredIndex);
      } catch (err: unknown) {
        addToast(getApiErrorMessage(err, "Gagal memuat sesi latihan."), "error");
      }
    };

    fetchSession();
  }, [sessionID, router, addToast]);

  const currentQuestion = questions[currentIndex];
  const hasUnansweredQuestions = questions.some((question) => !question.user_answer);

  useEffect(() => {
    if (!currentQuestion) return;

    if (currentQuestion.user_answer) {
      setSelectedOption(currentQuestion.user_answer);
      setIsCorrect(Boolean(currentQuestion.is_correct));
      setExplanation(currentQuestion.explanation || "");
      setHasSubmitted(true);
      return;
    }

    setSelectedOption(null);
    setIsCorrect(false);
    setExplanation("");
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
      setHasSubmitted(true);
      setQuestions((prevQuestions) =>
        prevQuestions.map((question) =>
          question.id === currentQuestion.id
            ? {
                ...question,
                user_answer: selectedOption,
                is_correct: res.data.is_correct,
                explanation: res.data.explanation,
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
      router.push(`/practice/result?id=${sessionID}`);
    }
  };

  const handleFinishSession = async () => {
    if (!sessionID || isFinishing) return;

    setIsFinishing(true);
    try {
      await api.post(`/practice/sessions/${sessionID}/finish`);
      router.push(`/practice/result?id=${sessionID}`);
    } catch (err: unknown) {
      addToast(getApiErrorMessage(err, "Gagal menyelesaikan latihan."), "error");
      setIsFinishing(false);
    }
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
        <div className="flex justify-between items-center mb-6">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsExitModalOpen(true)}
            className="w-10 h-10 bg-white rounded-xl shadow-lg shadow-black/5 flex items-center justify-center border border-gray-100 text-neutral-800"
          >
            <ChevronLeft size={20} strokeWidth={3} />
          </motion.button>
          
          <div className="flex flex-col items-center">
            <div className="bg-primary/10 px-4 py-1.5 rounded-full border border-primary/10">
              <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">
                Soal {currentIndex + 1} / {questions.length}
              </span>
            </div>
          </div>
          
          <div className="w-10 h-10 bg-white rounded-xl shadow-lg shadow-black/5 flex items-center justify-center border border-gray-100 text-secondary">
            <HelpCircle size={20} strokeWidth={3} />
          </div>
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
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-10"
          >
            {/* Question Card Upgrade */}
            <div className="bg-white p-8 rounded-[3rem] border-4 border-white shadow-[0_20px_50px_rgba(0,0,0,0.05)] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -z-10" />
              <PracticeMarkdown className="text-xl font-black text-neutral-800 leading-relaxed text-center">
                {currentQuestion.question_text}
              </PracticeMarkdown>
            </div>

            {/* Options Upgrade */}
            <div className="space-y-4">
              {Object.entries(currentQuestion.options).map(([key, value]) => {
                const isSelected = selectedOption === key;
                
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
                      "w-full p-6 rounded-[2.5rem] border-4 text-left transition-all flex items-center justify-between",
                      optionStyle
                    )}
                  >
                    <div className="flex items-center gap-5">
                      <span className={cn(
                        "w-10 h-10 flex items-center justify-center rounded-2xl text-sm font-black transition-colors",
                        (isSelected || hasSubmitted) && isSelected 
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
                className="w-full py-7 h-auto text-xl rounded-[2.5rem] shadow-[0_20px_50px_rgba(2,212,143,0.3)] font-black mt-4"
              >
                Cek Jawaban
              </Button>
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="pt-4 space-y-8"
              >
                <SobiEncouragement
                  isCorrect={isCorrect}
                  message={explanation}
                />
                <Button
                  onClick={handleNext}
                  className="w-full py-7 h-auto text-xl rounded-[2.5rem] shadow-[0_20px_50px_rgba(2,212,143,0.3)] font-black group"
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
