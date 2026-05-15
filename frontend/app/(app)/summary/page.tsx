"use client";
 
 import React, { useEffect, useState } from "react";
 import { useRouter } from "next/navigation";
 import { ChevronLeft, FileText, Sparkles, Send, Clock, Trash2, ArrowRight, BookOpen, FileUp, Flame } from "lucide-react";
 import api from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { useToastStore } from "@/store/toastStore";
import { useAuthStore } from "@/store/authStore";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Modal } from "@/components/ui/Modal";

interface SummaryHistory {
  id: string;
  title: string;
  content: string;
  result: string;
  created_at: string;
}

export default function SummaryPage() {
  const router = useRouter();
  const { addToast } = useToastStore();
  const { user, fetchProfile } = useAuthStore();
  const [history, setHistory] = useState<SummaryHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [text, setText] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await api.get("/summary/history");
      setHistory(response.data || []);
    } catch (err) {
      console.error(err);
      addToast("Gagal mengambil riwayat rangkuman.", "error");
    } finally {
      setIsLoading(false);
    }
  };
 
   const handleSummarize = async () => {
     if (!text.trim()) {
       addToast("Masukkan teks yang ingin dirangkum ya!", "error");
       return;
     }
 
     setIsSubmitting(true);
     try {
       const response = await api.post("/summary", {
         content: text,
         title: text.slice(0, 30) + (text.length > 30 ? "..." : "")
       });
       addToast("Rangkuman berhasil dibuat!", "success");
       setText("");
       fetchHistory();
       // Redirect to result if needed, or just refresh list
     } catch (err) {
       console.error(err);
       addToast("Gagal membuat rangkuman.", "error");
     } finally {
       setIsSubmitting(false);
     }
   };
 
   const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    
    try {
      await api.delete(`/summary/${deleteId}`);
      setHistory(history.filter(h => h.id !== deleteId));
      addToast("Rangkuman berhasil dihapus.", "success");
    } catch (err) {
      console.error(err);
      addToast("Gagal menghapus rangkuman.", "error");
    } finally {
      setDeleteId(null);
    }
  };
 
   return (
     <div className="min-h-screen bg-[#FDFEFF] relative overflow-hidden">
       {/* Premium Background Mesh */}
       <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-primary/5 to-transparent -z-10" />
       <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 rounded-full blur-[100px] -z-10" />
 
       <div className="px-6 pt-12 pb-36 max-w-2xl mx-auto">
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
             >
               <ChevronLeft size={24} strokeWidth={2.5} />
             </motion.button>
             <div>
               <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-0.5">Belajar Efektif</p>
               <h1 className="text-xl font-black text-neutral-800">Rangkum Materi</h1>
             </div>
           </div>

           <div className="flex items-center gap-2">
             <div className="bg-white border-2 border-primary/5 p-1.5 px-3 rounded-xl flex items-center gap-1.5 shadow-xl shadow-primary/5">
               <Flame size={14} className="text-secondary fill-secondary" />
               <span className="text-[11px] font-black text-neutral-800">{user?.streak || 0}</span>
             </div>
             <div className="bg-white border-2 border-primary/5 p-1.5 px-3 rounded-xl flex items-center gap-1.5 shadow-xl shadow-primary/5">
               <Sparkles size={14} className="text-primary fill-primary" />
               <span className="text-[11px] font-black text-neutral-800">{user?.points || 0}</span>
             </div>
           </div>
         </motion.header>
 
         {/* Input Section */}
         <motion.div 
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ delay: 0.1 }}
           className="bg-white/70 backdrop-blur-2xl border-4 border-white p-8 rounded-[3rem] mb-12 relative overflow-hidden shadow-2xl shadow-primary/5"
         >
           <div className="relative z-10">
             <div className="flex items-center gap-2 mb-4">
               <Sparkles size={16} className="text-secondary" />
               <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Sobi Rangkum</p>
             </div>
             <h3 className="text-2xl font-black text-neutral-800 leading-tight mb-6">
               Tempel materi panjangmu, <br /> biar <span className="text-primary">Sobi ringkas!</span>
             </h3>
             
             <div className="relative">
               <textarea
                 value={text}
                 onChange={(e) => setText(e.target.value)}
                 placeholder="Tempel teks atau materi di sini..."
                 className="w-full h-40 bg-white/50 border-2 border-primary/5 rounded-3xl p-5 text-sm font-medium focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all resize-none placeholder:text-neutral-300"
               />
               <div className="absolute bottom-4 right-4 flex gap-2">
                 <button className="p-3 bg-gray-50 text-neutral-400 rounded-2xl hover:bg-primary/10 hover:text-primary transition-all">
                   <FileUp size={20} />
                 </button>
               </div>
             </div>
 
             <Button
               onClick={handleSummarize}
               isLoading={isSubmitting}
               className="w-full mt-6 py-6 h-auto text-lg rounded-[2rem] shadow-2xl shadow-primary/20 font-black group"
             >
               Buat Rangkuman
               <Send size={18} className="ml-2 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
             </Button>
           </div>
         </motion.div>
 
         {/* History Section */}
         <div className="space-y-6">
           <div className="flex items-center justify-between px-2">
             <h2 className="text-xs font-black text-neutral-400 uppercase tracking-widest flex items-center gap-2">
               <Clock size={14} /> Riwayat Rangkuman
             </h2>
             <span className="text-[10px] font-black text-primary bg-primary/10 px-3 py-1 rounded-full">
               {history.length} File
             </span>
           </div>
 
           <AnimatePresence mode="popLayout">
             {isLoading ? (
               <div className="space-y-4">
                 {[1, 2].map(i => (
                   <div key={i} className="h-28 bg-gray-100 rounded-[2.5rem] animate-pulse" />
                 ))}
               </div>
             ) : history.length > 0 ? (
               history.map((item, idx) => (
                 <motion.div
                   key={item.id}
                   initial={{ opacity: 0, x: -20 }}
                   animate={{ opacity: 1, x: 0 }}
                   transition={{ delay: idx * 0.05 }}
                   exit={{ opacity: 0, scale: 0.9 }}
                   layout
                   className="bg-white border-2 border-primary/5 p-6 rounded-[2.5rem] shadow-xl shadow-primary/5 hover:border-primary/20 transition-all group relative"
                 >
                   <div className="flex items-start gap-5">
                     <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500 shrink-0">
                       <FileText size={24} strokeWidth={2.5} />
                     </div>
                     <div className="flex-1 min-w-0">
                       <div className="flex justify-between items-start">
                         <h4 className="font-black text-neutral-800 text-sm line-clamp-1 mb-1">
                           {item.title || "Materi Tanpa Judul"}
                         </h4>
                         <button
                           onClick={(e) => handleDelete(e, item.id)}
                           className="p-2 text-neutral-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                         >
                           <Trash2 size={16} />
                         </button>
                       </div>
                       <p className="text-[10px] text-neutral-400 font-bold mb-4">
                         Dibuat pada {format(new Date(item.created_at), "d MMM yyyy", { locale: idLocale })}
                       </p>
                       <button className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest group-hover:translate-x-1 transition-transform">
                         Buka Rangkuman <ArrowRight size={12} strokeWidth={3} />
                       </button>
                     </div>
                   </div>
                 </motion.div>
               ))
             ) : (
               <motion.div 
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 className="py-20 text-center"
               >
                 <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                   <BookOpen size={32} className="text-neutral-200" />
                 </div>
                 <p className="text-neutral-400 font-bold text-sm">Belum ada rangkuman.</p>
                 <p className="text-neutral-300 text-xs mt-1">Ayo rangkum materi belajarmu!</p>
               </motion.div>
             )}
           </AnimatePresence>
         </div>
       </div>
 
       {/* Background Decoration */}
       <div className="fixed -bottom-20 -right-20 w-64 h-64 bg-orange-500/5 rounded-full blur-[80px] pointer-events-none -z-10" />

       <Modal 
          isOpen={!!deleteId}
          onClose={() => setDeleteId(null)}
          onConfirm={confirmDelete}
          title="Hapus Rangkuman?"
          description="Rangkuman yang dihapus tidak bisa dikembalikan lagi. Kamu yakin?"
          confirmText="Ya, Hapus"
          cancelText="Batal"
          variant="danger"
        />
     </div>
   );
 }
