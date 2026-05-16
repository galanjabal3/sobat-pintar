"use client";
 
 import React, { useEffect, useState } from "react";
 import { useRouter, useSearchParams } from "next/navigation";
 import { Trophy, ArrowRight, Star, Sparkles, Home, RotateCcw, CheckCircle2, XCircle } from "lucide-react";
 import { Button } from "@/components/ui/Button";
 import api from "@/lib/api";
 import { useToastStore } from "@/store/toastStore";
 import Image from "next/image";
 import { motion } from "framer-motion";
 import { SOBI_ASSETS } from "@/lib/assets";
 
 interface PracticeResult {
   session_id: string;
   subject: string;
   difficulty: string;
   score: number;
   total_questions: number;
   correct_answers: number;
 }
 
 export default function PracticeResultPage() {
   const router = useRouter();
   const searchParams = useSearchParams();
   const id = searchParams.get("id");
   const { addToast } = useToastStore();
   
   const [result, setResult] = useState<PracticeResult | null>(null);
   const [isLoading, setIsLoading] = useState(true);
 
   useEffect(() => {
     if (!id) {
       router.push("/practice");
       return;
     }
 
     const fetchResult = async () => {
       try {
         const response = await api.get(`/practice/sessions/${id}/result`);
         setResult(response.data);
       } catch (err) {
         console.error(err);
         addToast("Gagal memuat hasil latihan.", "error");
       } finally {
         setIsLoading(false);
       }
     };
 
     fetchResult();
   }, [id, router]);
 
   if (isLoading) {
     return (
       <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-[#FDFEFF]">
         <motion.div 
           animate={{ scale: [1, 1.1, 1], rotate: [0, 360] }}
           transition={{ duration: 2, repeat: Infinity }}
           className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center mb-8"
         >
           <Sparkles size={32} className="text-primary" />
         </motion.div>
         <p className="text-neutral-800 font-black text-lg">Menghitung skormu...</p>
       </div>
     );
   }
 
   const getMessage = (score: number) => {
     if (score >= 90) return "Sempurna! Kamu luar biasa!";
     if (score >= 70) return "Bagus sekali! Pertahankan prestasimu.";
     if (score >= 50) return "Lumayan! Yuk belajar lagi biar makin jago.";
     return "Jangan menyerah! Latihan terus pasti bisa.";
   };
 
   const score = result?.score || 0;
   const correct = result?.correct_answers || 0;
   const total = result?.total_questions || 0;
   const wrong = total - correct;
 
   return (
     <div className="min-h-screen bg-[#FDFEFF] flex flex-col items-center px-6 pt-20 pb-36 relative overflow-hidden">
       {/* Premium Background Mesh */}
       <div className="absolute top-0 left-0 w-full h-[400px] bg-gradient-to-b from-primary/10 to-transparent -z-10" />
       
       {/* Animated Decorative Stars */}
       {[...Array(5)].map((_, i) => (
         <motion.div
           key={i}
           initial={{ opacity: 0, scale: 0 }}
           animate={{ 
             opacity: [0.2, 0.5, 0.2], 
             scale: [1, 1.2, 1],
             y: [0, -20, 0] 
           }}
           transition={{ 
             duration: 3 + i, 
             repeat: Infinity,
             delay: i * 0.5 
           }}
           className="absolute pointer-events-none"
           style={{
             top: `${10 + i * 15}%`,
             left: `${(i % 2 === 0 ? 10 : 85)}%`,
             color: i % 2 === 0 ? '#FACC15' : '#02D48F'
           }}
         >
           <Star size={24 + i * 4} fill="currentColor" strokeWidth={0} />
         </motion.div>
       ))}
 
       <motion.div 
         initial={{ opacity: 0, scale: 0.5, y: 50 }}
         animate={{ opacity: 1, scale: 1, y: 0 }}
         transition={{ type: "spring", stiffness: 200, damping: 20 }}
         className="mb-6 relative w-64 h-64 sm:w-72 sm:h-72"
       >
         <Image 
           src={SOBI_ASSETS.TROPHY} 
           alt="Sobi Celebration" 
           fill 
           unoptimized 
           priority 
           className="object-contain drop-shadow-2xl" 
           sizes="(max-width: 640px) 256px, 288px"
         />
         <motion.div 
           animate={{ rotate: 360 }}
           transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
           className="absolute -top-4 -right-4 text-secondary"
         >
           <Sparkles size={40} />
         </motion.div>
       </motion.div>
 
       <motion.div
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ delay: 0.2 }}
         className="text-center mb-12"
       >
         <h1 className="text-3xl font-black text-neutral-800 mb-3 leading-tight">
           {getMessage(score)}
         </h1>
         <p className="text-sm text-neutral-500 font-bold uppercase tracking-widest bg-white/50 backdrop-blur-md px-6 py-2 rounded-full border border-white inline-block shadow-sm">
           {result?.subject} • {result?.difficulty}
         </p>
       </motion.div>
 
       {/* Premium Score Card */}
       <motion.div 
         initial={{ opacity: 0, scale: 0.9 }}
         animate={{ opacity: 1, scale: 1 }}
         transition={{ delay: 0.3 }}
         className="w-full bg-white/70 backdrop-blur-2xl rounded-[3.5rem] p-10 border-4 border-white shadow-[0_30px_70px_rgba(0,0,0,0.08)] mb-12 relative"
       >
         <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-20 h-20 bg-secondary rounded-[1.8rem] shadow-2xl shadow-secondary/40 flex items-center justify-center text-white border-4 border-white">
           <Trophy size={40} strokeWidth={2.5} />
         </div>
         
         <div className="flex flex-col items-center pt-8">
           <p className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.3em] mb-4">Skor Akhir Kamu</p>
           <div className="relative mb-10">
             <motion.div 
               initial={{ scale: 0 }}
               animate={{ scale: 1 }}
               transition={{ delay: 0.5, type: "spring" }}
               className="text-8xl font-black text-primary"
             >
               {score}
             </motion.div>
             <div className="absolute -top-2 -right-6">
               <Sparkles size={24} className="text-secondary animate-pulse" />
             </div>
           </div>
           
           <div className="flex w-full gap-4 pt-8 border-t-2 border-gray-50">
             <div className="flex-1 bg-green-50/50 p-4 rounded-3xl border-2 border-green-50 flex flex-col items-center">
               <div className="w-8 h-8 bg-green-100 rounded-xl flex items-center justify-center text-green-600 mb-2">
                 <CheckCircle2 size={18} />
               </div>
               <p className="text-xl font-black text-green-600">{correct}</p>
               <p className="text-[10px] font-black text-green-600/50 uppercase tracking-widest">Benar</p>
             </div>
             <div className="flex-1 bg-red-50/50 p-4 rounded-3xl border-2 border-red-50 flex flex-col items-center">
               <div className="w-8 h-8 bg-red-100 rounded-xl flex items-center justify-center text-red-600 mb-2">
                 <XCircle size={18} />
               </div>
               <p className="text-xl font-black text-red-600">{wrong}</p>
               <p className="text-[10px] font-black text-red-600/50 uppercase tracking-widest">Salah</p>
             </div>
           </div>
         </div>
       </motion.div>
 
       {/* Action Buttons Upgrade */}
       <motion.div 
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ delay: 0.6 }}
         className="w-full space-y-4"
       >
         <Button
           onClick={() => router.push("/practice")}
           className="w-full py-7 h-auto text-xl rounded-[2.5rem] shadow-[0_20px_50px_rgba(2,212,143,0.3)] font-black group"
         >
           Latihan Lagi
           <RotateCcw size={20} className="ml-2 group-hover:rotate-180 transition-transform duration-500" />
         </Button>
         <Button
           onClick={() => router.push("/dashboard")}
           variant="outline"
           className="w-full py-7 h-auto text-xl rounded-[2.5rem] border-4 border-white bg-white/50 backdrop-blur-md shadow-xl shadow-black/5 font-black text-neutral-600 hover:bg-white transition-all group"
         >
           <Home size={20} className="mr-2 group-hover:scale-110 transition-transform" />
           Kembali ke Beranda
         </Button>
       </motion.div>
     </div>
   );
 }
