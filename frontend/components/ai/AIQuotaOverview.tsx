"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BookOpen, CalendarDays, ChevronRight, MessageCircle, PenLine, Sparkles, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import api from "@/lib/api";
import {
  AI_QUOTA_LABELS,
  AI_QUOTA_UPDATED_EVENT,
  AIQuotaFeature,
  AIQuotaFeatureStatus,
  AIQuotaResponse,
} from "@/lib/aiQuota";
import { cn } from "@/lib/utils";

const FEATURE_ORDER: AIQuotaFeature[] = ["chat", "explain", "summary", "practice", "schedule"];

const FEATURE_ICON: Record<AIQuotaFeature, typeof MessageCircle> = {
  chat: MessageCircle,
  explain: PenLine,
  summary: BookOpen,
  practice: Sparkles,
  schedule: CalendarDays,
};

function getQuotaStatus(quota: AIQuotaFeatureStatus) {
  if (quota.remaining <= 0) return { label: "Habis hari ini", className: "text-error" };
  if (quota.remaining <= Math.max(1, Math.floor(quota.limit * 0.3))) {
    return { label: "Hampir habis", className: "text-secondary" };
  }
  return { label: "Masih tersedia", className: "text-primary" };
}

export function AIQuotaOverview() {
  const [quotas, setQuotas] = useState<AIQuotaFeatureStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  const fetchQuota = useCallback(() => {
    let mounted = true;

    api
      .get("/ai/usage")
      .then((response: { data?: AIQuotaResponse }) => {
        if (mounted) setQuotas(response.data?.quotas || []);
      })
      .catch(() => {
        if (mounted) setQuotas([]);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    return fetchQuota();
  }, [fetchQuota]);

  useEffect(() => {
    const handleQuotaUpdate = () => {
      fetchQuota();
    };

    window.addEventListener(AI_QUOTA_UPDATED_EVENT, handleQuotaUpdate);
    return () => window.removeEventListener(AI_QUOTA_UPDATED_EVENT, handleQuotaUpdate);
  }, [fetchQuota]);

  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  const quotaByFeature = useMemo(() => {
    return new Map(quotas.map((quota) => [quota.feature, quota]));
  }, [quotas]);

  const totalRemaining = useMemo(() => quotas.reduce((total, quota) => total + quota.remaining, 0), [quotas]);
  const totalLimit = useMemo(() => quotas.reduce((total, quota) => total + quota.limit, 0), [quotas]);
  const exhaustedCount = useMemo(() => quotas.filter((quota) => quota.remaining <= 0).length, [quotas]);

  return (
    <section className="mb-10">
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full rounded-[2rem] border-4 border-white bg-white/70 p-5 text-left shadow-xl shadow-primary/5 transition-all hover:border-primary/10 hover:shadow-2xl hover:shadow-primary/10"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Sparkles size={22} strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-widest text-primary">Kuota AI</p>
              <h3 className="text-sm font-black text-neutral-800">
                {isLoading ? "Memuat kuota..." : `Sisa ${totalRemaining}/${totalLimit}`}
              </h3>
              {!isLoading && (
                <p className="mt-1 text-[10px] font-bold text-neutral-400">
                  {exhaustedCount > 0 ? `${exhaustedCount} fitur habis hari ini` : "Semua fitur masih bisa dipakai"}
                </p>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 text-primary">
            <span className="hidden text-[10px] font-black uppercase tracking-widest min-[390px]:inline">Detail</span>
            <ChevronRight size={18} strokeWidth={3} />
          </div>
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, y: 32, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 32, scale: 0.98 }}
              className="relative max-h-[85dvh] w-full max-w-md overflow-hidden rounded-t-[2.5rem] border-4 border-white bg-white shadow-2xl sm:rounded-[2.5rem]"
            >
              <div className="flex items-center justify-between border-b border-primary/5 p-6">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary">Kuota AI</p>
                  <h3 className="text-lg font-black text-neutral-800">Sisa Hari Ini</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gray-50 text-neutral-500"
                  aria-label="Tutup detail kuota AI"
                >
                  <X size={18} strokeWidth={3} />
                </button>
              </div>

              <div className="max-h-[calc(85dvh-96px)] overflow-y-auto p-5">
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((item) => (
                      <div key={item} className="h-20 animate-pulse rounded-2xl bg-gray-100" />
                    ))}
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {FEATURE_ORDER.map((feature) => {
                      const quota = quotaByFeature.get(feature);
                      if (!quota) return null;

                      const Icon = FEATURE_ICON[feature];
                      const percent = quota.limit > 0 ? Math.min(100, Math.max(0, (quota.remaining / quota.limit) * 100)) : 0;
                      const status = getQuotaStatus(quota);

                      return (
                        <div key={feature} className="rounded-2xl border border-primary/5 bg-white p-4 shadow-sm">
                          <div className="mb-3 flex items-center justify-between gap-4">
                            <div className="flex min-w-0 items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                <Icon size={18} strokeWidth={2.5} />
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-black text-neutral-800">{AI_QUOTA_LABELS[feature]}</p>
                                <p className={cn("text-[10px] font-black uppercase tracking-widest", status.className)}>
                                  {status.label}
                                </p>
                              </div>
                            </div>
                            <p className="shrink-0 text-sm font-black text-neutral-800">
                              {quota.remaining}/{quota.limit}
                            </p>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                            <div
                              className={cn("h-full rounded-full", quota.remaining <= 0 ? "bg-error" : "bg-primary")}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
