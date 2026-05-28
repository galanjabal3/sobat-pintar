"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight, Camera, ChevronLeft, Clock, FileText, Sparkles, Trash2, Type, X } from "lucide-react";
import api from "@/lib/api";
import { getApiErrorMessage } from "@/lib/apiError";
import { motion, AnimatePresence } from "framer-motion";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToastStore } from "@/store/toastStore";
import { Button } from "@/components/ui/Button";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Modal } from "@/components/ui/Modal";
import { SOBI_ASSETS } from "@/lib/assets";
import { MAX_SUMMARY_CONTENT_CHARS } from "@/lib/aiLimits";
import { QuotaBadge } from "@/components/ai/QuotaBadge";
import { notifyAIQuotaUpdated } from "@/lib/aiQuota";
import { AutoGrowTextarea } from "@/components/ui/AutoGrowTextarea";

interface SummaryHistory {
  id: string;
  title?: string;
  summary?: string;
  created_at: string;
}

interface UploadAttachmentResponse {
  url?: string;
  data?: {
    url?: string;
  };
}

type SummarySourceType = "text" | "image";

const MAX_SUMMARY_IMAGE_SIZE = 5 * 1024 * 1024;
const SUPPORTED_SUMMARY_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

function getSummaryPreview(item: SummaryHistory) {
  if (item.title) return cleanSummaryPreviewText(item.title);

  const preview = item.summary
    ?.split(/\r?\n/)
    .map(cleanSummaryPreviewText)
    .find((line) => line && !isGenericSummaryHeading(line));

  return preview || "Materi Tanpa Judul";
}

