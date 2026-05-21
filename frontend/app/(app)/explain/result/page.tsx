"use client";

import React, { useCallback, useEffect, useState } from "react";
 import { useRouter, useSearchParams } from "next/navigation";
 import { ChevronLeft, RotateCcw, Share2, Sparkles, BookOpen, Lightbulb } from "lucide-react";
 import ReactMarkdown from "react-markdown";
 import remarkGfm from "remark-gfm";
 import { formatAIMarkdown, renderAIMarkdownLink } from "@/lib/aiMarkdown";
 import { Button } from "@/components/ui/Button";
 import api from "@/lib/api";
 import { useToastStore } from "@/store/toastStore";
 import Image from "next/image";
 import { SOBI_ASSETS } from "@/lib/assets";
 import ShareModal from "@/components/ui/ShareModal";
 import { motion, AnimatePresence } from "framer-motion";
 
 interface Explanation {
   id: string;
   question_text: string;
   image_url?: string;
   answer: string;
   level: string;
 }
 
 export default function ExplainResultPage() {
   const router = useRouter();
   const searchParams = useSearchParams();
   const id = searchParams.get("id");
   const { addToast } = useToastStore();
   
   const [explanation, setExplanation] = useState<Explanation | null>(null);
   const [isLoading, setIsLoading] = useState(true);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isReExplaining, setIsReExplaining] = useState(false);

  const fetchExplanation = useCallback(async () => {
    if (!id) {
      router.push("/explain");
      return;
    }

    try {
      const response = await api.get(`/explain/history`);
      const item = response.data.find((e: any) => e.id === id);
      if (item) {
        setExplanation(item);
      } else {
        // Try fetch by ID if not found in recent history
        try {
          const resById = await api.get(`/explain/${id}`);
          if (resById.data) setExplanation(resById.data);
          else router.push("/explain");
        } catch {
          router.push("/explain");
        }
      }
    } catch (err) {
      console.error(err);
      addToast("Gagal memuat hasil Jelasin AI.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [addToast, id, router]);

  useEffect(() => {
    fetchExplanation();
  }, [fetchExplanation]);
 
   const handleReExplain = async () => {
     if (!explanation?.id || isReExplaining) return;

     setIsReExplaining(true);
     try {
       const response = await api.post(`/explain/${explanation.id}/re-explain`);
       addToast("Sobi sudah menjelaskan dengan cara baru!", "success");
       router.push(`/explain/result?id=${response.data.id}`);
     } catch (err) {
       console.error(err);
       addToast("Gagal meminta penjelasan ulang. Coba lagi ya!", "error");
     } finally {
       setIsReExplaining(false);
     }
   };
 
   if (isLoading) {
     return (
       <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-[#FDFEFF]">
         <motion.div 
           animate={{ 
             scale: [1, 1.2, 1],
             rotate: [0, 360],
           }}
           transition={{ 
             duration: 2, 
             repeat: Infinity,
             ease: "easeInOut"
           }}
           className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center mb-8"
         >
           <Sparkles size={32} className="text-primary" />
         </motion.div>
         <motion.p 
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           className="text-neutral-800 font-black text-lg"
         >
           Sobi sedang meramu jawaban...
         </motion.p>
         <p className="text-neutral-400 text-sm mt-2 font-medium">Bentar ya, biar penjelasannya mantap!</p>
       </div>
     );
   }
 
   return (
     <div className="min-h-screen bg-[#FDFEFF] relative overflow-hidden">
       {/* Premium Background Mesh */}
       <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-primary/5 to-transparent -z-10" />
       <div className="absolute -top-24 -left-24 w-64 h-64 bg-primary/10 rounded-full blur-[100px] -z-10" />
 
       <div className="px-6 pt-12 pb-20 max-w-2xl mx-auto">
         <motion.header 
           initial={{ opacity: 0, y: -10 }}
           animate={{ opacity: 1, y: 0 }}
           className="flex justify-between items-center mb-10"
         >
           <motion.button
             whileHover={{ scale: 1.1 }}
             whileTap={{ scale: 0.9 }}
             onClick={() => router.back()}
             className="w-12 h-12 bg-white rounded-2xl shadow-xl shadow-primary/5 flex items-center justify-center border border-primary/5 text-neutral-800"
           >
             <ChevronLeft size={24} strokeWidth={2.5} />
           </motion.button>
           <h1 className="text-xl font-black text-neutral-800 leading-tight">Penjelasan Sobi</h1>
           <motion.button 
             whileHover={{ scale: 1.1 }}
             whileTap={{ scale: 0.9 }}
             onClick={() => setIsShareModalOpen(true)} 
             className="w-12 h-12 bg-white rounded-2xl shadow-xl shadow-primary/5 flex items-center justify-center border border-primary/5 text-neutral-800"
           >
             <Share2 size={20} strokeWidth={2.5} />
           </motion.button>
         </motion.header>
 
         <ShareModal 
           isOpen={isShareModalOpen} 
           onClose={() => setIsShareModalOpen(false)} 
           url={`${typeof window !== 'undefined' ? window.location.origin : ''}/share/${id}`} 
         />
 
         <div className="space-y-8">
           {/* User Question Card */}
           <motion.div 
             initial={{ opacity: 0, scale: 0.95 }}
             animate={{ opacity: 1, scale: 1 }}
             className="bg-white/50 backdrop-blur-xl p-6 rounded-[2.5rem] border-2 border-white shadow-2xl shadow-primary/5"
           >
             <div className="flex items-center gap-3 mb-4">
               <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                 <BookOpen size={16} strokeWidth={2.5} />
               </div>
               <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Pertanyaanmu</p>
             </div>
             
             {explanation?.image_url && (
               <motion.div 
                 whileHover={{ scale: 1.02 }}
                 className="relative w-full aspect-video mb-5 rounded-3xl overflow-hidden border-4 border-white shadow-xl"
               >
                 <Image 
                   src={explanation.image_url} 
                   alt="Pertanyaan gambar" 
                   fill 
                   sizes="(max-width: 768px) 100vw, 672px"
                   className="object-cover"
                   unoptimized
                 />
               </motion.div>
             )}
             <p className="text-neutral-700 text-sm font-bold leading-relaxed px-1">
               {explanation?.question_text || "Soal Gambar"}
             </p>
           </motion.div>
 
           {/* AI Answer Card */}
           <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.2 }}
             className="bg-white border-2 border-primary/10 rounded-[3rem] p-8 relative shadow-[0_20px_50px_rgba(2,212,143,0.1)]"
           >
             {/* Mascot Header */}
             <div className="absolute -top-10 left-8 flex items-center gap-3">
               <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center shadow-2xl shadow-primary/20 border-2 border-primary/10 overflow-hidden p-2">
                 <div className="w-full h-full relative">
                    <Image src={SOBI_ASSETS.DEFAULT} alt="Sobi" fill unoptimized priority sizes="80px" className="object-contain" />
                 </div>
               </div>
               <div className="bg-primary text-white text-[10px] font-black px-4 py-2 rounded-full shadow-lg shadow-primary/30 uppercase tracking-widest mt-6">
                 Sobi Menjawab!
               </div>
             </div>
 
             <div className="pt-12">
               <div className="flex items-center gap-2 mb-6">
                 <Lightbulb size={20} className="text-secondary" />
                 <p className="text-xs font-black text-neutral-400 uppercase tracking-widest">Penjelasan Langkah Demi Langkah</p>
               </div>
               
               <div className="prose prose-sm max-w-none text-neutral-800">
                 <ReactMarkdown
                   remarkPlugins={[remarkGfm]}
                   components={{
                     h1: ({children}) => <h1 className="text-xl font-black text-neutral-800 mt-8 mb-4">{children}</h1>,
                     h2: ({children}) => <h2 className="text-lg font-black text-neutral-800 mt-6 mb-3">{children}</h2>,
                     h3: ({children}) => <h3 className="text-md font-black text-neutral-800 mt-4 mb-2">{children}</h3>,
                     p: ({children}) => <p className="text-neutral-600 mb-4 leading-[1.8] font-medium text-[15px]">{children}</p>,
                     strong: ({children}) => <strong className="font-black text-primary">{children}</strong>,
                     em: ({children}) => <em className="italic font-bold text-neutral-800">{children}</em>,
                     del: ({children}) => <del className="text-neutral-500 decoration-2">{children}</del>,
                     a: ({href, children}) => renderAIMarkdownLink(href, children),
                     ul: ({children}) => <ul className="mb-6 list-disc space-y-3 pl-5 marker:text-primary">{children}</ul>,
                     ol: ({children}) => <ol className="mb-6 list-decimal space-y-3 pl-5 marker:font-black marker:text-primary">{children}</ol>,
                     li: ({children}) => (
                       <li className="pl-2 text-neutral-600 font-medium text-[15px] leading-relaxed [&>p]:m-0 [&>ol]:mt-3 [&>ul]:mt-3">
                         {children}
                       </li>
                     ),
                     code: ({children}) => <code className="bg-primary/5 text-primary px-2 py-1 rounded-lg text-sm font-black font-mono border border-primary/10">{children}</code>,
                     blockquote: ({children}) => <div className="border-l-4 border-secondary bg-secondary/5 p-4 rounded-r-2xl italic text-neutral-600 mb-6">{children}</div>,
                   }}
                 >
                   {formatAIMarkdown(explanation?.answer || "")}
                 </ReactMarkdown>
               </div>
             </div>
           </motion.div>
 
           {/* Action Buttons Upgrade */}
           <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             transition={{ delay: 0.4 }}
             className="grid grid-cols-1 gap-4 pt-4"
           >
             <Button 
               onClick={handleReExplain}
               isLoading={isReExplaining}
               disabled={isReExplaining}
               variant="outline" 
               className="w-full py-6 h-auto text-sm rounded-[2rem] border-2 border-gray-100 font-black text-neutral-500 hover:bg-gray-50 hover:text-primary hover:border-primary/20 transition-all shadow-xl shadow-black/5"
             >
               <RotateCcw size={18} className="mr-3" />
               Masih Bingung? Jelaskan Cara Lain
             </Button>
             <Button
               onClick={() => router.push("/explain")}
               className="w-full py-6 h-auto text-lg rounded-[2rem] shadow-2xl shadow-primary/30 font-black"
             >
               Tanya Soal Lain
             </Button>
           </motion.div>
         </div>
       </div>
 
       {/* Floating Mascot Background Decor */}
       <div className="fixed -bottom-20 -left-20 w-64 h-64 bg-primary/5 rounded-full blur-[80px] pointer-events-none -z-10" />
     </div>
   );
 }
