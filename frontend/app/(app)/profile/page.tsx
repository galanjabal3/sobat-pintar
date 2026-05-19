"use client";

import React from "react";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { User, Mail, School, Zap, LogOut, ChevronRight, Settings, ShieldCheck, HelpCircle, ChevronLeft } from "lucide-react";
import Image from "next/image";
import { SOBI_ASSETS } from "@/lib/assets";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const { user, logout, fetchProfile } = useAuthStore();
  const router = useRouter();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = React.useState(false);

  React.useEffect(() => {
    fetchProfile();
  }, []);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-[#FDFEFF] relative overflow-hidden">
      {/* Premium Background Mesh */}
      <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-primary/5 to-transparent -z-10" />
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 rounded-full blur-[100px] -z-10" />

      <div className="px-6 pt-12 pb-36 max-w-2xl mx-auto">
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => router.push("/dashboard")}
          className="w-12 h-12 bg-white rounded-2xl shadow-xl shadow-primary/5 flex items-center justify-center border border-primary/5 text-neutral-800 mb-8"
          aria-label="Kembali ke beranda"
        >
          <ChevronLeft size={24} strokeWidth={2.5} />
        </motion.button>

        {/* Profile Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center mb-12"
        >
          <div className="relative mb-6">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="w-28 h-28 bg-[#E6F9F3] rounded-full shadow-2xl shadow-primary/20 flex items-center justify-center border-4 border-white overflow-hidden relative"
            >
              <div className="w-full h-full flex items-center justify-center text-primary text-4xl font-black">
                {user?.name?.[0] || "U"}
              </div>
            </motion.div>
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3 }}
              className="absolute -bottom-2 -right-2 w-10 h-10 bg-secondary rounded-full flex items-center justify-center border-4 border-white shadow-lg text-white"
            >
              <Zap size={18} fill="currentColor" strokeWidth={0} />
            </motion.div>
          </div>
          
          <h2 className="text-2xl font-black text-neutral-800 mb-1">{user?.name}</h2>
          <div className="flex items-center gap-2 text-neutral-400 font-bold text-xs uppercase tracking-widest">
            <Mail size={12} />
            {user?.email}
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-10">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/70 backdrop-blur-xl border-4 border-white p-5 rounded-[2rem] shadow-xl shadow-primary/5"
          >
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-3">
              <School size={20} strokeWidth={2.5} />
            </div>
            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Jenjang</p>
            <p className="text-lg font-black text-neutral-800">{user?.level || "SD"}</p>
          </motion.div>

          <Link href="/leaderboard">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/70 backdrop-blur-xl border-4 border-white p-5 rounded-[2rem] shadow-xl shadow-primary/5 cursor-pointer hover:shadow-2xl hover:shadow-secondary/10 transition-all"
            >
              <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center text-secondary mb-3">
                <Zap size={20} strokeWidth={2.5} />
              </div>
              <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Poin Sobi</p>
              <p className="text-lg font-black text-neutral-800">{user?.points || 0}</p>
            </motion.div>
          </Link>
        </div>

        {/* Menu List */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-3 mb-10"
        >
          <p className="px-4 text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-4">Pengaturan Akun</p>
          
          {[
            { icon: User, label: "Edit Profil", color: "text-blue-500", bg: "bg-blue-50" },
            { icon: ShieldCheck, label: "Keamanan", color: "text-green-500", bg: "bg-green-50" },
            { icon: HelpCircle, label: "Bantuan & Dukungan", color: "text-purple-500", bg: "bg-purple-50" },
            { icon: Settings, label: "Pengaturan App", color: "text-gray-500", bg: "bg-gray-50" },
          ].map((item, idx) => (
            <button 
              key={item.label}
              className="w-full bg-white border-2 border-primary/5 p-5 rounded-[1.8rem] flex items-center justify-between group hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", item.bg, item.color)}>
                  <item.icon size={20} strokeWidth={2.5} />
                </div>
                <span className="font-black text-sm text-neutral-800">{item.label}</span>
              </div>
              <ChevronRight size={18} className="text-neutral-300 group-hover:text-primary transition-colors" />
            </button>
          ))}
        </motion.div>

        {/* Logout Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Button 
            variant="outline" 
            className="w-full py-6 h-auto text-sm rounded-[2rem] border-2 border-red-100 font-black text-red-500 hover:bg-red-50 hover:border-red-200 transition-all shadow-xl shadow-red-500/5" 
            onClick={() => setIsLogoutModalOpen(true)}
          >
            <LogOut size={18} className="mr-3" />
            Keluar dari Akun
          </Button>
        </motion.div>
      </div>

      <Modal 
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleLogout}
        title="Keluar dari Akun?"
        description="Kamu harus login kembali nanti untuk mengakses data belajarmu bersama Sobi."
        confirmText="Ya, Keluar"
        cancelText="Tetap Masuk"
        variant="logout"
      />

      {/* Background Decoration */}
      <div className="fixed -bottom-20 -left-20 w-64 h-64 bg-primary/5 rounded-full blur-[80px] pointer-events-none -z-10" />
      
      {/* Floating Mascot Sobi Background */}
      <motion.div 
        animate={{ 
          y: [0, -15, 0],
          rotate: [0, 5, 0]
        }}
        transition={{ 
          duration: 5, 
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="fixed bottom-24 -right-8 w-48 h-48 pointer-events-none opacity-20 grayscale blur-[2px] z-0"
      >
        <Image
          src={SOBI_ASSETS.DEFAULT}
          alt="Sobi BG"
          fill
          className="object-contain"
          priority
          sizes="192px"
        />
      </motion.div>
    </div>
  );
}
