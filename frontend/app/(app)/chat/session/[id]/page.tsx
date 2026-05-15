"use client";
 
 import React, { useEffect, useState, useRef } from "react";
 import { useRouter, useParams } from "next/navigation";
 import { ChevronLeft, Send, Sparkles, MoreVertical, Trash2, Bot, User } from "lucide-react";
 import api from "@/lib/api";
 import { motion, AnimatePresence } from "framer-motion";
 import { useToastStore } from "@/store/toastStore";
 import Image from "next/image";
 import { cn } from "@/lib/utils";
 import { format } from "date-fns";
 import { id as idLocale } from "date-fns/locale";
 
 interface Message {
   id: string;
   role: "user" | "assistant";
   content: string;
   created_at: string;
 }
 
 interface ChatDetail {
   session: {
     id: string;
     title: string;
     level: string;
   };
   messages: Message[];
 }
 
 export default function ChatSessionPage() {
   const router = useRouter();
   const params = useParams();
   const sessionId = params.id as string;
   const { addToast } = useToastStore();
   
   const [chat, setChat] = useState<ChatDetail | null>(null);
   const [isLoading, setIsLoading] = useState(true);
   const [message, setMessage] = useState("");
   const [isSending, setIsSending] = useState(false);
   const scrollRef = useRef<HTMLDivElement>(null);
 
   useEffect(() => {
     fetchChatDetail();
   }, [sessionId]);
 
   useEffect(() => {
     if (scrollRef.current) {
       scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
     }
   }, [chat?.messages, isSending]);
 
   const fetchChatDetail = async () => {
     try {
       const response = await api.get(`/chat/sessions/${sessionId}`);
       setChat(response.data);
     } catch (err) {
       console.error(err);
       addToast("Gagal mengambil percakapan.", "error");
       router.push("/chat");
     } finally {
       setIsLoading(false);
     }
   };
 
   const handleSendMessage = async (e?: React.FormEvent) => {
     e?.preventDefault();
     if (!message.trim() || isSending) return;
 
     const userMsgText = message;
     setMessage("");
     setIsSending(true);
 
     // Optimistic update
     const tempId = Math.random().toString();
     setChat(prev => prev ? {
       ...prev,
       messages: [...prev.messages, {
         id: tempId,
         role: "user",
         content: userMsgText,
         created_at: new Date().toISOString()
       }]
     } : null);
 
     try {
       const response = await api.post(`/chat/sessions/${sessionId}/messages`, {
         message: userMsgText
       });
       
       setChat(prev => prev ? {
         ...prev,
         messages: prev.messages.map(m => m.id === tempId ? { ...response.data, id: response.data.id } : m)
       } : null);
     } catch (err) {
       console.error(err);
       addToast("Gagal mengirim pesan.", "error");
       // Remove failed message or mark as error
       setChat(prev => prev ? {
         ...prev,
         messages: prev.messages.filter(m => m.id !== tempId)
       } : null);
     } finally {
       setIsSending(false);
     }
   };
 
   if (isLoading) {
     return (
       <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-[#FDFEFF]">
         <motion.div 
           animate={{ scale: [1, 1.1, 1], rotate: [0, 360] }}
           transition={{ duration: 2, repeat: Infinity }}
           className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center mb-8"
         >
           <Bot size={32} className="text-primary" />
         </motion.div>
         <p className="text-neutral-800 font-black text-lg">Sobi sedang bersiap...</p>
       </div>
     );
   }
 
   return (
     <div className="flex flex-col h-screen bg-[#FDFEFF] relative overflow-hidden">
       {/* Premium Header */}
       <header className="bg-white/70 backdrop-blur-xl px-6 pt-12 pb-4 border-b-4 border-white sticky top-0 z-20 shadow-xl shadow-primary/5 flex items-center gap-4">
         <motion.button
           whileHover={{ scale: 1.1 }}
           whileTap={{ scale: 0.9 }}
           onClick={() => router.push("/chat")}
           className="w-10 h-10 bg-white rounded-xl shadow-lg shadow-black/5 flex items-center justify-center border border-gray-100 text-neutral-800"
         >
           <ChevronLeft size={20} strokeWidth={3} />
         </motion.button>
         
         <div className="flex-1 min-w-0">
           <h1 className="text-sm font-black text-neutral-800 truncate pr-4">
             {chat?.session.title || "Obrolan dengan Sobi"}
           </h1>
           <p className="text-[10px] font-black text-primary uppercase tracking-widest">
             Siswa {chat?.session.level} • Sobi Online
           </p>
         </div>
 
         <button className="w-10 h-10 bg-white rounded-xl shadow-lg shadow-black/5 flex items-center justify-center border border-gray-100 text-neutral-300">
           <MoreVertical size={20} />
         </button>
       </header>
 
       {/* Chat Area */}
       <div 
         ref={scrollRef}
         className="flex-1 overflow-y-auto px-6 py-10 space-y-8 scroll-smooth"
       >
         <AnimatePresence initial={false}>
           {chat?.messages.map((msg, idx) => (
             <motion.div
               key={msg.id}
               initial={{ opacity: 0, y: 10, scale: 0.95 }}
               animate={{ opacity: 1, y: 0, scale: 1 }}
               className={cn(
                 "flex w-full",
                 msg.role === "user" ? "justify-end" : "justify-start"
               )}
             >
               <div className={cn(
                 "flex gap-3 max-w-[85%]",
                 msg.role === "user" ? "flex-row-reverse" : "flex-row"
               )}>
                 <div className={cn(
                   "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-lg",
                   msg.role === "user" ? "bg-secondary text-white" : "bg-primary text-white"
                 )}>
                   {msg.role === "user" ? <User size={16} /> : <Bot size={16} />}
                 </div>
                 
                 <div className={cn(
                   "p-4 rounded-[1.8rem] text-sm font-medium leading-relaxed shadow-xl shadow-primary/5 border-2",
                   msg.role === "user" 
                     ? "bg-white border-secondary/10 text-neutral-800 rounded-tr-none" 
                     : "bg-primary/5 border-primary/10 text-neutral-800 rounded-tl-none"
                 )}>
                   {msg.content}
                   <p className={cn(
                     "text-[8px] font-black uppercase tracking-widest mt-2",
                     msg.role === "user" ? "text-secondary/40 text-right" : "text-primary/40"
                   )}>
                     {format(new Date(msg.created_at), "HH:mm", { locale: idLocale })}
                   </p>
                 </div>
               </div>
             </motion.div>
           ))}
           
           {isSending && (
             <motion.div
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               className="flex justify-start"
             >
               <div className="flex gap-3">
                 <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center shadow-lg">
                   <Bot size={16} />
                 </div>
                 <div className="bg-primary/5 border-2 border-primary/10 p-4 rounded-[1.8rem] rounded-tl-none flex gap-1 items-center">
                   <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.5 }} className="w-1.5 h-1.5 bg-primary rounded-full" />
                   <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }} className="w-1.5 h-1.5 bg-primary rounded-full" />
                   <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }} className="w-1.5 h-1.5 bg-primary rounded-full" />
                 </div>
               </div>
             </motion.div>
           )}
         </AnimatePresence>
       </div>
 
       {/* Input Area */}
       <div className="p-6 bg-white/70 backdrop-blur-xl border-t-4 border-white shadow-2xl shadow-primary/20">
         <form 
           onSubmit={handleSendMessage}
           className="relative flex items-center gap-3"
         >
           <div className="relative flex-1 group">
             <input
               value={message}
               onChange={(e) => setMessage(e.target.value)}
               placeholder="Tanya Sobi apa saja..."
               className="w-full bg-gray-50/50 border-2 border-transparent rounded-[2rem] p-5 pr-14 text-sm font-medium focus:outline-none focus:bg-white focus:border-primary/20 focus:ring-4 focus:ring-primary/5 transition-all"
             />
             <div className="absolute right-4 top-1/2 -translate-y-1/2 text-primary/30">
               <Sparkles size={20} />
             </div>
           </div>
           
           <motion.button
             whileHover={{ scale: 1.05 }}
             whileTap={{ scale: 0.95 }}
             type="submit"
             disabled={!message.trim() || isSending}
             className="w-14 h-14 bg-primary rounded-full flex items-center justify-center text-white shadow-2xl shadow-primary/30 disabled:opacity-50 transition-all shrink-0"
           >
             <Send size={24} strokeWidth={2.5} className="ml-1" />
           </motion.button>
         </form>
       </div>
 
       {/* Background Decoration */}
       <div className="fixed top-1/2 -right-20 w-80 h-80 bg-primary/5 rounded-full blur-[100px] pointer-events-none -z-10" />
     </div>
   );
 }
