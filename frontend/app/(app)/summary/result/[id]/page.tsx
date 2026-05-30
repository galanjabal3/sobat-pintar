"use client";
 
 import React, { useCallback, useEffect, useState } from "react";
 import { useRouter, useParams } from "next/navigation";
 import { ChevronLeft, FileText, Sparkles, Copy, Share2, Download, Clock, ArrowRight } from "lucide-react";
 import api from "@/lib/api";
 import { getApiErrorMessage } from "@/lib/apiError";
 import { motion } from "framer-motion";
 import { useToastStore } from "@/store/toastStore";
 import Image from "next/image";
 import { SOBI_ASSETS } from "@/lib/assets";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import ShareModal from "@/components/ui/ShareModal";
import { AIMarkdown } from "@/components/ai/AIMarkdown";
import { copyMarkdownToClipboard } from "@/lib/clipboardMarkdown";
 
 interface SummaryDetail {
   id: string;
   source_type: string;
   summary: string;
   created_at: string;
 }

 function escapeHtml(value: string) {
   return value
     .replace(/&/g, "&amp;")
     .replace(/</g, "&lt;")
     .replace(/>/g, "&gt;")
     .replace(/"/g, "&quot;");
 }

function formatInlineMarkdown(value: string) {
  return escapeHtml(value)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\+\+(.+?)\+\+/g, "<u>$1</u>")
    .replace(/==(.+?)==/g, "<mark>$1</mark>")
    .replace(/~~(.+?)~~/g, "<del>$1</del>");
}

