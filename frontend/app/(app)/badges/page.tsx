"use client";
 
 import React, { useEffect, useState } from "react";
 import { useRouter } from "next/navigation";
 import { ChevronLeft, Award, Lock, Sparkles, Star, Zap, Book, Shield } from "lucide-react";
 import { motion, AnimatePresence } from "framer-motion";
 import api from "@/lib/api";
 import { cn } from "@/lib/utils";
 import Image from "next/image";
 
 interface Badge {
   id: string;
   name: string;
   description: string;
   image_url: string;
   is_owned: boolean;
 }
 
 export default function BadgesPage() {
   const router = useRouter();
   const [badges, setBadges] = useState<Badge[]>([]);
   const [isLoading, setIsLoading] = useState(true);
 
   useEffect(() => {
     const fetchBadges = async () => {
       try {
         const response = await api.get("/gamification/badges");
         setBadges(response.data || []);
       } catch (err) {
         console.error(err);
       } finally {
         setIsLoading(false);
       }
     };
     fetchBadges();
   }, []);
 
   const ownedCount = badges.filter(b => b.is_owned).length;
   const progress = (ownedCount / (badges.length || 1)) * 100;
 
   return (
     <div className="min-h-screen bg-[#FDFEFF] relative overflow-hidden">
       {/* Premium Background Mesh */}
       <div className="absolute top-0 left-0 w-full h-[400px] bg-gradient-to-b from-primary/10 to-transparent -z-10" />
       
       <div className="px-6 pt-12 pb-20 max-w-2xl mx-auto">
         <motion.header 
           initial={{ opacity: 0, y: -10 }}
           animate={{ opacity: 1, y: 0 }}
           className="flex items-center justify-between mb-10"
         >
           <div className="flex items-center gap-4">
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
               <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-0.5">Koleksi Medali</p>
               <h1 className="text-xl font-black text-neutral-800">Pencapaian</h1>
             </div>
           </div>
 
           <div className="flex flex-col items-end">
             <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">{ownedCount}/{badges.length} Terkumpul</span>
             <div className="w-24 bg-gray-100 rounded-full h-1.5 overflow-hidden">
               <motion.div 
                 initial={{ width: 0 }}
                 animate={{ width: `${progress}%` }}
                 className="bg-primary h-full rounded-full shadow-[0_0_10px_rgba(2,212,143,0.5)]"
               />
             </div>
           </div>
         </motion.header>
 
         {/* Stats Summary Card */}
         <motion.div 
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           className="bg-white/70 backdrop-blur-2xl border-4 border-white p-8 rounded-[3rem] mb-12 shadow-2xl shadow-primary/5 relative overflow-hidden"
         >
           <div className="relative z-10 flex items-center gap-6">
             <div className="w-20 h-20 bg-secondary rounded-[1.8rem] flex items-center justify-center text-white shadow-2xl shadow-secondary/30 rotate-3">
               <Award size={40} strokeWidth={2.5} />
             </div>
             <div>
               <h3 className="text-lg font-black text-neutral-800 leading-tight">
                 Kamu makin hebat, <br/><span className="text-primary">Terus Koleksi!</span>
               </h3>
               <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
                 <Sparkles size={12} className="text-secondary" /> Butuh {badges.length - ownedCount} lagi untuk Level Up
               </p>
             </div>
           </div>
           
           <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/5 rounded-full blur-[50px] -z-10" />
         </motion.div>
 
         {/* Badge Grid Section */}
         <div className="space-y-6">
           <h2 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest px-2">Daftar Lencana</h2>
           
           <div className="grid grid-cols-2 gap-4">
             <AnimatePresence>
               {isLoading ? (
                 [...Array(6)].map((_, i) => (
                   <div key={i} className="aspect-square bg-gray-50 rounded-[2.5rem] animate-pulse" />
                 ))
               ) : badges.length > 0 ? (
                 badges.map((badge, idx) => (
                   <motion.div
                     key={badge.id}
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ delay: idx * 0.05 }}
                     whileHover={{ y: -5 }}
                     className={cn(
                       "bg-white border-2 p-6 rounded-[2.5rem] shadow-xl shadow-black/5 flex flex-col items-center text-center transition-all relative overflow-hidden",
                       badge.is_owned 
                        ? "border-white" 
                        : "border-dashed border-gray-100 opacity-60 grayscale"
                     )}
                   >
                     {/* Badge Icon Visual */}
                     <div className={cn(
                       "w-16 h-16 rounded-3xl flex items-center justify-center mb-4 transition-all duration-500",
                       badge.is_owned 
                        ? "bg-primary/10 text-primary shadow-inner" 
                        : "bg-gray-50 text-neutral-300"
                     )}>
                        {badge.name.includes("Belajar") ? <Book size={32} /> : 
                         badge.name.includes("Kilat") ? <Zap size={32} /> :
                         badge.name.includes("Hebat") ? <Star size={32} /> :
                         <Shield size={32} />}
                     </div>
 
                     <h4 className={cn(
                       "text-xs font-black mb-1",
                       badge.is_owned ? "text-neutral-800" : "text-neutral-400"
                     )}>
                       {badge.name}
                     </h4>
                     <p className="text-[9px] font-bold text-neutral-400 leading-tight">
                       {badge.description}
                     </p>
 
                     {!badge.is_owned && (
                       <div className="absolute top-4 right-4 text-neutral-300">
                         <Lock size={12} strokeWidth={3} />
                       </div>
                     )}
                     
                     {badge.is_owned && (
                       <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-primary/5 rounded-full blur-xl" />
                     )}
                   </motion.div>
                 ))
               ) : (
                 <div className="col-span-2 text-center py-20 bg-white/50 backdrop-blur-md rounded-[3rem] border-2 border-dashed border-gray-100">
                    <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest">Belum ada lencana tersedia</p>
                 </div>
               )}
             </AnimatePresence>
           </div>
         </div>
       </div>
 
       {/* Background Decoration */}
       <div className="fixed -bottom-20 -right-20 w-80 h-80 bg-primary/5 rounded-full blur-[100px] pointer-events-none -z-10" />
     </div>
   );
 }
