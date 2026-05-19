"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Plus, Sparkles, Clock, Trash2, ArrowRight, Flame } from "lucide-react";
import api from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToastStore } from "@/store/toastStore";
import { useAuthStore } from "@/store/authStore";
import Image from "next/image";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Modal } from "@/components/ui/Modal";
import { SOBI_ASSETS } from "@/lib/assets";

interface ChatSession {
  id: string;
  title: string;
  last_message: string;
  updated_at: string;
}

export default function ChatPage() {
  const router = useRouter();
  const { user, fetchProfile } = useAuthStore();
  const { addToast } = useToastStore();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const response = await api.get("/chat/sessions");
      setSessions(response.data || []);
    } catch (err) {
      console.error(err);
      addToast("Gagal mengambil riwayat chat.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSession = async () => {
    setIsCreating(true);
    try {
      const response = await api.post("/chat/sessions", {
        title: "Obrolan Baru dengan Sobi",
        level: user?.level || "SD",
      });
      router.push(`/chat/session/${response.data.id}`);
    } catch (err) {
      console.error(err);
      addToast("Gagal membuat obrolan baru.", "error");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteSession = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    setDeleteId(sessionId);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    
    try {
      await api.delete(`/chat/sessions/${deleteId}`);
      setSessions(sessions.filter(s => s.id !== deleteId));
      addToast("Obrolan berhasil dihapus.", "success");
    } catch (err) {
      console.error(err);
      addToast("Gagal menghapus obrolan.", "error");
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFEFF] relative overflow-hidden">
      {/* Premium Background Mesh */}
      <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-primary/5 to-transparent -z-10" />
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-secondary/10 rounded-full blur-[100px] -z-10" />

      <div className="px-6 pt-12 pb-36 max-w-2xl mx-auto">
        <motion.header 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-10"
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
              <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-0.5">Teman Belajarmu</p>
              <h1 className="text-xl font-black text-neutral-800">Tanya Sobi</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
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

             <motion.button
               whileHover={{ scale: 1.05 }}
               whileTap={{ scale: 0.95 }}
               onClick={handleCreateSession}
               disabled={isCreating}
               className="w-12 h-12 bg-primary rounded-2xl shadow-xl shadow-primary/20 flex items-center justify-center text-white relative overflow-hidden"
             >
             {isCreating ? (
               <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
             ) : (
               <Plus size={24} strokeWidth={3} />
             )}
           </motion.button>
          </div>
         </motion.header>

        {/* Featured Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white/70 backdrop-blur-2xl border-4 border-white p-8 rounded-[3rem] mb-10 relative overflow-hidden shadow-2xl shadow-primary/5"
        >
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={16} className="text-secondary" />
              <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Tips Belajar</p>
            </div>
            <h3 className="text-2xl font-black text-neutral-800 leading-tight mb-3">
              Tanya apa saja <br /> tentang <span className="text-primary">pelajaranmu!</span>
            </h3>
            <p className="text-[11px] text-neutral-500 font-bold leading-relaxed max-w-[200px]">
              Sobi siap membantu menjelaskan konsep yang bikin kamu bingung.
            </p>
            
            <motion.button
              whileHover={{ x: 5 }}
              onClick={handleCreateSession}
              className="mt-6 flex items-center gap-2 text-primary font-black text-xs uppercase tracking-widest"
            >
              Mulai Chat Baru <ArrowRight size={14} />
            </motion.button>
          </div>
          
          <div className="absolute -bottom-2 -right-4 w-40 h-40 transition-all pointer-events-none drop-shadow-2xl">
            <Image
              src={SOBI_ASSETS.WAVING}
              alt="Sobi Mascot"
              fill
              className="object-contain"
              priority
              sizes="160px"
            />
          </div>
        </motion.div>

        {/* Sessions List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xs font-black text-neutral-400 uppercase tracking-widest flex items-center gap-2">
              <Clock size={14} /> Riwayat Obrolan
            </h2>
            <span className="text-[10px] font-black text-primary bg-primary/10 px-3 py-1 rounded-full">
              {sessions.length} Sesi
            </span>
          </div>

          <AnimatePresence mode="popLayout">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-24 bg-gray-100 rounded-[2rem] animate-pulse" />
                ))}
              </div>
            ) : sessions.length > 0 ? (
              sessions.map((session, idx) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  layout
                  onClick={() => router.push(`/chat/session/${session.id}`)}
                  className="bg-white border-2 border-primary/5 p-6 rounded-[2.5rem] shadow-xl shadow-primary/5 hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/10 transition-all cursor-pointer group relative"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-black text-neutral-800 text-sm group-hover:text-primary transition-colors line-clamp-1 pr-10">
                      {session.title || "Obrolan Tanpa Judul"}
                    </h4>
                    <button
                      onClick={(e) => handleDeleteSession(e, session.id)}
                      className="p-2 text-neutral-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <p className="text-xs text-neutral-400 font-medium line-clamp-1 mb-4">
                    {session.last_message || "Belum ada pesan."}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                      <span className="text-[10px] font-black text-neutral-300 uppercase tracking-wider">
                        {format(new Date(session.updated_at), "d MMM yyyy", { locale: idLocale })}
                      </span>
                    </div>
                    <div className="w-8 h-8 bg-gray-50 rounded-xl flex items-center justify-center text-neutral-300 group-hover:bg-primary group-hover:text-white transition-all">
                      <ArrowRight size={14} strokeWidth={3} />
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="py-10">
                <EmptyState 
                  title="Belum Ada Obrolan"
                  description="Ayo mulai sesi chat barumu dan tanya Sobi sekarang!"
                  actionLabel="Mulai Chat Baru"
                  onAction={handleCreateSession}
                />
              </div>

            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Background Decoration */}
      <div className="fixed -bottom-20 -left-20 w-64 h-64 bg-secondary/5 rounded-full blur-[80px] pointer-events-none -z-10" />

      <Modal 
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Hapus Obrolan?"
        description="Obrolan yang dihapus tidak bisa dikembalikan lagi. Kamu yakin ingin menghapusnya?"
        confirmText="Ya, Hapus"
        cancelText="Batal"
        variant="danger"
      />
    </div>
  );
}