function formatInlinePrintText(value: string) {
  return escapeHtml(value)
    .replace(/\$\$([^$\n]+?)\$\$/g, "<span class=\"math\">$1</span>")
    .replace(/\$([^$\n]+?)\$/g, "<span class=\"math\">$1</span>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\+\+(.+?)\+\+/g, "<u>$1</u>")
    .replace(/==(.+?)==/g, "<mark>$1</mark>")
    .replace(/~~(.+?)~~/g, "<del>$1</del>");
}

 function renderSummaryForPrint(markdown: string) {
   const lines = markdown.split(/\r?\n/);
   const html: string[] = [];
   let listOpen = false;

   const closeList = () => {
     if (listOpen) {
       html.push("</ul>");
       listOpen = false;
     }
   };

   for (const rawLine of lines) {
     const line = rawLine.trim();

     if (!line) {
       closeList();
       continue;
     }

     if (/^-{3,}$/.test(line)) {
       closeList();
       html.push("<hr />");
       continue;
     }

    if (line.startsWith("### ")) {
      closeList();
      html.push(`<h3>${formatInlinePrintText(line.slice(4))}</h3>`);
      continue;
    }

    if (line.startsWith("## ")) {
      closeList();
      html.push(`<h2>${formatInlinePrintText(line.slice(3))}</h2>`);
      continue;
    }

    if (line.startsWith("# ")) {
      closeList();
      html.push(`<h1>${formatInlinePrintText(line.slice(2))}</h1>`);
      continue;
    }

     if (/^(\*|-)\s+/.test(line)) {
      if (!listOpen) {
        html.push("<ul>");
        listOpen = true;
      }
      html.push(`<li>${formatInlinePrintText(line.replace(/^(\*|-)\s+/, ""))}</li>`);
      continue;
    }

    closeList();
    html.push(`<p>${formatInlinePrintText(line)}</p>`);
  }

   closeList();
   return html.join("");
 }

function stripSummaryMarkdown(markdown: string) {
  return markdown
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/\+\+(.*?)\+\+/g, "$1")
    .replace(/==(.*?)==/g, "$1")
    .replace(/~~(.*?)~~/g, "$1")
    .replace(/\$\$([^$\n]+?)\$\$/g, "$1")
    .replace(/\$([^$\n]+?)\$/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^\s*[-*]\s+/gm, "- ")
    .replace(/^-{3,}$/gm, "")
    .trim();
}
 
 export default function SummaryResultPage() {
   const router = useRouter();
   const params = useParams();
   const id = params.id as string;
   const { addToast } = useToastStore();
   
   const [detail, setDetail] = useState<SummaryDetail | null>(null);
   const [isLoading, setIsLoading] = useState(true);
   const [isShareModalOpen, setIsShareModalOpen] = useState(false);
   const [shareUrl, setShareUrl] = useState("");
   const [isCreatingShare, setIsCreatingShare] = useState(false);
 
   const fetchDetail = useCallback(async () => {
     try {
       const response = await api.get(`/summary/${id}`);
       setDetail(response.data);
     } catch (err: unknown) {
       addToast(getApiErrorMessage(err, "Gagal mengambil detail rangkuman."), "error");
       router.push("/summary");
     } finally {
       setIsLoading(false);
     }
   }, [addToast, id, router]);

   useEffect(() => {
     fetchDetail();
   }, [fetchDetail]);
 
  const handleCopy = async () => {
    if (!detail) return;

    try {
      await copyMarkdownToClipboard(detail.summary);
      addToast("Rangkuman berhasil disalin.", "success");
    } catch {
      addToast("Gagal menyalin rangkuman.", "error");
    }
  };

  const handleShare = async () => {
    if (isCreatingShare) return;

    setIsCreatingShare(true);
    try {
      const response = await api.post(`/summary/${id}/share`);
      setShareUrl(`${window.location.origin}/share/${response.data.token}`);
      setIsShareModalOpen(true);
    } catch (err: unknown) {
      addToast(getApiErrorMessage(err, "Gagal membuat tautan berbagi."), "error");
    } finally {
      setIsCreatingShare(false);
    }
  };

   const handleDownloadPdf = () => {
     if (!detail) return;

     const printWindow = window.open("", "_blank");
     if (!printWindow) {
       addToast("Gagal membuka jendela PDF. Izinkan pop-up lalu coba lagi.", "error");
       return;
     }

     const formattedSummary = renderSummaryForPrint(detail.summary);

     printWindow.document.write(`
       <!doctype html>
       <html lang="id">
         <head>
           <meta charset="utf-8" />
           <title>Rangkuman Sobi</title>
           <style>
             body {
               color: #1f2937;
               font-family: Arial, sans-serif;
               line-height: 1.7;
               padding: 32px;
             }
             .brand {
               color: #02D48F;
               font-size: 24px;
               margin-bottom: 8px;
             }
             h1, h2, h3 {
               color: #111827;
               line-height: 1.35;
               margin: 22px 0 10px;
             }
             h1 { font-size: 20px; }
             h2 { font-size: 17px; }
             h3 { font-size: 15px; }
             .meta {
               color: #717676;
               font-size: 12px;
               font-weight: 700;
               letter-spacing: 0.08em;
               margin-bottom: 28px;
               text-transform: uppercase;
             }
             p {
               font-size: 14px;
               margin: 0 0 12px;
             }
             ul {
               margin: 0 0 18px 20px;
               padding: 0;
             }
             li {
               font-size: 14px;
               margin: 6px 0;
             }
             strong {
               color: #02A66F;
               font-weight: 800;
             }
             mark {
               background: #fef3c7;
               border-radius: 4px;
               padding: 0 3px;
             }
             .math {
               font-style: italic;
               color: #111827;
             }
             u {
               text-underline-offset: 3px;
             }
             hr {
               border: 0;
               border-top: 1px solid #d1fae5;
               margin: 24px 0;
             }
           </style>
         </head>
         <body>
           <h1 class="brand">Rangkuman Sobi</h1>
           <div class="meta">${format(new Date(detail.created_at), "d MMMM yyyy HH:mm", { locale: idLocale })}</div>
           <main>${formattedSummary}</main>
         </body>
       </html>
     `);
     printWindow.document.close();
     printWindow.onload = () => {
       setTimeout(() => {
         printWindow.focus();
         printWindow.print();
       }, 250);
     };
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
	             aria-label="Kembali ke rangkuman"
	           >
             <ChevronLeft size={20} strokeWidth={3} />
           </motion.button>
           <div>
             <h1 className="text-sm font-black text-neutral-800 uppercase tracking-widest">Hasil Rangkuman</h1>
             <p className="text-[10px] font-black text-primary uppercase tracking-widest">
               {detail?.source_type === "image" ? "Dari Foto" : "Dari Teks"}
             </p>
           </div>
         </div>
         
         <div className="flex gap-2">
	           <button type="button" onClick={handleCopy} className="w-10 h-10 bg-white rounded-xl shadow-lg shadow-black/5 flex items-center justify-center border border-gray-100 text-neutral-400 hover:text-primary transition-colors" aria-label="Salin rangkuman">
	             <Copy size={18} />
	           </button>
	           <button type="button" onClick={handleShare} disabled={isCreatingShare} className="w-10 h-10 bg-white rounded-xl shadow-lg shadow-black/5 flex items-center justify-center border border-gray-100 text-neutral-400 hover:text-primary transition-colors disabled:opacity-50" aria-label="Bagikan rangkuman">
	             <Share2 size={18} />
	           </button>
         </div>
       </header>
       <ShareModal
         isOpen={isShareModalOpen}
         onClose={() => setIsShareModalOpen(false)}
         url={shareUrl}
         title="Rangkuman dari Sobi"
         heading="Bagikan Rangkuman"
       />
 
       <main className="flex-1 px-6 py-10 max-w-2xl mx-auto w-full pb-20">
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
 
           <div className="bg-white p-5 rounded-[2rem] border-4 border-white shadow-[0_20px_50px_rgba(0,0,0,0.05)] relative overflow-hidden sm:p-8 sm:rounded-[3rem]">
             <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -z-10" />
             
             <AIMarkdown
               className="prose prose-sm max-w-none text-neutral-800"
               components={{
                 h1: ({children}) => <h1 className="text-xl font-black text-neutral-800 mt-8 mb-4">{children}</h1>,
                 h2: ({children}) => <h2 className="text-lg font-black text-neutral-800 mt-6 mb-3">{children}</h2>,
                 h3: ({children}) => <h3 className="text-base font-black text-neutral-800 mt-5 mb-2">{children}</h3>,
                 p: ({children}) => <p className="text-neutral-600 mb-4 leading-[1.8] font-medium text-[15px]">{children}</p>,
                 strong: ({children}) => <strong className="font-black text-primary">{children}</strong>,
                 em: ({children}) => <em className="italic font-bold text-neutral-800">{children}</em>,
                 del: ({children}) => <del className="text-neutral-500 decoration-2">{children}</del>,
                 ul: ({children}) => <ul className="mb-6 list-disc space-y-3 pl-5 marker:text-primary">{children}</ul>,
                 ol: ({children}) => <ol className="mb-6 list-decimal space-y-3 pl-5 marker:font-black marker:text-primary">{children}</ol>,
                 li: ({children}) => (
                   <li className="pl-2 text-neutral-600 font-medium text-[15px] leading-relaxed [&>p]:m-0 [&>ol]:mt-3 [&>ul]:mt-3">
                     {children}
                   </li>
                 ),
                 hr: () => <div className="my-8 h-px bg-primary/10" />,
                 blockquote: ({children}) => <div className="border-l-4 border-secondary bg-secondary/5 p-4 rounded-r-2xl italic text-neutral-600 mb-6">{children}</div>,
               }}
             >
               {detail?.summary || ""}
             </AIMarkdown>
           </div>
 
           {/* Feedback / Sobi Tip */}
           <motion.div 
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             transition={{ delay: 0.2 }}
             className="bg-primary/5 border-2 border-primary/10 p-5 rounded-[2rem] flex items-start gap-4 sm:p-6 sm:rounded-[2.5rem] sm:gap-5"
           >
             <div className="w-12 h-12 relative shrink-0">
               <Image
                 src={SOBI_ASSETS.DEFAULT}
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
 
           <div className="grid grid-cols-1 gap-3 pt-4 min-[430px]:grid-cols-2 sm:gap-4">
	             <button type="button" onClick={handleDownloadPdf} className="flex items-center justify-center gap-3 py-5 bg-white border-4 border-white shadow-xl shadow-black/5 rounded-[2rem] font-black text-xs text-neutral-600 uppercase tracking-widest hover:shadow-2xl transition-all">
               <Download size={18} /> Simpan PDF
             </button>
	             <button type="button" onClick={() => router.push("/practice")} className="flex items-center justify-center gap-3 py-5 bg-primary text-white shadow-xl shadow-primary/20 rounded-[2rem] font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all">
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
