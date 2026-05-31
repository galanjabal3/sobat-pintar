"use client";
 
 import React, { useCallback, useEffect, useRef, useState } from "react";
 import { useRouter } from "next/navigation";
 import { Camera, Type, Sparkles, X, ChevronLeft } from "lucide-react";
 import { Button } from "@/components/ui/Button";
 import api from "@/lib/api";
 import { getApiErrorMessage } from "@/lib/apiError";
 import { useAuthStore } from "@/store/authStore";
 import { useToastStore } from "@/store/toastStore";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { SOBI_ASSETS } from "@/lib/assets";
import { MAX_EXPLAIN_QUESTION_CHARS } from "@/lib/aiLimits";
import { QuotaBadge } from "@/components/ai/QuotaBadge";
import { notifyAIQuotaUpdated } from "@/lib/aiQuota";
import { AutoGrowTextarea } from "@/components/ui/AutoGrowTextarea";
import { usePageResumeRefresh } from "@/hooks/usePageResumeRefresh";

interface ExplainHistoryPreview {
  id: string;
  question_text?: string;
  status?: "processing" | "completed" | "failed";
}

interface UploadAttachmentResponse {
  url?: string;
  data?: {
    url?: string;
  };
}

type ExplainInputMode = "text" | "image";

function getHistoryStatusLabel(status?: ExplainHistoryPreview["status"]) {
  if (status === "processing") return "Sedang Diproses";
  if (status === "failed") return "Gagal Dianalisis";
  return "Selesai Dianalisis";
}

