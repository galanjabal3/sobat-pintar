"use client";
 
 import React, { useState } from "react";
 import { useRouter } from "next/navigation";
 import { ChevronLeft, BookOpen, Calculator, Globe, Beaker, Sparkles, Trophy, ArrowRight } from "lucide-react";
 import { Button } from "@/components/ui/Button";
 import Link from "next/link";
 import { cn } from "@/lib/utils";
 import api from "@/lib/api";
 import { useAuthStore } from "@/store/authStore";
 import { useToastStore } from "@/store/toastStore";
 import { motion } from "framer-motion";
 import Image from "next/image";
 
 const SUBJECTS = [
   { id: "Matematika", icon: <Calculator size={24} />, color: "bg-blue-100 text-blue-600 border-blue-200", desc: "Berhitung jadi seru!" },
   { id: "IPA", icon: <Beaker size={24} />, color: "bg-green-100 text-green-600 border-green-200", desc: "Eksplorasi alam" },
   { id: "Bahasa Indonesia", icon: <BookOpen size={24} />, color: "bg-orange-100 text-orange-600 border-orange-200", desc: "Mahir berbahasa" },
   { id: "Bahasa Inggris", icon: <Globe size={24} />, color: "bg-purple-100 text-purple-600 border-purple-200", desc: "Speak like a pro" },
 ];
 
 const DIFFICULTIES = ["mudah", "sedang", "sulit"];
 
 export default function PracticePage() {
   const router = useRouter();
   const { user } = useAuthStore();
   const { addToast } = useToastStore();
   const [selectedSubject, setSelectedSubject] = useState<string>("Matematika");
   const [selectedDifficulty, setSelectedDifficulty] = useState<string>("sedang");
   const [isLoading, setIsLoading] = useState(false);
 
   const handleStart = async () => {
     setIsLoading(true);
     try {
       const userLevel = user?.level || "SD";
       
       const response = await api.post("/practice/start", {
         subject: selectedSubject,
         difficulty: selectedDifficulty,
         level: userLevel,
       });
       
       const sessionID = response.data.session_id;
       router.push(`/practice/session?id=${sessionID}`);
     } catch (err) {
       console.error("Failed to start session:", err);
       addToast("Gagal memulai latihan. Coba lagi ya!", "error");
       setIsLoading(false);
     }
   };
 
   return (
     <div className="min-h-screen bg-[#FDFEFF] relative overflow-hidden">
       {/* Premium Background Mesh */}
       <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-primary/5 to-transparent -z-10" />
       <div className="absolute -top-24 -left-24 w-64 h-64 bg-primary/10 rounded-full blur-[100px] -z-10" />
 
       <div className="px-6 pt-12 pb-36 max-w-2xl mx-auto">
         <motion.header 
           initial={{ opacity: 0, y: -10 }}
           animate={{ opacity: 1, y: 0 }}
           className="flex items-center gap-4 mb-10"
         >
           <motion.button
             whileHover={{ scale: 1.1 }}
             whileTap={{ scale: 0.9 }}
             onClick={() => router.back()}
             className="w-12 h-12 bg-white rounded-2xl shadow-xl shadow-primary/5 flex items-center justify-center border border-primary/5 text-neutral-800"
           >
             <ChevronLeft size={24} strokeWidth={2.5} />
           </motion.button>
           <div>
             <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-0.5">Asah Kemampuan</p>
             <h1 className="text-xl font-black text-neutral-800">Latihan Soal</h1>
           </div>
         </motion.header>
 
         <div className="space-y-10">
           {/* Subject Selection */}
           <motion.section
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.1 }}
           >
             <div className="flex items-center gap-2 mb-6">
               <BookOpen size={16} className="text-primary" />
               <h2 className="text-xs font-black text-neutral-400 uppercase tracking-widest">Pilih Pelajaran</h2>
             </div>
             
             <div className="grid grid-cols-2 gap-4">
               {SUBJECTS.map((sub, idx) => (
                 <motion.button
                   key={sub.id}
                   whileHover={{ y: -5 }}
                   whileTap={{ scale: 0.95 }}
                   onClick={() => setSelectedSubject(sub.id)}
                   className={cn(
                     "p-6 rounded-[2.5rem] border-4 text-left transition-all relative overflow-hidden group",
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
               className="w-full py-7 h-auto text-xl rounded-[2.5rem] shadow-[0_20px_50px_rgba(2,212,143,0.3)] font-black group"
             >
               Mulai Latihan
               <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
             </Button>
             
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
 
       {/* Floating Mascot Sobi Background */}
       <div className="fixed -bottom-20 -right-20 w-64 h-64 bg-primary/5 rounded-full blur-[80px] pointer-events-none -z-10" />
       <motion.div 
         animate={{ 
           y: [0, -10, 0],
           x: [0, 5, 0]
         }}
         transition={{ 
           duration: 6, 
           repeat: Infinity,
           ease: "easeInOut"
         }}
         className="fixed bottom-32 -left-10 w-40 h-40 pointer-events-none opacity-20 grayscale blur-[2px] -z-10"
       >
         <Image
           src="https://res.cloudinary.com/dzzflhq79/image/upload/v1778706261/image_tyr7o1.png"
           alt="Sobi BG"
           fill
           className="object-contain"
           priority
           sizes="160px"
         />
       </motion.div>
     </div>
   );
 }
