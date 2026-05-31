"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, BookOpen, Calculator, Globe, Beaker, Sparkles, Trophy, ArrowRight, FileText, Clock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { getApiErrorMessage } from "@/lib/apiError";
import { useAuthStore } from "@/store/authStore";
import { useToastStore } from "@/store/toastStore";
import { motion } from "framer-motion";
import { QuotaBadge } from "@/components/ai/QuotaBadge";
import { AIProcessNotice } from "@/components/ai/AIProcessNotice";
import { notifyAIQuotaUpdated } from "@/lib/aiQuota";
import { AutoGrowTextarea } from "@/components/ui/AutoGrowTextarea";
import { useBeforeUnloadWarning } from "@/hooks/useBeforeUnloadWarning";
import {
  MAX_PRACTICE_SOURCE_CONTENT_CHARS,
  MIN_PRACTICE_SOURCE_CONTENT_CHARS,
  PRACTICE_QUESTION_COUNTS,
} from "@/lib/aiLimits";

const SUBJECTS = [
  { id: "Matematika", icon: <Calculator size={24} />, color: "bg-blue-100 text-blue-600 border-blue-200", desc: "Berhitung jadi seru!" },
  { id: "IPA", icon: <Beaker size={24} />, color: "bg-green-100 text-green-600 border-green-200", desc: "Eksplorasi alam" },
  { id: "Bahasa Indonesia", icon: <BookOpen size={24} />, color: "bg-orange-100 text-orange-600 border-orange-200", desc: "Mahir berbahasa" },
  { id: "Bahasa Inggris", icon: <Globe size={24} />, color: "bg-purple-100 text-purple-600 border-purple-200", desc: "Speak like a pro" },
];

const DIFFICULTIES = ["mudah", "sedang", "sulit"];
const PRACTICE_MODES = [
  { id: "general", label: "Topik umum" },
  { id: "source", label: "Materi sendiri" },
] as const;
const TIMER_OPTIONS = [
  { minutes: 0, label: "Bebas", helper: "Tanpa timer" },
  { minutes: 5, label: "5", helper: "Menit" },
  { minutes: 10, label: "10", helper: "Menit" },
  { minutes: 15, label: "15", helper: "Menit" },
];
// Future practice roadmap: image-based source material and short essay questions.
type PracticeMode = (typeof PRACTICE_MODES)[number]["id"];