function getHistoryStatusClassName(status?: ExplainHistoryPreview["status"]) {
  if (status === "processing") return "text-secondary";
  if (status === "failed") return "text-error";
  return "text-neutral-400";
}

 export default function ExplainPage() {
   const router = useRouter();
   const { user, fetchProfile } = useAuthStore();
   const { addToast } = useToastStore();
   const [question, setQuestion] = useState("");
   const [imageFile, setImageFile] = useState<File | null>(null);
   const [previewUrl, setPreviewUrl] = useState<string | null>(null);
   const [isLoading, setIsLoading] = useState(false);
   const [inputMode, setInputMode] = useState<ExplainInputMode>("text");
   const fileInputRef = useRef<HTMLInputElement>(null);
   const isSubmittingRef = useRef(false);
	   const [history, setHistory] = useState<ExplainHistoryPreview[]>([]);
   const userLevel = user?.level || "SD";
   const canSubmit = inputMode === "text" ? Boolean(question.trim()) : Boolean(imageFile);

   const fetchHistory = useCallback(async () => {
     try {
       const response = await api.get("/explain/history");
       if (response?.data && Array.isArray(response.data)) {
         setHistory(response.data.slice(0, 3));
       }
     } catch {
       // History preview is optional on this screen.
     }
   }, []);

   usePageResumeRefresh(fetchHistory);
 
   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
     if (e.target.files && e.target.files[0]) {
       const file = e.target.files[0];
       setImageFile(file);
       setPreviewUrl((currentUrl) => {
         if (currentUrl) URL.revokeObjectURL(currentUrl);
         return URL.createObjectURL(file);
       });
     }
   };

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

   const selectInputMode = (mode: ExplainInputMode) => {
     setInputMode(mode);
     if (mode === "text") {
       clearImage();
     } else {
       setQuestion("");
     }
   };
 
   const handleExplain = async () => {
     if (isSubmittingRef.current) return;

     if (inputMode === "text" && !question.trim()) {
       addToast("Ketik soal yang ingin dijelaskan ya!", "error");
       return;
     }
     if (inputMode === "image" && !imageFile) {
       addToast("Pilih foto soal yang ingin dijelaskan ya!", "error");
       return;
     }
 
     isSubmittingRef.current = true;
     setIsLoading(true);
     try {
       let imageUrl = "";
 
       if (inputMode === "image" && imageFile) {
         const formData = new FormData();
         formData.append("image", imageFile);
         
         const uploadResponse = await api.post<UploadAttachmentResponse>("/upload/attachments", formData, {
           headers: {
             "Content-Type": "multipart/form-data",
           },
         });
         imageUrl = uploadResponse.data.url || uploadResponse.data.data?.url || "";
         if (!imageUrl) {
           throw new Error("Upload response did not include an image URL");
         }
       }
 
      const response = await api.post("/explain", {
        question: inputMode === "text" ? question : "",
        level: userLevel,
        image_url: imageUrl,
      });
      notifyAIQuotaUpdated();
      addToast("Penjelasan sedang diproses.", "success");
      router.push(`/explain/result?id=${response.data.id}`);
    } catch (err: unknown) {
      isSubmittingRef.current = false;
      addToast(getApiErrorMessage(err, "Maaf, Sobi gagal memproses pertanyaanmu. Coba lagi ya!"), "error");
      setIsLoading(false);
    }
   };
 
   useEffect(() => {
     fetchProfile();
     fetchHistory();
   }, [fetchHistory, fetchProfile]);

   useEffect(() => {
     if (!history.some((item) => item.status === "processing")) return;

     const intervalID = window.setInterval(fetchHistory, 7500);
     return () => window.clearInterval(intervalID);
   }, [fetchHistory, history]);

   useEffect(() => {
     return () => {
       if (previewUrl) URL.revokeObjectURL(previewUrl);
     };
   }, [previewUrl]);
 
   return (
     <div className="min-h-screen bg-[#FDFEFF] relative overflow-hidden">
       {/* Premium Background Mesh */}
       <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-primary/10 to-transparent -z-10" />
       <div className="absolute -top-24 -right-24 w-64 h-64 bg-secondary/10 rounded-full blur-[100px] -z-10" />
       <div className="absolute top-1/2 -left-24 w-64 h-64 bg-primary/10 rounded-full blur-[100px] -z-10" />
 
       <div className="px-6 pt-12 pb-20 max-w-2xl mx-auto">
         <motion.header 
           initial={{ opacity: 0, y: -20 }}
           animate={{ opacity: 1, y: 0 }}
           className="flex items-center mb-10"
         >
           <div className="flex items-center gap-4">
             <motion.button
               whileHover={{ scale: 1.1 }}
               whileTap={{ scale: 0.9 }}
               onClick={() => router.push("/dashboard")}
               className="w-12 h-12 bg-white rounded-2xl shadow-xl shadow-primary/5 flex items-center justify-center border border-primary/5 text-neutral-800"
               aria-label="Kembali ke beranda"
             >
               <ChevronLeft size={24} strokeWidth={2.5} />
             </motion.button>
             <div>
               <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-0.5">Sobat Pintar</p>
               <h1 className="text-xl font-black text-neutral-800 leading-tight">Jelasin Soal</h1>
             </div>
           </div>
         </motion.header>
 
         {/* Main Feature Card */}
         <motion.div 
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ delay: 0.1 }}
           className="bg-white/70 backdrop-blur-2xl border-2 border-white rounded-[2rem] p-5 mb-8 shadow-2xl shadow-primary/5 relative sm:rounded-[3rem] sm:p-8"
         >
           {/* Decorative Sparkle */}
           <div className="absolute -top-4 -right-4 w-12 h-12 bg-secondary rounded-2xl shadow-lg shadow-secondary/30 flex items-center justify-center text-white rotate-12">
             <Sparkles size={20} />
           </div>
 
           <div className="mb-8">
             <h2 className="text-2xl font-black text-neutral-800 mb-2 leading-tight">Bantu Jelasin, <br/><span className="text-primary">Dong Sobi!</span></h2>
             <p className="text-xs text-neutral-400 font-medium leading-relaxed">
               Ketik atau foto soalmu, biar Sobi bantu jelasin langkah-langkahnya!
             </p>
           </div>
 
           <input 
             type="file" 
             accept="image/*" 
             className="hidden" 
             ref={fileInputRef} 
             onChange={handleFileChange} 
           />

           <div className="mb-5 grid grid-cols-2 rounded-2xl bg-gray-50 p-1.5">
             <button
               type="button"
               onClick={() => selectInputMode("text")}
               className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-black transition-all ${
                 inputMode === "text" ? "bg-white text-primary shadow-sm" : "text-neutral-400"
               }`}
               aria-pressed={inputMode === "text"}
             >
               <Type size={16} /> Teks
             </button>
             <button
               type="button"
               onClick={() => selectInputMode("image")}
               className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-black transition-all ${
                 inputMode === "image" ? "bg-white text-primary shadow-sm" : "text-neutral-400"
               }`}
               aria-pressed={inputMode === "image"}
             >
               <Camera size={16} /> Foto Soal
             </button>
           </div>

           <AnimatePresence mode="wait">
             {inputMode === "text" ? (
               <motion.div
                 key="text-input"
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, scale: 0.98 }}
                 className="mb-6"
               >
                 <AutoGrowTextarea
                   value={question}
                   onChange={(e) => setQuestion(e.target.value)}
                   onKeyDown={(e) => {
                     if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                       e.preventDefault();
                       handleExplain();
                     }
                   }}
                   enterKeyHint="send"
                   placeholder="Ketik soalmu di sini..."
                   maxLength={MAX_EXPLAIN_QUESTION_CHARS}
                   minRows={7}
                   maxRows={14}
                   className="w-full rounded-3xl border-2 border-primary/5 bg-white/50 p-5 text-sm font-medium leading-relaxed transition-all placeholder:text-neutral-300 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
                 />
               </motion.div>
             ) : previewUrl ? (
               <motion.div
                 key="image-preview"
                 initial={{ opacity: 0, scale: 0.95 }}
                 animate={{ opacity: 1, scale: 1 }}
                 exit={{ opacity: 0, scale: 0.98 }}
                 className="relative mb-6 aspect-[4/3] overflow-hidden rounded-3xl border-2 border-primary/10"
               >
                 <Image src={previewUrl} alt="Pratinjau foto soal" fill className="object-cover" />
                 <button
                   type="button"
                   onClick={clearImage}
                   aria-label="Hapus foto soal"
                   className="absolute right-3 top-3 rounded-xl bg-white p-2.5 text-red-500 shadow-lg"
                 >
                   <X size={18} strokeWidth={3} />
                 </button>
               </motion.div>
             ) : (
               <motion.button
                 key="image-empty"
                 type="button"
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, scale: 0.98 }}
                 onClick={() => fileInputRef.current?.click()}
                 className="mb-6 flex min-h-52 w-full flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed border-primary/15 bg-primary/[0.02] text-center transition-colors hover:border-primary/35"
               >
                 <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                   <Camera size={30} strokeWidth={2.5} />
                 </span>
                 <span>
                   <span className="block text-sm font-black text-neutral-800">Pilih Foto Soal</span>
                   <span className="mt-1 block text-xs font-medium text-neutral-400">JPG, PNG, atau WEBP. Maksimal 5MB.</span>
                 </span>
               </motion.button>
             )}
           </AnimatePresence>
 
           {/* Action Button Upgrade */}
          <Button
            onClick={handleExplain}
            disabled={!canSubmit || isLoading}
            className="w-full py-5 h-auto text-base font-black rounded-[1.5rem] shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all bg-primary hover:bg-primary/90 disabled:shadow-none sm:py-8 sm:text-xl sm:rounded-[2rem]"
            isLoading={isLoading}
            hideChildrenWhenLoading
          >
            <Sparkles size={24} strokeWidth={3} className="mr-3" />
            Jelasin Sekarang!
          </Button>
          <div className="mt-4">
            <QuotaBadge feature="explain" />
          </div>
        </motion.div>
 
         {/* History Section Upgrade */}
         <motion.section 
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.2 }}
           className="mt-12"
         >
           <div className="flex justify-between items-end mb-6 px-2">
             <div>
               <h2 className="text-lg font-black text-neutral-800 leading-tight">Analisis Terakhir</h2>
               <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Belajar apa tadi?</p>
             </div>
             <Link href="/explain/history" className="bg-primary/5 text-primary text-[10px] font-black px-4 py-2 rounded-xl hover:bg-primary/10 transition-colors uppercase tracking-widest">
               Lihat Semua
             </Link>
           </div>
           
           <AnimatePresence>
             {history.length === 0 ? (
               <motion.div 
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 className="text-center py-12 bg-white/50 backdrop-blur-xl border-2 border-white rounded-[2.5rem] shadow-xl shadow-primary/5"
               >
                 <p className="text-xs text-neutral-400 font-bold">Belum ada riwayat pertanyaan</p>
               </motion.div>
             ) : (
               <div className="grid gap-4">
                 {history.map((item, idx) => (
                   <motion.div
                     initial={{ opacity: 0, x: -20 }}
                     animate={{ opacity: 1, x: 0 }}
                     transition={{ delay: 0.3 + (idx * 0.1) }}
                     key={item.id}
                   >
                     <Link
                       href={`/explain/result?id=${item.id}`}
                       className="group flex items-center p-5 bg-white border-2 border-white rounded-[2rem] shadow-xl shadow-primary/5 hover:border-primary/20 hover:shadow-primary/10 transition-all duration-300"
                     >
                       <div className="w-12 h-12 bg-primary/5 text-primary rounded-2xl flex items-center justify-center mr-4 group-hover:bg-primary group-hover:text-white transition-all duration-300 shrink-0">
                         <Type size={20} strokeWidth={2.5} />
                       </div>
                       <div className="flex-1 min-w-0">
                         <p className="text-sm text-neutral-800 font-black leading-snug line-clamp-2 break-words">
                           {item.question_text || "Soal Gambar"}
                         </p>
                         <p className={`text-[10px] font-bold uppercase tracking-wider mt-1 ${getHistoryStatusClassName(item.status)}`}>
                           {getHistoryStatusLabel(item.status)}
                         </p>
                       </div>
                     </Link>
                   </motion.div>
                 ))}
               </div>
             )}
           </AnimatePresence>
         </motion.section>
       </div>
 
       {/* Floating Mascot Sobi */}
       <motion.div 
         animate={{ 
           y: [0, -10, 0],
           rotate: [0, 2, 0]
         }}
         transition={{ 
           duration: 4, 
           repeat: Infinity,
           ease: "easeInOut"
         }}
         className="fixed -bottom-10 -right-10 w-40 h-40 pointer-events-none opacity-30 z-0"
       >
         <Image
           src={SOBI_ASSETS.IDEA}
           alt="Sobi BG"
           fill
           className="object-contain drop-shadow-xl"
           priority
           sizes="160px"
         />
       </motion.div>
     </div>
   );
 }
