"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Trophy, Medal, Crown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { EmptyState } from "@/components/ui/EmptyState";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { SOBI_ASSETS } from "@/lib/assets";

interface LeaderboardEntry {
  user_name: string;
  avatar_url?: string | null;
  points: number;
}

interface LeaderboardPayload {
  entries: LeaderboardEntry[];
}

function LeaderboardAvatar({
  entry,
  size,
  className,
}: {
  entry: LeaderboardEntry;
  size: number;
  className: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden flex items-center justify-center font-black uppercase",
        className
      )}
    >
      {entry.avatar_url ? (
        <Image
          src={entry.avatar_url}
          alt={`Foto ${entry.user_name}`}
          width={size}
          height={size}
          className="h-full w-full object-cover"
        />
      ) : (
        entry.user_name[0]
      )}
    </div>
  );
}

function rankLabel(rank: number) {
  return `${rank}#`;
}

export default function LeaderboardPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await api.get("/gamification/leaderboard");
        const payload = response.data as LeaderboardEntry[] | LeaderboardPayload;

        if (Array.isArray(payload)) {
          setEntries(payload);
        } else {
          setEntries(payload.entries || []);
        }
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
      
      <div className="px-6 pt-12 pb-28 max-w-2xl mx-auto relative z-10">
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
	            aria-label="Kembali ke dashboard"
          >
            <ChevronLeft size={24} strokeWidth={2.5} />
          </motion.button>
          <div>
            <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-0.5">Kompetisi Sehat</p>
            <h1 className="text-xl font-black text-neutral-800">Papan Peringkat</h1>
          </div>
        </motion.header>

        {/* Podium Section */}
        <div className="relative mb-10">
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-primary opacity-10 pointer-events-none">
            <Trophy size={120} />
          </div>

          <div className="grid grid-cols-3 items-end gap-2 sm:gap-3 pt-16">
            {/* Rank 2 */}
            {topThree[1] && (
              <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="flex flex-col items-center"
              >
                <div className="mb-3 flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-slate-500">
                  {rankLabel(2)} <Medal size={11} />
                </div>
                <div className="relative mb-3">
                  <LeaderboardAvatar
                    entry={topThree[1]}
                    size={56}
                    className="w-14 h-14 bg-gray-100 rounded-2xl border-4 border-white shadow-lg text-neutral-400 text-xl"
                  />
                </div>
                <div className="w-full bg-white/80 backdrop-blur-md border-2 border-white min-h-28 rounded-t-[1.8rem] shadow-xl flex flex-col items-center justify-center px-2 py-4">
                  <p className="text-[10px] font-black text-neutral-800 truncate w-full text-center">{topThree[1].user_name}</p>
                  <p className="text-[10px] font-black text-slate-400 mt-1">{topThree[1].points} XP</p>
                </div>
              </motion.div>
            )}

            {/* Rank 1 */}
            {topThree[0] && (
              <motion.div
                initial={{ opacity: 0, scale: 0.85, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="flex flex-col items-center z-10"
              >
                <motion.div 
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="mb-2 text-secondary"
                >
                  <Crown size={32} fill="currentColor" />
                </motion.div>
                <div className="mb-3 flex items-center gap-1 rounded-full bg-secondary/10 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-secondary">
                  {rankLabel(1)} <Medal size={11} />
                </div>
                <div className="relative mb-3">
                  <LeaderboardAvatar
                    entry={topThree[0]}
                    size={80}
                    className="w-20 h-20 bg-secondary/10 rounded-[2rem] border-4 border-secondary shadow-2xl shadow-secondary/20 text-secondary text-3xl"
                  />
                </div>
                <div className="w-full bg-white backdrop-blur-md border-4 border-white min-h-36 rounded-t-[2rem] shadow-2xl flex flex-col items-center justify-center px-3 py-5">
                  <p className="text-sm font-black text-neutral-800 truncate w-full text-center">{topThree[0].user_name}</p>
                  <p className="text-[10px] font-black text-secondary mt-1">{topThree[0].points} XP</p>
                </div>
              </motion.div>
            )}

            {/* Rank 3 */}
            {topThree[2] && (
              <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="flex flex-col items-center"
              >
                <div className="mb-3 flex items-center gap-1 rounded-full bg-orange-50 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-orange-400">
                  {rankLabel(3)} <Medal size={11} />
                </div>
                <div className="relative mb-3">
                  <LeaderboardAvatar
                    entry={topThree[2]}
                    size={56}
                    className="w-14 h-14 bg-orange-50 rounded-2xl border-4 border-white shadow-lg text-orange-400 text-xl"
                  />
                </div>
                <div className="w-full bg-white/80 backdrop-blur-md border-2 border-white min-h-28 rounded-t-[1.8rem] shadow-xl flex flex-col items-center justify-center px-2 py-4">
                  <p className="text-[10px] font-black text-neutral-800 truncate w-full text-center">{topThree[2].user_name}</p>
                  <p className="text-[10px] font-black text-primary mt-1">{topThree[2].points} XP</p>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* List Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest flex items-center gap-2">
              Peringkat Lainnya
            </h2>
            <span className="text-[9px] font-black text-neutral-300 uppercase tracking-widest">Diperbarui otomatis</span>
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
                      <LeaderboardAvatar
                        entry={entry}
                        size={40}
                        className="w-10 h-10 bg-gray-50 rounded-xl text-neutral-400 text-xs"
                      />
                      <div>
                        <p className="text-sm font-black text-neutral-800">{entry.user_name}</p>
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

        {/* Background Decoration */}
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-secondary/5 blur-[100px] z-0" />

      </div>
    </div>
  );
}
