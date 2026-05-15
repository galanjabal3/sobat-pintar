"use client";
 
 import React from "react";
 import { useRouter } from "next/navigation";
 import { ChevronLeft, Calendar, Sparkles, Clock, ArrowRight, Zap, Target, BookOpen } from "lucide-react";
 import { motion } from "framer-motion";
 import { Button } from "@/components/ui/Button";
 import Image from "next/image";
 
 export default function SchedulePage() {
   const router = useRouter();
 
   return (
     <div className="min-h-screen bg-[#FDFEFF] relative overflow-hidden">
       {/* Premium Background Mesh */}
       <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-primary/5 to-transparent -z-10" />
       <div className="absolute -top-24 -left-24 w-64 h-64 bg-secondary/10 rounded-full blur-[100px] -z-10" />
 
       <div className="px-6 pt-12 pb-36 max-w-2xl mx-auto">
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
           >
             <ChevronLeft size={24} strokeWidth={2.5} />
           </motion.button>
           <div>
             <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-0.5">Atur Waktumu</p>
             <h1 className="text-xl font-black text-neutral-800">Jadwal Belajar</h1>
           </div>
         </motion.header>
 
         {/* Featured AI Generator Card */}
         <motion.div 
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           className="bg-white/70 backdrop-blur-2xl border-4 border-white p-8 rounded-[3rem] mb-10 relative overflow-hidden shadow-2xl shadow-primary/5"
         >
           <div className="relative z-10">
             <div className="flex items-center gap-2 mb-4">
               <Zap size={16} className="text-secondary fill-secondary" />
               <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Sobi Smart Schedule</p>
             </div>
             <h3 className="text-2xl font-black text-neutral-800 leading-tight mb-4">
               Bikin jadwal belajar <br /> otomatis bareng <span className="text-primary">Sobi!</span>
             </h3>
             <p className="text-xs text-neutral-500 font-bold leading-relaxed mb-8 max-w-[220px]">
               Sobi akan atur waktu belajarmu biar makin efisien dan nggak gampang capek.
             </p>
             
             <Button className="py-6 h-auto px-8 rounded-2xl shadow-xl shadow-primary/20 font-black group">
               Buat Jadwal Baru
               <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
             </Button>
           </div>
           
           <div className="absolute -bottom-8 -right-8 w-48 h-48 opacity-10 grayscale pointer-events-none">
             <Image
               src="https://res.cloudinary.com/dzzflhq79/image/upload/v1778706261/image_tyr7o1.png"
               alt="Sobi BG"
               fill
               className="object-contain"
               priority
               sizes="192px"
             />
           </div>
         </motion.div>
 
         {/* Today's Agenda Placeholder */}
         <div className="space-y-6">
           <div className="flex items-center justify-between px-2">
             <h2 className="text-xs font-black text-neutral-400 uppercase tracking-widest flex items-center gap-2">
               <Calendar size={14} /> Agenda Hari Ini
             </h2>
             <span className="text-[10px] font-black text-primary bg-primary/10 px-3 py-1 rounded-full">
               Coming Soon
             </span>
           </div>
 
           <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.2 }}
             className="bg-white border-2 border-primary/5 p-10 rounded-[2.5rem] shadow-xl shadow-primary/5 border-dashed flex flex-col items-center text-center"
           >
             <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-neutral-200 mb-6">
               <Clock size={32} />
             </div>
             <h4 className="font-black text-neutral-800 mb-2">Belum ada jadwal</h4>
             <p className="text-xs text-neutral-400 font-bold max-w-[200px] leading-relaxed">
               Klik tombol di atas untuk mulai mengatur jadwal belajarmu bareng Sobi!
             </p>
           </motion.div>
         </div>
 
         {/* Quick Stats/Tips */}
         <div className="grid grid-cols-2 gap-4 mt-8">
           <motion.div 
             whileHover={{ y: -5 }}
             className="bg-white p-6 rounded-[2.5rem] shadow-xl shadow-primary/5 border-2 border-primary/5"
           >
             <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500 mb-3">
               <Target size={20} strokeWidth={2.5} />
             </div>
             <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Target</p>
             <p className="text-sm font-black text-neutral-800">Konsistensi</p>
           </motion.div>
           
           <motion.div 
             whileHover={{ y: -5 }}
             className="bg-white p-6 rounded-[2.5rem] shadow-xl shadow-primary/5 border-2 border-primary/5"
           >
             <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500 mb-3">
               <BookOpen size={20} strokeWidth={2.5} />
             </div>
             <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Fokus</p>
             <p className="text-sm font-black text-neutral-800">Tanpa Gangguan</p>
           </motion.div>
         </div>
       </div>
 
       {/* Background Decoration */}
       <div className="fixed -bottom-20 -right-20 w-64 h-64 bg-primary/5 rounded-full blur-[80px] pointer-events-none -z-10" />
     </div>
   );
 }
