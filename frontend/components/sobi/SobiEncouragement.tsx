"use client";
 
 import React from "react";
 import Image from "next/image";
 import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Sparkles, Heart } from "lucide-react";
import { SOBI_ASSETS } from "@/lib/assets";
import { AIMarkdown } from "@/components/ai/AIMarkdown";
 
 interface SobiEncouragementProps {
   message?: string;
   isCorrect?: boolean;
 }
 
 export default function SobiEncouragement({ 
   message = "Ayo, kamu pasti bisa! Kalikan dulu angka puluhan baru satuannya, ya!",
   isCorrect = true
 }: SobiEncouragementProps) {
   return (
     <motion.div 
       initial={{ opacity: 0, scale: 0.9, y: 20 }}
       animate={{ opacity: 1, scale: 1, y: 0 }}
       className={cn(
         "flex items-center gap-5 p-6 rounded-[3rem] border-4 border-white shadow-2xl relative overflow-hidden",
         isCorrect ? "bg-[#E6F9F3] shadow-green-500/10" : "bg-[#FFF1F2] shadow-red-500/10"
       )}
     >
       {/* Background Decoration */}
       <div className="absolute -top-4 -right-4 opacity-10">
         {isCorrect ? <Sparkles size={60} className="text-green-500" /> : <Heart size={60} className="text-red-500" />}
       </div>
 
       <motion.div 
         animate={{ y: [0, -5, 0] }}
         transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
         className="w-20 h-20 relative shrink-0 z-10"
       >
         <Image
           src={isCorrect ? SOBI_ASSETS.WAVING : SOBI_ASSETS.SAD}
           alt="Sobi Mascot"
           fill
           unoptimized
           className="object-contain drop-shadow-lg"
         />
       </motion.div>
 
       <div className="relative z-10 flex-1">
         <div className="flex items-center gap-2 mb-1">
           <p className={cn("text-[10px] font-black uppercase tracking-widest", isCorrect ? "text-green-600" : "text-red-600")}>
             {isCorrect ? "Yeay, Betul Banget!" : "Yah, Belum Tepat..."}
           </p>
         </div>
         <div className={cn("text-xs font-black leading-relaxed", isCorrect ? "text-neutral-800" : "text-neutral-800")}>
           <AIMarkdown>{message}</AIMarkdown>
         </div>
       </div>
     </motion.div>
   );
 }
