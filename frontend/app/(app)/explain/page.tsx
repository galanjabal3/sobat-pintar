"use client";
 
 import React, { useState, useRef, useEffect } from "react";
 import { useRouter } from "next/navigation";
 import { Camera, Type, Send, Sparkles, X, ChevronLeft, School } from "lucide-react";
 import { Button } from "@/components/ui/Button";
 import api from "@/lib/api";
 import { getApiErrorMessage } from "@/lib/apiError";
 import { useAuthStore } from "@/store/authStore";
 import { useToastStore } from "@/store/toastStore";
 import Link from "next/link";
 import Image from "next/image";
 import { motion, AnimatePresence } from "framer-motion";
 import { SOBI_ASSETS } from "@/lib/assets";
 
 export default function ExplainPage() {
   const router = useRouter();
   const { user, fetchProfile } = useAuthStore();
   const { addToast } = useToastStore();
   const [question, setQuestion] = useState("");
   const [imageFile, setImageFile] = useState<File | null>(null);
   const [previewUrl, setPreviewUrl] = useState<string | null>(null);
   const [isLoading, setIsLoading] = useState(false);
   const fileInputRef = useRef<HTMLInputElement>(null);
   const [history, setHistory] = useState<any[]>([]);
   const userLevel = user?.level || "SD";
   const canSubmit = Boolean(question.trim() || imageFile);
 
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
 
   const handleExplain = async () => {
     if (isLoading) return;

     if (!question.trim() && !imageFile) {
       addToast("Harap ketik soal atau pilih gambar!", "error");
       return;
     }
 
     setIsLoading(true);
     try {
       let imageUrl = "";
 
       if (imageFile) {
         const formData = new FormData();
         formData.append("image", imageFile);
         
         const uploadResponse = await api.post("/upload/attachments", formData, {
           headers: {
             "Content-Type": "multipart/form-data",
           },
         });
         imageUrl = uploadResponse.data.url || uploadResponse.data.data.url;
       }
 
       const response = await api.post("/explain", {
         question: question,
         level: userLevel,
         image_url: imageUrl,
       });
       router.push(`/explain/result?id=${response.data.id}`);
    } catch (err: unknown) {
      addToast(getApiErrorMessage(err, "Maaf, Sobi gagal memproses pertanyaanmu. Coba lagi ya!"), "error");
    } finally {
      setIsLoading(false);
    }
   };
 
   useEffect(() => {
     fetchProfile();
     
     const fetchHistory = async () => {
       try {
         const response = await api.get("/explain/history");
         if (response?.data && Array.isArray(response.data)) {
           setHistory(response.data.slice(0, 3));
         }
      } catch {
        // History preview is optional on this screen.
      }
     };
     fetchHistory();
   }, [fetchProfile]);

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
           className="bg-white/70 backdrop-blur-2xl border-2 border-white rounded-[3rem] p-8 mb-8 shadow-2xl shadow-primary/5 relative"
         >
           {/* Decorative Sparkle */}
           <div className="absolute -top-4 -right-4 w-12 h-12 bg-secondary rounded-2xl shadow-lg shadow-secondary/30 flex items-center justify-center text-white rotate-12">
             <Sparkles size={20} />
           </div>
 
           <div className="mb-8">
             <h2 className="text-2xl font-black text-neutral-800 mb-2 leading-tight">Bantu Jelasin, <br/><span className="text-primary">Dong Sobi!</span></h2>
             <p className="text-xs text-neutral-400 font-medium leading-relaxed">
               Lagi bingung sama soal sekolah? Foto aja, biar Sobi bantuin langkah-langkahnya!
             </p>
           </div>
 
           {/* Action Selection */}
           <input 
             type="file" 
             accept="image/*" 
             className="hidden" 
             ref={fileInputRef} 
             onChange={handleFileChange} 
           />
           
           <AnimatePresence mode="wait">
             {!previewUrl ? (
               <motion.div 
                 key="upload-empty"
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, scale: 0.95 }}
                 onClick={() => fileInputRef.current?.click()}
                 className="group border-4 border-dashed border-primary/10 rounded-[2.5rem] p-10 flex flex-col items-center justify-center gap-6 mb-8 bg-gray-50/30 cursor-pointer hover:bg-white hover:border-primary/30 transition-all duration-500"
               >
                 <div className="w-20 h-20 bg-white rounded-3xl shadow-2xl shadow-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-500">
                   <Camera size={40} strokeWidth={2.5} />
                 </div>
                 <div className="text-center">
                   <p className="font-black text-lg text-neutral-800 mb-1">Ambil Foto Soal</p>
                   <p className="text-xs text-neutral-400 font-medium">Atau pilih dari galeri HP-mu</p>
                 </div>
               </motion.div>
             ) : (
               <motion.div 
                 key="upload-preview"
                 initial={{ opacity: 0, scale: 0.95 }}
                 animate={{ opacity: 1, scale: 1 }}
                 className="mb-8 relative rounded-[2.5rem] overflow-hidden border-4 border-white shadow-2xl aspect-[4/3] group"
               >
                 <Image src={previewUrl} alt="Preview" fill className="object-cover" />
                 <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                 <motion.button 
                   whileHover={{ scale: 1.1 }}
                   whileTap={{ scale: 0.9 }}
                   onClick={clearImage}
                   className="absolute top-4 right-4 bg-white/90 backdrop-blur-md p-3 rounded-2xl text-red-500 shadow-xl"
                   aria-label="Hapus foto soal"
                 >
                   <X size={20} strokeWidth={3} />
                 </motion.button>
               </motion.div>
             )}
           </AnimatePresence>
 
           {/* Text Input Upgrade */}
           <div className="relative mb-8 group">
             <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-neutral-300 group-focus-within:text-primary transition-colors">
               <Type size={20} strokeWidth={2.5} />
             </div>
             <textarea
               value={question}
               onChange={(e) => setQuestion(e.target.value)}
               placeholder="Atau ketik soalmu di sini..."
               className="w-full bg-gray-50/50 border-2 border-transparent rounded-[2rem] p-5 pl-14 text-sm font-medium focus:outline-none focus:bg-white focus:border-primary/20 focus:ring-4 focus:ring-primary/5 transition-all resize-none h-28"
             />
           </div>
 
           <div className="mb-10 flex justify-center">
             <div className="inline-flex items-center gap-2 rounded-full border border-primary/10 bg-primary/5 px-5 py-3 text-primary">
               <School size={16} strokeWidth={2.5} />
               <span className="text-[10px] font-black uppercase tracking-widest">
                 Jenjang {userLevel}
               </span>
             </div>
           </div>
 
           {/* Action Button Upgrade */}
           <Button
             onClick={handleExplain}
             disabled={!canSubmit}
             className="w-full py-8 h-auto text-xl font-black rounded-[2rem] shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all bg-primary hover:bg-primary/90 disabled:shadow-none"
             isLoading={isLoading}
           >
             <Send size={24} strokeWidth={3} className="mr-3" />
             Jelasin Sekarang!
           </Button>
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
                         <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider mt-1">Selesai Dianalisis</p>
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