function cleanSummaryPreviewText(text: string) {
  return text
    .replace(/^#{1,6}\s+/, "")
    .replace(/^[-*+]\s+/, "")
    .replace(/^\d+[.)]\s+/, "")
    .replace(/[*_`~]/g, "")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function isGenericSummaryHeading(text: string) {
  return /^(poin[-\s]?poin penting|kesimpulan|tips sobi|tips untuk mengingat|rangkuman)\s*:?\s*$/i.test(text);
}

export default function SummaryPage() {
  const router = useRouter();
  const { addToast } = useToastStore();
  const [history, setHistory] = useState<SummaryHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sourceType, setSourceType] = useState<SummarySourceType>("text");
  const [text, setText] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canSubmit = sourceType === "text" ? Boolean(text.trim()) : Boolean(imageFile);

  const fetchHistory = useCallback(async () => {
    try {
      const response = await api.get("/summary/history");
      setHistory(response.data || []);
    } catch (err: unknown) {
      addToast(getApiErrorMessage(err, "Gagal mengambil riwayat rangkuman."), "error");
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const clearImage = () => {
    setImageFile(null);
    setPreviewUrl((currentUrl) => {
      if (currentUrl) URL.revokeObjectURL(currentUrl);
      return null;
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!SUPPORTED_SUMMARY_IMAGE_TYPES.includes(file.type)) {
      addToast("Gunakan foto JPG, PNG, atau WEBP ya.", "error");
      event.target.value = "";
      return;
    }
    if (file.size > MAX_SUMMARY_IMAGE_SIZE) {
      addToast("Ukuran foto maksimal 5MB ya.", "error");
      event.target.value = "";
      return;
    }

    setImageFile(file);
    setPreviewUrl((currentUrl) => {
      if (currentUrl) URL.revokeObjectURL(currentUrl);
      return URL.createObjectURL(file);
    });
  };

  const handleSummarize = async () => {
    if (isSubmitting) return;

    if (sourceType === "text" && !text.trim()) {
      addToast("Masukkan teks yang ingin dirangkum ya!", "error");
      return;
    }
    if (sourceType === "image" && !imageFile) {
      addToast("Pilih foto materi yang ingin dirangkum ya!", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      let requestBody: { source_type: SummarySourceType; content?: string; file_url?: string };
      if (sourceType === "image" && imageFile) {
        const formData = new FormData();
        formData.append("image", imageFile);
        const uploadResponse = await api.post<UploadAttachmentResponse>("/upload/attachments", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        const imageUrl = uploadResponse.data.url || uploadResponse.data.data?.url;
        if (!imageUrl) {
          throw new Error("Upload response did not include an image URL");
        }
        requestBody = { source_type: "image", file_url: imageUrl };
      } else {
        requestBody = { source_type: "text", content: text };
      }

      const response = await api.post("/summary", requestBody);
      addToast("Rangkuman berhasil dibuat!", "success");
      notifyAIQuotaUpdated();
      setText("");
      clearImage();
      router.push(`/summary/result/${response.data.id}`);
    } catch (err: unknown) {
      addToast(getApiErrorMessage(err, "Gagal membuat rangkuman."), "error");
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
    } catch (err: unknown) {
      addToast(getApiErrorMessage(err, "Gagal menghapus rangkuman."), "error");
    } finally {
      setDeleteId(null);
    }
  };
 
   return (
     <div className="min-h-screen bg-[#FDFEFF] relative overflow-hidden">
       {/* Premium Background Mesh */}
       <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-primary/5 to-transparent -z-10" />
       <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 rounded-full blur-[100px] -z-10" />
 
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
               <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-0.5">Belajar Efektif</p>
               <h1 className="text-xl font-black text-neutral-800">Rangkum Materi</h1>
             </div>
           </div>

         </motion.header>
 
         {/* Input Section */}
         <motion.div 
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ delay: 0.1 }}
           className="bg-white/70 backdrop-blur-2xl border-4 border-white p-5 rounded-[2rem] mb-12 relative overflow-hidden shadow-2xl shadow-primary/5 sm:p-8 sm:rounded-[3rem]"
         >
           <div className="relative z-10">
             <div className="flex items-center gap-2 mb-4">
               <Sparkles size={16} className="text-secondary" />
               <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Sobi Rangkum</p>
             </div>
             <h3 className="text-2xl font-black text-neutral-800 leading-tight mb-6">
               Kirim materimu, <br /> biar <span className="text-primary">Sobi ringkas!</span>
             </h3>

             <div className="mb-5 grid grid-cols-2 rounded-2xl bg-gray-50 p-1.5">
               <button
                 type="button"
                 onClick={() => setSourceType("text")}
                 className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-black transition-all ${
                   sourceType === "text" ? "bg-white text-primary shadow-sm" : "text-neutral-400"
                 }`}
                 aria-pressed={sourceType === "text"}
               >
                 <Type size={16} /> Teks
               </button>
               <button
                 type="button"
                 onClick={() => setSourceType("image")}
                 className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-black transition-all ${
                   sourceType === "image" ? "bg-white text-primary shadow-sm" : "text-neutral-400"
                 }`}
                 aria-pressed={sourceType === "image"}
               >
                 <Camera size={16} /> Foto Materi
               </button>
             </div>

             {sourceType === "text" ? (
               <div className="relative">
                 <AutoGrowTextarea
                   value={text}
                   onChange={(e) => setText(e.target.value)}
                   onKeyDown={(e) => {
                     if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                       e.preventDefault();
                       handleSummarize();
                     }
                   }}
                   enterKeyHint="send"
                   placeholder="Tempel teks atau materi di sini..."
                   maxLength={MAX_SUMMARY_CONTENT_CHARS}
                   minRows={7}
                   maxRows={14}
                   className="w-full bg-white/50 border-2 border-primary/5 rounded-3xl p-5 text-sm font-medium leading-relaxed focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-neutral-300"
                 />
               </div>
             ) : (
               <div>
                 <input
                   ref={fileInputRef}
                   type="file"
                   accept="image/jpeg,image/png,image/webp"
                   onChange={handleFileChange}
                   className="hidden"
                 />
                 {previewUrl ? (
                   <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border-2 border-primary/10">
                     <Image src={previewUrl} alt="Pratinjau foto materi" fill unoptimized className="object-cover" />
                     <button
                       type="button"
                       onClick={clearImage}
                       aria-label="Hapus foto materi"
                       className="absolute right-3 top-3 rounded-xl bg-white p-2.5 text-red-500 shadow-lg"
                     >
                       <X size={18} strokeWidth={3} />
                     </button>
                   </div>
                 ) : (
                   <button
                     type="button"
                     onClick={() => fileInputRef.current?.click()}
                     className="flex min-h-52 w-full flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed border-primary/15 bg-primary/[0.02] text-center transition-colors hover:border-primary/35"
                   >
                     <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                       <Camera size={30} strokeWidth={2.5} />
                     </span>
                     <span>
                       <span className="block text-sm font-black text-neutral-800">Pilih Foto Materi</span>
                       <span className="mt-1 block text-xs font-medium text-neutral-400">JPG, PNG, atau WEBP. Maksimal 5MB.</span>
                     </span>
                   </button>
                 )}
               </div>
             )}
 
            <Button
              onClick={handleSummarize}
              isLoading={isSubmitting}
              disabled={!canSubmit || isSubmitting}
              className="w-full mt-6 py-6 h-auto text-lg rounded-[2rem] shadow-2xl shadow-primary/20 font-black group"
              hideChildrenWhenLoading
            >
              <Sparkles size={20} strokeWidth={3} className="mr-3" />
              Buat Rangkuman
            </Button>
            <div className="mt-4">
              <QuotaBadge feature="summary" />
            </div>
          </div>
        </motion.div>
 
         {/* History Section */}
         <div className="space-y-6">
           <div className="flex items-center justify-between px-2">
             <h2 className="text-xs font-black text-neutral-400 uppercase tracking-widest flex items-center gap-2">
               <Clock size={14} /> Riwayat Rangkuman
             </h2>
             <span className="text-[10px] font-black text-primary bg-primary/10 px-3 py-1 rounded-full">
               {history.length} Rangkuman
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
                       <div className="flex justify-between items-start gap-3">
                         <h4 className="font-black text-neutral-800 text-sm leading-snug line-clamp-2 break-words mb-1">
                           {getSummaryPreview(item)}
                         </h4>
                         <button
                           type="button"
                           onClick={(e) => handleDelete(e, item.id)}
                           className="p-2 text-neutral-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                           aria-label="Hapus rangkuman"
                         >
                           <Trash2 size={16} />
                         </button>
                       </div>
                       <p className="text-[10px] text-neutral-400 font-bold mb-4">
                         Dibuat pada {format(new Date(item.created_at), "d MMM yyyy", { locale: idLocale })}
                       </p>
                       <button
                         onClick={() => router.push(`/summary/result/${item.id}`)}
                         className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest group-hover:translate-x-1 transition-transform"
                       >
                         Buka Rangkuman <ArrowRight size={12} strokeWidth={3} />
                       </button>
                     </div>
                   </div>
                 </motion.div>
               ))
             ) : (
                <div className="py-10">
                  <EmptyState 
                    title="Belum Ada Rangkuman"
                    description="Ayo rangkum materi belajarmu biar belajarnya makin cepat dan efisien!"
                    imageSrc={SOBI_ASSETS.TEACHER}
                  />
                </div>
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