export default function PracticePage() {
   const router = useRouter();
   const { user } = useAuthStore();
   const { addToast } = useToastStore();
   const [practiceMode, setPracticeMode] = useState<PracticeMode>("general");
   const [selectedSubject, setSelectedSubject] = useState<string>("Matematika");
   const [selectedDifficulty, setSelectedDifficulty] = useState<string>("sedang");
   const [selectedQuestionCount, setSelectedQuestionCount] = useState<number>(5);
   const [selectedTimerMinutes, setSelectedTimerMinutes] = useState<number>(0);
   const [sourceContent, setSourceContent] = useState("");
   const [isLoading, setIsLoading] = useState(false);

   useBeforeUnloadWarning(isLoading);
 
   const handleStart = async () => {
     if (isLoading) return;

     const trimmedSourceContent = sourceContent.trim();
     if (practiceMode === "source" && trimmedSourceContent.length < MIN_PRACTICE_SOURCE_CONTENT_CHARS) {
       addToast(`Materi sendiri minimal ${MIN_PRACTICE_SOURCE_CONTENT_CHARS} karakter ya.`, "error");
       return;
     }

     setIsLoading(true);
     try {
       const userLevel = user?.level || "SD";
       
       const response = await api.post("/practice/start", {
         subject: selectedSubject,
         difficulty: selectedDifficulty,
         level: userLevel,
         source_content: practiceMode === "source" ? trimmedSourceContent : undefined,
         question_count: selectedQuestionCount,
       });
       
       const sessionID = response.data.session_id;
       const timerStorageKey = `sobat-pintar-practice-timer:${sessionID}`;
       if (selectedTimerMinutes > 0) {
         sessionStorage.setItem(
           timerStorageKey,
           JSON.stringify({
             duration_minutes: selectedTimerMinutes,
             deadline_ms: Date.now() + selectedTimerMinutes * 60 * 1000,
           })
         );
       } else {
         sessionStorage.removeItem(timerStorageKey);
       }
       notifyAIQuotaUpdated();
       router.push(`/practice/session?id=${sessionID}`);
     } catch (err: unknown) {
       addToast(getApiErrorMessage(err, "Gagal memulai latihan. Coba lagi ya!"), "error");
       setIsLoading(false);
     }
   };
 
   return (
     <div className="min-h-screen bg-[#FDFEFF] relative overflow-hidden">
       {/* Premium Background Mesh */}
       <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-primary/5 to-transparent -z-10" />
       <div className="absolute -top-24 -left-24 w-64 h-64 bg-primary/10 rounded-full blur-[100px] -z-10" />
 
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
             <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-0.5">Asah Kemampuan</p>
             <h1 className="text-xl font-black text-neutral-800">Latihan Soal</h1>
           </div>
         </motion.header>
 
         <div className="space-y-10">
           <motion.section
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
           >
             <div className="flex items-center gap-2 mb-6">
               <Sparkles size={16} className="text-secondary" />
               <h2 className="text-xs font-black text-neutral-400 uppercase tracking-widest">Mode Latihan</h2>
             </div>

             <div className="flex bg-white/50 backdrop-blur-xl p-2 rounded-[2.5rem] border-4 border-white shadow-xl shadow-primary/5">
               {PRACTICE_MODES.map((mode) => (
                 <button
                   key={mode.id}
                   type="button"
                   onClick={() => setPracticeMode(mode.id)}
                   className={cn(
                     "flex-1 py-4 text-[11px] font-black rounded-[2rem] transition-all min-[390px]:text-xs",
                     practiceMode === mode.id
                       ? "bg-primary text-white shadow-xl shadow-primary/20"
                       : "text-neutral-400 hover:text-neutral-600"
                   )}
                 >
                   {mode.label}
                 </button>
               ))}
             </div>
           </motion.section>

           {/* Subject Selection */}
           <motion.section
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.1 }}
           >
             <div className="flex items-center gap-2 mb-6">
               <BookOpen size={16} className="text-primary" />
               <div>
                 <h2 className="text-xs font-black text-neutral-400 uppercase tracking-widest">
                   {practiceMode === "source" ? "Pilih Kategori" : "Pilih Pelajaran"}
                 </h2>
                 {practiceMode === "source" && (
                   <p className="mt-1 text-[10px] font-bold text-neutral-300">
                     Bantu Sobi menyesuaikan gaya soal dari materimu.
                   </p>
                 )}
               </div>
             </div>
             
             <div className="grid grid-cols-2 gap-3 sm:gap-4">
               {SUBJECTS.map((sub) => (
                 <motion.button
                   key={sub.id}
                   whileHover={{ y: -5 }}
                   whileTap={{ scale: 0.95 }}
                   onClick={() => setSelectedSubject(sub.id)}
                   className={cn(
                     "p-4 rounded-[2rem] border-4 text-left transition-all relative overflow-hidden group sm:p-6 sm:rounded-[2.5rem]",
                     selectedSubject === sub.id
                       ? "border-primary bg-white shadow-2xl shadow-primary/10"
                       : "border-white bg-white/50 hover:border-primary/20 shadow-xl shadow-primary/5"
                   )}
                 >
                   <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-4 shadow-lg transition-transform group-hover:scale-110", sub.color)}>
                     {sub.icon}
                   </div>
                   <p className="font-black text-sm text-neutral-800 mb-1">{sub.id}</p>
                   <p className="text-[9px] text-neutral-400 font-bold">{sub.desc}</p>
                   
                   {selectedSubject === sub.id && (
                     <div className="absolute top-4 right-4">
                       <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/30">
                         <Sparkles size={12} className="text-white" />
                       </div>
                     </div>
                   )}
                 </motion.button>
               ))}
             </div>
           </motion.section>

           {practiceMode === "source" && (
             <motion.section
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.15 }}
             >
               <div className="flex items-center gap-2 mb-6">
                 <FileText size={16} className="text-primary" />
                 <h2 className="text-xs font-black text-neutral-400 uppercase tracking-widest">Materi Sendiri</h2>
               </div>

               <div className="rounded-[2.5rem] border-4 border-white bg-white/70 p-5 shadow-xl shadow-primary/5">
                 <AutoGrowTextarea
                   value={sourceContent}
                   onChange={(event) => setSourceContent(event.target.value)}
                   placeholder="Tempel materi pelajaranmu di sini. Sobi akan membuat soal latihan dari materi ini."
                   maxLength={MAX_PRACTICE_SOURCE_CONTENT_CHARS}
                   minRows={6}
                   maxRows={12}
                   className="w-full rounded-[2rem] border-2 border-primary/5 bg-primary/5 p-5 text-sm font-bold leading-relaxed text-neutral-700 outline-none placeholder:text-neutral-300 focus:border-primary/20 focus:bg-white focus:ring-4 focus:ring-primary/5"
                 />
                 <div className="mt-3 flex items-center justify-between gap-3 text-[10px] font-black uppercase tracking-widest">
                   <span className={sourceContent.trim().length > 0 && sourceContent.trim().length < MIN_PRACTICE_SOURCE_CONTENT_CHARS ? "text-error" : "text-neutral-300"}>
                     Min. {MIN_PRACTICE_SOURCE_CONTENT_CHARS} karakter
                   </span>
                   <span className="text-neutral-300">
                     {sourceContent.length}/{MAX_PRACTICE_SOURCE_CONTENT_CHARS}
                   </span>
                 </div>
               </div>
             </motion.section>
           )}
 
           {/* Difficulty Selection */}
           <motion.section
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.2 }}
           >
             <div className="flex items-center gap-2 mb-6">
               <Trophy size={16} className="text-secondary" />
               <h2 className="text-xs font-black text-neutral-400 uppercase tracking-widest">Tingkat Kesulitan</h2>
             </div>
             
             <div className="flex bg-white/50 backdrop-blur-xl p-2 rounded-[2.5rem] border-4 border-white shadow-xl shadow-primary/5">
               {DIFFICULTIES.map((diff) => (
                 <button
                   key={diff}
                   onClick={() => setSelectedDifficulty(diff)}
                   className={cn(
                     "flex-1 py-4 text-xs font-black capitalize rounded-[2rem] transition-all",
                     selectedDifficulty === diff
                       ? "bg-primary text-white shadow-xl shadow-primary/20"
                       : "text-neutral-400 hover:text-neutral-600"
                   )}
                 >
                   {diff}
                 </button>
               ))}
             </div>
           </motion.section>

           {/* Practice Settings */}
           <motion.section
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.25 }}
           >
             <div className="flex items-center gap-2 mb-6">
               <Sparkles size={16} className="text-primary" />
               <div>
                 <h2 className="text-xs font-black text-neutral-400 uppercase tracking-widest">Pengaturan Latihan</h2>
                 <p className="mt-1 text-[10px] font-bold text-neutral-300">
                   Atur jumlah soal dan timer.
                 </p>
               </div>
             </div>

             <div className="space-y-3 rounded-[2rem] border-4 border-white bg-white/60 p-3 shadow-xl shadow-primary/5">
               <div className="rounded-[1.5rem] bg-primary/5 p-2">
                 <div className="mb-2 flex items-center gap-2 px-2">
                   <Sparkles size={14} className="text-primary" />
                   <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Jumlah Soal</p>
                 </div>
                 <div className="grid grid-cols-3 gap-2">
                   {PRACTICE_QUESTION_COUNTS.map((count) => (
                     <button
                       key={count}
                       type="button"
                       onClick={() => setSelectedQuestionCount(count)}
                       className={cn(
                         "min-h-[54px] rounded-[1.25rem] px-2 text-center transition-all",
                         selectedQuestionCount === count
                           ? "bg-white text-primary shadow-lg shadow-primary/10"
                           : "text-neutral-400 hover:bg-white/60"
                       )}
                     >
                       <span className="text-base font-black leading-none">{count}</span>
                       <span className="ml-1 text-[8px] font-black uppercase tracking-widest">Soal</span>
                     </button>
                   ))}
                 </div>
               </div>

               <div className="rounded-[1.5rem] bg-secondary/5 p-2">
                 <div className="mb-2 flex items-center gap-2 px-2">
                   <Clock size={14} className="text-secondary" />
                   <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Timer</p>
                 </div>
                 <div className="grid grid-cols-2 gap-2 min-[430px]:grid-cols-4 min-[430px]:gap-1.5">
                   {TIMER_OPTIONS.map((option) => (
                     <button
                       key={option.minutes}
                       type="button"
                       onClick={() => setSelectedTimerMinutes(option.minutes)}
                       className={cn(
                         "min-h-[54px] rounded-[1.25rem] px-1 text-center transition-all",
                         selectedTimerMinutes === option.minutes
                           ? "bg-white text-secondary shadow-lg shadow-secondary/10"
                           : "text-neutral-400 hover:bg-white/60"
                       )}
                     >
                       <span className="block text-sm font-black leading-none">{option.label}</span>
                       <span className="mt-1 block text-[7px] font-black uppercase tracking-widest">
                         {option.minutes === 0 ? "Timer" : "Menit"}
                       </span>
                     </button>
                   ))}
                 </div>
               </div>
             </div>
           </motion.section>
 
           {/* Start Button */}
           <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             transition={{ delay: 0.3 }}
             className="pt-6 space-y-6"
           >
            <Button
              onClick={handleStart}
              isLoading={isLoading}
              disabled={isLoading}
              className="w-full py-5 h-auto text-base rounded-[2rem] shadow-[0_20px_50px_rgba(2,212,143,0.3)] font-black group sm:py-7 sm:text-xl sm:rounded-[2.5rem]"
              hideChildrenWhenLoading
            >
              Mulai Latihan
              <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <AIProcessNotice show={isLoading} />
            <QuotaBadge feature="practice" className="mt-4" />
            <Link
              href="/practice/history"
               className="flex items-center justify-center gap-2 text-primary font-black text-xs uppercase tracking-widest hover:underline"
             >
               <BookOpen size={14} />
               Lihat Riwayat Latihan
             </Link>
           </motion.div>
         </div>
       </div>
 
     </div>
   );
 }
