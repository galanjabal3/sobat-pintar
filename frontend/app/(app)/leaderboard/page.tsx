"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Trophy, Medal, Flame, Crown, Star, ArrowUpRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { EmptyState } from "@/components/ui/EmptyState";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { SOBI_ASSETS } from "@/lib/assets";

interface LeaderboardEntry {
  user_name: string;
  points: number;
}

export default function LeaderboardPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await api.get("/gamification/leaderboard");
        setEntries(response.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  const topThree = entries.slice(0, 3);
  const others = entries.slice(3);

  return (
    <div className="min-h-screen bg-[#FDFEFF] relative overflow-hidden">
      {/* Premium Background Mesh */}
      <div className="absolute top-0 left-0 w-full h-[400px] bg-gradient-to-b from-primary/10 to-transparent -z-10" />
      
      <div className="px-6 pt-12 pb-36 max-w-2xl mx-auto relative z-10">
        <motion.header 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-12"
        >
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => router.push("/dashboard")}
            className="w-12 h-12 bg-white rounded-2xl shadow-xl shadow-primary/5 flex items-center justify-center border border-primary/5 text-neutral-800"
          >
            <ChevronLeft size={24} strokeWidth={2.5} />
          </motion.button>
          <div>
            <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-0.5">Kompetisi Sehat</p>
            <h1 className="text-xl font-black text-neutral-800">Papan Peringkat</h1>
          </div>
        </motion.header>

        {/* Podium Section */}
        <div className="flex items-end justify-center gap-2 mb-12 h-[220px] relative">
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-primary opacity-10 pointer-events-none">
            <Trophy size={120} />
          </div>

          {/* Rank 2 */}
          {topThree[1] && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col items-center flex-1"
            >
              <div className="relative mb-4">
                <div className="w-14 h-14 bg-gray-100 rounded-2xl border-4 border-white shadow-lg overflow-hidden flex items-center justify-center text-neutral-400 font-black text-xl">
                  {topThree[1].user_name[0]}
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-slate-300 rounded-full flex items-center justify-center text-white border-2 border-white shadow-sm">
                  <Medal size={12} />
                </div>
              </div>
              <div className="w-full bg-white/50 backdrop-blur-md border-2 border-white h-24 rounded-t-3xl shadow-xl flex flex-col items-center justify-center p-2">
                <p className="text-[10px] font-black text-neutral-800 truncate w-full text-center">{topThree[1].user_name}</p>
                <p className="text-[9px] font-black text-primary mt-1">{topThree[1].points} XP</p>
              </div>
            </motion.div>
          )}

          {/* Rank 1 */}
          {topThree[0] && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="flex flex-col items-center flex-1 z-10"
            >
              <div className="relative mb-4">
                <motion.div 
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute -top-10 left-1/2 -translate-x-1/2 text-secondary"
                >
                  <Crown size={32} fill="currentColor" />
                </motion.div>
                <div className="w-20 h-20 bg-secondary/10 rounded-[2rem] border-4 border-secondary shadow-2xl shadow-secondary/20 overflow-hidden flex items-center justify-center text-secondary font-black text-3xl">
                  {topThree[0].user_name[0]}
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-8 bg-secondary rounded-full flex items-center justify-center text-white border-4 border-white shadow-lg">
                  <Medal size={16} />
                </div>
              </div>
              <div className="w-full bg-white backdrop-blur-md border-4 border-white h-36 rounded-t-[2.5rem] shadow-2xl flex flex-col items-center justify-center p-2">
                <p className="text-xs font-black text-neutral-800 truncate w-full text-center">{topThree[0].user_name}</p>
                <p className="text-[10px] font-black text-secondary mt-1">{topThree[0].points} XP</p>
              </div>
            </motion.div>
          )}

          {/* Rank 3 */}
          {topThree[2] && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col items-center flex-1"
            >
              <div className="relative mb-4">
                <div className="w-14 h-14 bg-orange-50 rounded-2xl border-4 border-white shadow-lg overflow-hidden flex items-center justify-center text-orange-400 font-black text-xl">
                  {topThree[2].user_name[0]}
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-orange-400 rounded-full flex items-center justify-center text-white border-2 border-white shadow-sm">
                  <Medal size={12} />
                </div>
              </div>
              <div className="w-full bg-white/50 backdrop-blur-md border-2 border-white h-20 rounded-t-3xl shadow-xl flex flex-col items-center justify-center p-2">
                <p className="text-[10px] font-black text-neutral-800 truncate w-full text-center">{topThree[2].user_name}</p>
                <p className="text-[9px] font-black text-primary mt-1">{topThree[2].points} XP</p>
              </div>
            </motion.div>
          )}
        </div>

        {/* List Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest flex items-center gap-2">
              Peringkat Lainnya
            </h2>
            <span className="text-[9px] font-black text-neutral-300 uppercase tracking-widest">Update 5m ago</span>
          </div>

          <div className="space-y-3">
            <AnimatePresence>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <div key={i} className="h-20 bg-gray-50 rounded-[1.8rem] animate-pulse" />
                ))
              ) : others.length > 0 ? (
                others.map((entry, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-white border-2 border-white p-5 rounded-[1.8rem] shadow-xl shadow-black/5 flex items-center justify-between group hover:border-primary/20 transition-all"
                  >
                    <div className="flex items-center gap-5">
                      <span className="text-xs font-black text-neutral-300 w-4">{idx + 4}</span>
                      <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-neutral-400 font-black text-xs uppercase">
                        {entry.user_name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-black text-neutral-800">{entry.user_name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Flame size={10} className="text-orange-500 fill-orange-500" />
                          <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Daily Streak</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-primary">{entry.points}</p>
                      <p className="text-[8px] font-black text-neutral-300 uppercase tracking-widest">Total XP</p>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="py-8">
                  <EmptyState 
                    title="Belum Ada Pesaing"
                    description="Jadilah yang pertama untuk memimpin papan peringkat!"
                  />
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Background Decoration */}
      <div className="fixed -bottom-20 -left-20 w-80 h-80 bg-secondary/5 rounded-full blur-[100px] pointer-events-none z-0" />

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
