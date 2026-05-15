"use client";
 
 import React, { useEffect, useState } from "react";
 import { useRouter, useParams } from "next/navigation";
 import { ChevronLeft, FileText, Sparkles, Copy, Share2, Download, Trash2, Clock, ArrowRight } from "lucide-react";
 import api from "@/lib/api";
 import { motion } from "framer-motion";
 import { useToastStore } from "@/store/toastStore";
 import Image from "next/image";
 import { format } from "date-fns";
 import { id as idLocale } from "date-fns/locale";
 
 interface SummaryDetail {
   id: string;
   source_type: string;
   summary: string;
   created_at: string;
 }
 
 export default function SummaryResultPage() {
   const router = useRouter();
   const params = useParams();
   const id = params.id as string;
   const { addToast } = useToastStore();
   
   const [detail, setDetail] = useState<SummaryDetail | null>(null);
   const [isLoading, setIsLoading] = useState(true);
 
   useEffect(() => {
     fetchDetail();
   }, [id]);
 
   const fetchDetail = async () => {
     try {
       const response = await api.get(`/summary/${id}`);
       setDetail(response.data);
     } catch (err) {
       console.error(err);
       addToast("Gagal mengambil detail rangkuman.", "error");
       router.push("/summary");
     } finally {
       setIsLoading(false);
     }
   };
 
   const handleCopy = () => {
     if (!detail) return;
     navigator.clipboard.writeText(detail.summary);
     addToast("Rangkuman disalin ke clipboard!", "success");
   };
 
   if (isLoading) {
     return (
       <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-[#FDFEFF]">
         <motion.div 
           animate={{ scale: [1, 1.1, 1], rotate: [0, 360] }}
           transition={{ duration: 2, repeat: Infinity }}
           className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center mb-8"
         >
           <FileText size={32} className="text-primary" />
         </motion.div>
         <p className="text-neutral-800 font-black text-lg">Membuka rangkuman...</p>
       </div>
     );
   }
 
   return (
     <div className="min-h-screen bg-[#FDFEFF] relative overflow-hidden flex flex-col">
       {/* Premium Background Mesh */}
       <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-primary/5 to-transparent -z-10" />
       
       <header className="bg-white/70 backdrop-blur-xl px-6 pt-12 pb-4 border-b-4 border-white sticky top-0 z-20 shadow-xl shadow-primary/5 flex items-center justify-between">
         <div className="flex items-center gap-4">
           <motion.button
             whileHover={{ scale: 1.1 }}
             whileTap={{ scale: 0.9 }}
             onClick={() => router.push("/summary")}
             className="w-10 h-10 bg-white rounded-xl shadow-lg shadow-black/5 flex items-center justify-center border border-gray-100 text-neutral-800"
           >
             <ChevronLeft size={20} strokeWidth={3} />
           </motion.button>
           <div>
             <h1 className="text-sm font-black text-neutral-800 uppercase tracking-widest">Hasil Rangkuman</h1>
             <p className="text-[10px] font-black text-primary uppercase tracking-widest">
               {detail?.source_type === "text" ? "Dari Teks" : "Dari File"}
             </p>
           </div>
         </div>
         
         <div className="flex gap-2">
           <button onClick={handleCopy} className="w-10 h-10 bg-white rounded-xl shadow-lg shadow-black/5 flex items-center justify-center border border-gray-100 text-neutral-400 hover:text-primary transition-colors">
             <Copy size={18} />
           </button>
           <button className="w-10 h-10 bg-white rounded-xl shadow-lg shadow-black/5 flex items-center justify-center border border-gray-100 text-neutral-400 hover:text-primary transition-colors">
             <Share2 size={18} />
           </button>
         </div>
       </header>
 
       <main className="flex-1 px-6 py-10 max-w-2xl mx-auto w-full pb-32">
         <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           className="space-y-8"
         >
           <div className="flex items-center justify-between px-2">
             <div className="flex items-center gap-2">
               <Clock size={14} className="text-neutral-400" />
               <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                 {detail && format(new Date(detail.created_at), "d MMMM yyyy • HH:mm", { locale: idLocale })}
               </span>
             </div>
             <div className="flex items-center gap-1.5">
               <Sparkles size={14} className="text-secondary" />
               <span className="text-[10px] font-black text-secondary uppercase tracking-widest">AI Summarized</span>
             </div>
           </div>
 
           <div className="bg-white p-8 rounded-[3rem] border-4 border-white shadow-[0_20px_50px_rgba(0,0,0,0.05)] relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -z-10" />
             
             {/* Summary Content with better typography */}
             <div className="prose prose-neutral max-w-none">
               <div className="text-neutral-800 text-sm font-medium leading-[1.8] whitespace-pre-wrap">
                 {detail?.summary}
               </div>
             </div>
           </div>
 
           {/* Feedback / Sobi Tip */}
           <motion.div 
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             transition={{ delay: 0.2 }}
             className="bg-primary/5 border-2 border-primary/10 p-6 rounded-[2.5rem] flex items-start gap-5"
           >
             <div className="w-12 h-12 relative shrink-0">
               <Image
                 src="https://res.cloudinary.com/dzzflhq79/image/upload/v1778706261/image_tyr7o1.png"
                 alt="Sobi Mascot"
                 fill
                 className="object-contain"
                 priority
                 sizes="48px"
               />
             </div>
             <div>
               <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Tips Sobi</p>
               <p className="text-xs font-bold text-neutral-800 leading-relaxed">
                 Rangkuman ini sudah diringkas biar kamu cepat paham. Jangan lupa baca poin-poin pentingnya ya!
               </p>
             </div>
           </motion.div>
 
           <div className="grid grid-cols-2 gap-4 pt-4">
             <button className="flex items-center justify-center gap-3 py-5 bg-white border-4 border-white shadow-xl shadow-black/5 rounded-[2rem] font-black text-xs text-neutral-600 uppercase tracking-widest hover:shadow-2xl transition-all">
               <Download size={18} /> Simpan PDF
             </button>
             <button onClick={() => router.push("/practice")} className="flex items-center justify-center gap-3 py-5 bg-primary text-white shadow-xl shadow-primary/20 rounded-[2rem] font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all">
               Latihan Soal <ArrowRight size={18} />
             </button>
           </div>
         </motion.div>
       </main>
 
       {/* Background Decoration */}
       <div className="fixed -bottom-20 -right-20 w-80 h-80 bg-primary/5 rounded-full blur-[100px] pointer-events-none -z-10" />
     </div>
   );
 }
