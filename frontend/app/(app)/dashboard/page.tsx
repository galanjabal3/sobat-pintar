"use client";
 
 import React from "react";
 import Link from "next/link";
 import { Camera, BookOpen, MessageCircle, FileText, Flame, CheckCircle2, Sparkles, Trophy, Zap } from "lucide-react";
 import { useAuthStore } from "@/store/authStore";
 import { cn } from "@/lib/utils";
 import { motion } from "framer-motion";
 import Image from "next/image";
 
 export default function DashboardPage() {
   const { user, fetchProfile } = useAuthStore();
 
   React.useEffect(() => {
     fetchProfile();
   }, []);
 
   const showAll = process.env.NEXT_PUBLIC_DEBUG_MODE === "true";
 
   const features = [
     {
       title: "Jelasin Soal",
       desc: "Foto & tanya soal sulit",
       icon: Camera,
       color: "bg-[#E6F9F3]", // Soft Teal
       iconColor: "text-primary",
       href: "/explain",
       enabled: true,
     },
     {
       title: "Latihan Soal",
       desc: "Uji kemampuanmu",
       icon: BookOpen,
       color: "bg-[#EEF2FF]", // Soft Indigo
       iconColor: "text-blue-500",
       href: "/practice",
       enabled: true,
     },
     {
       title: "Tanya Sobi",
       desc: "Chat seru bareng AI",
       icon: MessageCircle,
       color: "bg-[#FFFBEB]", // Soft Amber
       iconColor: "text-secondary",
       href: "/chat",
       enabled: true,
     },
     {
       title: "Rangkuman",
       desc: "Buat ringkasan cepat",
       icon: FileText,
       color: "bg-[#FFF7ED]", // Soft Orange
       iconColor: "text-orange-500",
       href: "/summary",
       enabled: true,
     },
   ].filter(f => f.enabled || showAll);
 
   const containerVariants = {
     hidden: { opacity: 0 },
     visible: {
       opacity: 1,
       transition: {
         staggerChildren: 0.1
       }
     }
   };
 
   const itemVariants = {
     hidden: { y: 20, opacity: 0 },
     visible: { y: 0, opacity: 1 }
   };
 
   return (
     <div className="min-h-screen bg-[#FDFEFF] relative overflow-hidden">
       {/* Premium Background Mesh */}
       <div className="absolute top-0 left-0 w-full h-[400px] bg-gradient-to-b from-primary/5 to-transparent -z-10" />
       <div className="absolute -top-24 -right-24 w-64 h-64 bg-secondary/10 rounded-full blur-[100px] -z-10" />
       <div className="absolute top-1/4 -left-24 w-48 h-48 bg-primary/10 rounded-full blur-[80px] -z-10" />
 
       <div className="px-6 pt-12 pb-36 max-w-2xl mx-auto">
         <motion.header 
           initial={{ opacity: 0, y: -20 }}
           animate={{ opacity: 1, y: 0 }}
           className="flex justify-between items-center mb-10"
         >
           <div className="flex items-center gap-4">
             <div className="relative group">
               <div className="w-12 h-12 bg-white rounded-2xl shadow-xl shadow-primary/10 flex items-center justify-center border border-primary/5 overflow-hidden transition-transform group-hover:scale-110">
                 <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary font-black text-lg">
                   {user?.name?.[0] || "S"}
                 </div>
               </div>
               <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-4 border-white rounded-full" />
             </div>
             <div>
               <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-0.5">Sobat Pintar</p>
               <h1 className="text-xl font-black text-neutral-800 leading-tight">
                 Halo, {user?.name?.split(' ')[0] || "Sobat"}! <span className="inline-block animate-bounce">👋</span>
               </h1>
             </div>
           </div>
           
           <div className="flex items-center gap-2">
             <motion.div 
               whileHover={{ scale: 1.05 }}
               className="bg-white border-2 border-primary/5 p-1.5 px-4 rounded-2xl flex items-center gap-2 shadow-xl shadow-primary/5"
             >
               <Flame size={18} className="text-secondary fill-secondary" />
               <span className="text-sm font-black text-neutral-800">{user?.streak || 0}</span>
             </motion.div>
 
             <motion.div 
               whileHover={{ scale: 1.05 }}
               className="bg-white border-2 border-primary/5 p-1.5 px-4 rounded-2xl flex items-center gap-2 shadow-xl shadow-primary/5"
             >
               <Zap size={18} className="text-primary fill-primary" />
               <span className="text-sm font-black text-neutral-800">{user?.points || 0}</span>
             </motion.div>
           </div>
         </motion.header>
 
         <motion.div 
           initial={{ opacity: 0, x: -20 }}
           animate={{ opacity: 1, x: 0 }}
           transition={{ delay: 0.2 }}
           className="mb-10"
         >
           <h2 className="text-3xl font-black text-neutral-800 leading-tight">
             Mau belajar <br />
             <span className="text-primary relative">
               apa hari ini?
               <motion.div 
                 initial={{ width: 0 }}
                 animate={{ width: "100%" }}
                 transition={{ delay: 0.5, duration: 0.8 }}
                 className="absolute -bottom-2 left-0 h-2 bg-secondary/30 rounded-full -z-10" 
               />
             </span>
           </h2>
         </motion.div>
 
         {/* Progress Card Upgrade */}
         <motion.div 
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ delay: 0.3 }}
           whileHover={{ y: -5 }}
           className="bg-white/70 backdrop-blur-2xl border-2 border-white p-8 rounded-[3rem] mb-10 relative overflow-hidden shadow-2xl shadow-primary/5"
         >
           <div className="relative z-10">
             <div className="flex items-center gap-2 mb-4">
               <Trophy size={16} className="text-secondary" />
               <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Progress Hari Ini</p>
             </div>
             <h3 className="text-3xl font-black text-neutral-800 leading-tight mb-2">
               5 Soal <br /> <span className="text-primary">Selesai</span>
             </h3>
             <p className="text-[10px] font-bold text-neutral-400">Wah, hebat! Teruskan belajarnya ya!</p>
           </div>
           
           <div className="absolute top-1/2 right-8 -translate-y-1/2">
             <div className="relative">
               <motion.div 
                 animate={{ rotate: 360 }}
                 transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                 className="absolute inset-0 border-4 border-dashed border-primary/20 rounded-full"
               />
               <div className="w-20 h-20 rounded-full bg-primary/5 flex items-center justify-center relative z-10 border-4 border-white shadow-xl">
                 <CheckCircle2 size={40} className="text-primary" strokeWidth={2.5} />
               </div>
             </div>
           </div>
 
           {/* Decorative Sparkle */}
           <div className="absolute top-4 right-4 text-secondary/20">
             <Sparkles size={40} />
           </div>
         </motion.div>
 
         {/* Feature Grid Upgrade */}
         <motion.div 
           variants={containerVariants}
           initial="hidden"
           animate="visible"
           className="grid grid-cols-2 gap-5"
         >
           {features.map((feature, idx) => {
             const Icon = feature.icon;
             return (
               <motion.div key={feature.title} variants={itemVariants}>
                 <Link
                   href={feature.href}
                   className={cn(
                     "group p-6 rounded-[2.5rem] flex flex-col gap-5 transition-all duration-300 hover:scale-[1.05] active:scale-95 border-4 border-white shadow-xl shadow-primary/5 relative overflow-hidden",
                     feature.color
                   )}
                 >
                   <div className={cn("p-4 rounded-2xl w-fit shadow-lg shadow-black/5 transition-transform group-hover:rotate-12", "bg-white")}>
                     <Icon size={24} strokeWidth={3} className={feature.iconColor} />
                   </div>
                   <div>
                     <h3 className="font-black text-sm text-neutral-800 mb-1">{feature.title}</h3>
                     <p className="text-[10px] text-neutral-500 font-bold leading-relaxed opacity-80">{feature.desc}</p>
                   </div>
                   
                   {/* Subtle light effect on hover */}
                   <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity pointer-events-none" />
                 </Link>
               </motion.div>
             );
           })}
         </motion.div>
       </div>
 
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
         className="fixed -bottom-10 -right-10 w-48 h-48 pointer-events-none opacity-20 grayscale blur-[2px] -z-10"
       >
         <Image
           src="https://res.cloudinary.com/dzzflhq79/image/upload/v1778706261/image_tyr7o1.png"
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
