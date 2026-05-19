"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Camera, BookOpen, MessageCircle, FileText, Flame, CheckCircle2, TrendingUp, Trophy, Zap } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { motion } from "framer-motion";

export default function DashboardPage() {
  const { user, fetchProfile } = useAuthStore();
  const [dailyProgress, setDailyProgress] = React.useState(0);
  const hasDailyProgress = dailyProgress > 0;
  const progressMessage = dailyProgress > 0
    ? "Wah, hebat! Teruskan belajarnya ya!"
    : "Mulai satu soal dulu hari ini, yuk!";

  React.useEffect(() => {
    fetchProfile();
    fetchDailyProgress();
  }, []);

  const fetchDailyProgress = async () => {
    try {
      const res = await api.get("/practice/progress");
      if (res.data?.count !== undefined) {
        setDailyProgress(res.data.count);
      }
    } catch (error) {
      console.error("Failed to fetch daily progress", error);
    }
  };

  const showAll = process.env.NEXT_PUBLIC_DEBUG_MODE === "true";

  const features = [
    {
      title: "Jelasin Soal",
      desc: "Foto soal, solusi cepat",
      icon: Camera,
      color: "bg-[#E6F9F3]", // Soft Teal
      iconColor: "text-primary",
      href: "/explain",
      enabled: true,
    },
    {
      title: "Tanya Sobi",
      desc: "Chat AI seru",
      icon: MessageCircle,
      color: "bg-[#FFFBEB]", // Soft Amber
      iconColor: "text-secondary",
      href: "/chat",
      enabled: true,
    },
    {
      title: "Latihan Soal",
      desc: "Asah otak tiap hari",
      icon: BookOpen,
      color: "bg-[#FFF7ED]", // Soft Orange
      iconColor: "text-orange-500",
      href: "/practice",
      enabled: true,
    },
    {
      title: "Rangkuman",
      desc: "Intisari materi sekolah",
      icon: FileText,
      color: "bg-[#EEF2FF]", // Soft Indigo
      iconColor: "text-blue-500",
      href: "/summary",
      enabled: true,
    },
  ].filter(f => f.enabled || showAll);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <div className="min-h-screen bg-[#FDFEFF] relative overflow-hidden">
      {/* Premium Background Mesh */}
      <div className="absolute top-0 left-0 w-full h-[400px] bg-gradient-to-b from-primary/5 to-transparent -z-10" />
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-secondary/10 rounded-full blur-[100px] -z-10" />
      <div className="absolute top-1/4 -left-24 w-48 h-48 bg-primary/10 rounded-full blur-[80px] -z-10" />

      <div className="px-6 pt-10 pb-16 max-w-2xl mx-auto">
        <motion.section
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 rounded-[2rem] bg-white/85 border border-primary/5 p-4 shadow-xl shadow-primary/5"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <Link href="/profile" className="relative group shrink-0" aria-label="Buka profil">
                <div className="w-12 h-12 bg-[#E6F9F3] rounded-full flex items-center justify-center border-4 border-white shadow-lg overflow-hidden transition-transform group-hover:scale-110">
                  {user?.avatar_url ? (
                    <Image
                      src={user.avatar_url}
                      alt="Foto profil"
                      width={48}
                      height={48}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-primary font-black text-lg">
                      {user?.name?.[0] || "S"}
                    </div>
                  )}
                </div>
                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full" />
              </Link>
              <div className="min-w-0">
              <p className="text-[10px] font-black text-primary uppercase tracking-[0.18em]">Sobat Pintar</p>
              <h1 className="flex items-center gap-1 text-lg font-black text-neutral-800 leading-tight">
                  <span className="min-[361px]:hidden">Halo!</span>
                  <span className="hidden min-[361px]:inline truncate">Halo, {user?.name?.split(' ')[0] || "Sobat"}!</span>
                  <span className="shrink-0 animate-bounce" aria-hidden="true">👋</span>
                </h1>
              </div>
            </div>

            <Link href="/leaderboard" className="shrink-0" aria-label="Buka papan peringkat">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="h-11 rounded-2xl bg-secondary px-4 flex items-center justify-center gap-2 shadow-lg shadow-secondary/20 border border-secondary/20"
              >
                <Flame size={17} className="text-neutral-900 fill-neutral-900 shrink-0" />
                <span className="text-sm font-black text-neutral-900">{user?.streak || 0}</span>
              </motion.div>
            </Link>
          </div>
        </motion.section>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-10"
        >
          <h2 className="text-[2.6rem] sm:text-5xl font-black text-neutral-800 leading-[1.05]">
            Mau belajar <br />
            <span className="text-primary">
              apa hari ini?
            </span>
          </h2>
        </motion.div>

        {/* Progress Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          whileHover={{ y: -5 }}
          className="bg-white p-7 rounded-[2.5rem] mb-10 relative overflow-hidden shadow-2xl shadow-primary/5 border border-neutral-50"
        >
          <div className="relative z-10 pr-24 sm:pr-28">
            <div className="flex items-center gap-2 mb-4">
              <Trophy size={16} className="text-secondary" />
              <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Progress Hari Ini</p>
            </div>
            <h3 className="text-3xl font-black text-neutral-800 leading-tight mb-2">
              {dailyProgress} Soal <br />
              <span className="text-primary">{hasDailyProgress ? "Selesai" : "Belum Mulai"}</span>
            </h3>
            <p className="text-[10px] font-bold text-neutral-400">{progressMessage}</p>
            <Link
              href="/leaderboard"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-primary"
            >
              <Zap size={13} className="fill-primary" />
              {user?.points || 0} Poin
            </Link>
          </div>
          
          <div className="absolute top-1/2 right-5 sm:right-6 -translate-y-1/2">
            <div className="w-[72px] h-[72px] sm:w-24 sm:h-24 rounded-full bg-primary/5 flex items-center justify-center relative z-10 border-4 border-white shadow-xl">
              <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-[spin_3s_linear_infinite]" />
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                <CheckCircle2 size={24} className="text-white sm:size-7" strokeWidth={3} />
              </div>
            </div>
          </div>

          <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-primary/10" />
        </motion.div>

        <div className="mb-5 flex items-center gap-4">
          <h2 className="shrink-0 text-base font-black text-neutral-800">Apa rencanamu?</h2>
          <div className="h-px flex-1 bg-neutral-200" />
          <div className="hidden sm:flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-primary">
            <TrendingUp size={12} />
            Mulai belajar
          </div>
        </div>

        {/* Feature Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 gap-3 min-[380px]:gap-4 sm:gap-6"
        >
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <motion.div key={feature.title} variants={itemVariants} className="min-w-0">
                <Link
                  href={feature.href}
                  className={cn(
                    "group min-h-[148px] min-[380px]:min-h-[156px] sm:min-h-[176px] p-4 min-[380px]:p-5 rounded-[1.75rem] sm:rounded-[2rem] flex flex-col justify-between gap-4 min-[380px]:gap-5 transition-all duration-300 hover:scale-[1.03] active:scale-95 border-4 border-white shadow-xl shadow-primary/5 relative overflow-hidden",
                    feature.color
                  )}
                >
                  <div className="p-3 min-[380px]:p-4 rounded-2xl w-fit shadow-lg shadow-black/5 transition-transform group-hover:rotate-12 bg-white shrink-0">
                    <Icon size={20} strokeWidth={3} className={cn("min-[380px]:size-[22px]", feature.iconColor)} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="break-words font-black text-sm min-[380px]:text-base text-neutral-800 mb-1 leading-tight">{feature.title}</h3>
                    <p className="text-[11px] min-[380px]:text-xs text-neutral-500 font-bold leading-relaxed opacity-80">{feature.desc}</p>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}
