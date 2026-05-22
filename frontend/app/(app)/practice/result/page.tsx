"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

const celebrationColors = ["#02D48F", "#FACC15", "#FFAC5A", "#60A5FA", "#F472B6", "#A78BFA", "#FB923C"];

type CelebrationParticle =
  | {
      type: "confetti";
      x: number;
      y: number;
      vx: number;
      vy: number;
      rotation: number;
      rotationVelocity: number;
      size: number;
      shape: "rect" | "circle";
      color: string;
      alpha: number;
      life: number;
      decay: number;
      wave: number;
      waveAmplitude: number;
      waveFrequency: number;
    }
  | {
      type: "star";
      x: number;
      y: number;
      vx: number;
      vy: number;
      rotation: number;
      rotationVelocity: number;
      size: number;
      points: 4 | 5;
      color: string;
      alpha: number;
      life: number;
      decay: number;
      gravity: number;
      delayMs: number;
    }
  | {
      type: "ring";
      x: number;
      y: number;
      radius: number;
      alpha: number;
      color: string;
      speed: number;
    };

function randomCelebrationColor() {
  return celebrationColors[Math.floor(Math.random() * celebrationColors.length)];
}

function makeConfetti(canvasWidth: number): CelebrationParticle {
  const size = 7 + Math.random() * 8;

  return {
    type: "confetti",
    x: Math.random() * canvasWidth,
    y: -20,
    vx: (Math.random() - 0.5) * 2.5,
    vy: 2.5 + Math.random() * 3.5,
    rotation: Math.random() * Math.PI * 2,
    rotationVelocity: (Math.random() - 0.5) * 0.18,
    size,
    shape: Math.random() < 0.5 ? "rect" : "circle",
    color: randomCelebrationColor(),
    alpha: 1,
    life: 1,
    decay: 0.003 + Math.random() * 0.004,
    wave: Math.random() * Math.PI * 2,
    waveAmplitude: 0.8 + Math.random() * 1.2,
    waveFrequency: 0.03 + Math.random() * 0.03,
  };
}

function makeStar(centerX: number, centerY: number, delayMs: number): CelebrationParticle {
  const angle = Math.random() * Math.PI * 2;
  const speed = 3 + Math.random() * 5;

  return {
    type: "star",
    x: centerX,
    y: centerY,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    rotation: 0,
    rotationVelocity: (Math.random() - 0.5) * 0.2,
    size: 4 + Math.random() * 7,
    points: Math.random() < 0.5 ? 4 : 5,
    color: randomCelebrationColor(),
    alpha: 1,
    life: 1,
    decay: 0.016 + Math.random() * 0.012,
    gravity: 0.12,
    delayMs,
  };
}

function makeRing(centerX: number, centerY: number, color: string): CelebrationParticle {
  return {
    type: "ring",
    x: centerX,
    y: centerY,
    radius: 4,
    alpha: 0.7,
    color,
    speed: 2.5,
  };
}

function drawStarShape(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  points: number,
  rotation: number
) {
  context.beginPath();
  for (let index = 0; index < points * 2; index++) {
    const radius = index % 2 === 0 ? size : size * 0.42;
    const angle = (index / (points * 2)) * Math.PI * 2 + rotation;
    const pointX = x + Math.cos(angle) * radius;
    const pointY = y + Math.sin(angle) * radius;
    if (index === 0) {
      context.moveTo(pointX, pointY);
    } else {
      context.lineTo(pointX, pointY);
    }
  }
  context.closePath();
  context.fill();
}

function PerfectScoreCelebration() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    let canvasWidth = 0;
    let canvasHeight = 0;
    let animationFrameID = 0;
    let particles: CelebrationParticle[] = [];
    const timeoutIDs: number[] = [];

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const pixelRatio = window.devicePixelRatio || 1;
      canvasWidth = parent.offsetWidth;
      canvasHeight = parent.offsetHeight;
      canvas.width = canvasWidth * pixelRatio;
      canvas.height = canvasHeight * pixelRatio;
      canvas.style.width = `${canvasWidth}px`;
      canvas.style.height = `${canvasHeight}px`;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    };

    const schedule = (callback: () => void, delayMs: number) => {
      const timeoutID = window.setTimeout(() => {
        const timeoutIndex = timeoutIDs.indexOf(timeoutID);
        if (timeoutIndex >= 0) {
          timeoutIDs.splice(timeoutIndex, 1);
        }
        callback();
      }, delayMs);
      timeoutIDs.push(timeoutID);
    };

    const spawnConfetti = (count: number) => {
      for (let index = 0; index < count; index++) {
        schedule(() => {
          particles.push(makeConfetti(canvasWidth));
        }, index * 18);
      }
    };

    const spawnStarBurst = (centerX: number, centerY: number, count: number, color: string) => {
      particles.push(makeRing(centerX, centerY, color));
      for (let index = 0; index < count; index++) {
        particles.push(makeStar(centerX, centerY, index * 15));
      }
    };

    const spawnCelebration = () => {
      spawnConfetti(70);

      [
        { xRatio: 0.18, yRatio: 0.27, delayMs: 0 },
        { xRatio: 0.82, yRatio: 0.24, delayMs: 180 },
        { xRatio: 0.5, yRatio: 0.13, delayMs: 360 },
        { xRatio: 0.2, yRatio: 0.58, delayMs: 520 },
        { xRatio: 0.8, yRatio: 0.55, delayMs: 680 },
      ].forEach((burst, index) => {
        schedule(() => {
          spawnStarBurst(
            canvasWidth * burst.xRatio,
            canvasHeight * burst.yRatio,
            18,
            celebrationColors[index % celebrationColors.length]
          );
        }, burst.delayMs);
      });
    };

    const tick = () => {
      context.clearRect(0, 0, canvasWidth, canvasHeight);

      particles = particles.filter((particle) => {
        if (particle.type === "ring") {
          particle.radius += particle.speed;
          particle.alpha -= 0.025;
          if (particle.alpha <= 0) return false;

          context.save();
          context.strokeStyle = particle.color;
          context.globalAlpha = particle.alpha;
          context.lineWidth = 2;
          context.beginPath();
          context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
          context.stroke();
          context.restore();
          return true;
        }

        if (particle.type === "star") {
          if (particle.delayMs > 0) {
            particle.delayMs -= 16;
            return true;
          }

          particle.vy += particle.gravity;
          particle.x += particle.vx;
          particle.y += particle.vy;
          particle.rotation += particle.rotationVelocity;
          particle.life -= particle.decay;
          particle.alpha = Math.max(0, particle.life);
          if (particle.life <= 0) return false;

          context.save();
          context.globalAlpha = particle.alpha;
          context.fillStyle = particle.color;
          drawStarShape(context, particle.x, particle.y, particle.size, particle.points, particle.rotation);
          context.restore();
          return true;
        }

        particle.wave += particle.waveFrequency;
        particle.x += particle.vx + Math.sin(particle.wave) * particle.waveAmplitude;
        particle.y += particle.vy;
        particle.rotation += particle.rotationVelocity;
        particle.vy += 0.04;
        particle.life -= particle.decay;
        particle.alpha =
          particle.y > canvasHeight * 0.75
            ? Math.max(0, particle.life * ((canvasHeight - particle.y) / (canvasHeight * 0.25)))
            : particle.life;
        if (particle.life <= 0 || particle.y > canvasHeight + 30) return false;

        context.save();
        context.globalAlpha = Math.max(0, particle.alpha);
        context.fillStyle = particle.color;
        context.translate(particle.x, particle.y);
        context.rotate(particle.rotation);
        if (particle.shape === "rect") {
          context.fillRect(-particle.size / 2, -particle.size / 4, particle.size, particle.size / 2);
        } else {
          context.beginPath();
          context.arc(0, 0, particle.size / 2, 0, Math.PI * 2);
          context.fill();
        }
        context.restore();
        return true;
      });

      if (particles.length > 0 || timeoutIDs.length > 0) {
        animationFrameID = requestAnimationFrame(tick);
      } else {
        context.clearRect(0, 0, canvasWidth, canvasHeight);
      }
    };

    resizeCanvas();
    const resizeObserver = new ResizeObserver(resizeCanvas);
    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    spawnCelebration();
    animationFrameID = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animationFrameID);
      timeoutIDs.forEach((timeoutID) => window.clearTimeout(timeoutID));
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-[420px] overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
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
  const isPerfectScore = score === 100;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#FDFEFF] px-5 pb-16 pt-8 sm:px-6 sm:pt-12">
      {isPerfectScore ? <PerfectScoreCelebration /> : null}
      <div className="absolute left-0 top-0 -z-10 h-[360px] w-full bg-gradient-to-b from-primary/10 to-transparent" />
      <div className="fixed -bottom-20 -right-20 -z-10 h-80 w-80 rounded-full bg-primary/5 blur-[100px]" />

      <main className="mx-auto w-full max-w-2xl">
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 text-center"
        >
          <div className="relative mx-auto mb-3 h-28 w-28 sm:h-36 sm:w-36">
            <Image
              src={SOBI_ASSETS.TROPHY}
              alt="Sobi membawa piala"
              fill
              unoptimized
              priority
              className="object-contain drop-shadow-2xl"
              sizes="(max-width: 640px) 112px, 144px"
            />
          </div>

          <h1 className="text-[1.7rem] font-black leading-tight text-neutral-800 sm:text-3xl">
            {getResultMessage(score)}
          </h1>
          <p className="mx-auto mt-2 max-w-sm text-[13px] font-bold leading-relaxed text-neutral-500 sm:text-sm">
            {getResultTip(score)}
          </p>
          <div className="mt-3 inline-flex rounded-full border border-white bg-white/70 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-neutral-500 shadow-sm backdrop-blur-md">
            {result?.subject} • {result?.difficulty}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="relative mb-6 rounded-[2rem] border-4 border-white bg-white/75 p-5 shadow-[0_30px_70px_rgba(0,0,0,0.08)] backdrop-blur-2xl sm:rounded-[2.5rem] sm:p-7"
        >
          <div className="absolute -top-6 left-1/2 flex h-12 w-12 -translate-x-1/2 items-center justify-center rounded-2xl border-4 border-white bg-secondary text-white shadow-2xl shadow-secondary/30">
            <Trophy size={24} strokeWidth={2.5} />
          </div>

          <div className="pt-4 text-center">
            <p className="mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400">
              Skor Akhir Kamu
            </p>
            <div className="text-6xl font-black leading-none text-primary sm:text-7xl">
              {score}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2 border-t-2 border-gray-50 pt-4 sm:gap-3">
            <div className="rounded-2xl border-2 border-primary/10 bg-primary/5 p-3 text-center sm:rounded-3xl sm:p-4">
              <p className="text-xl font-black text-primary">{total}</p>
              <p className="mt-1 text-[9px] font-black uppercase tracking-widest text-primary/50">Soal</p>
            </div>
            <div className="rounded-2xl border-2 border-green-50 bg-green-50/70 p-3 text-center sm:rounded-3xl sm:p-4">
              <p className="text-xl font-black text-green-600">{correct}</p>
              <p className="mt-1 text-[9px] font-black uppercase tracking-widest text-green-600/50">Benar</p>
            </div>
            <div className="rounded-2xl border-2 border-red-50 bg-red-50/70 p-3 text-center sm:rounded-3xl sm:p-4">
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
