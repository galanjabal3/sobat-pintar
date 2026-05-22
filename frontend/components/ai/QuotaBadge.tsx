"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import { AI_QUOTA_LABELS, AI_QUOTA_UPDATED_EVENT, AIQuotaFeature, AIQuotaResponse, AIQuotaFeatureStatus } from "@/lib/aiQuota";

interface QuotaBadgeProps {
  feature: AIQuotaFeature;
  className?: string;
}

export function QuotaBadge({ feature, className }: QuotaBadgeProps) {
  const [quota, setQuota] = useState<AIQuotaFeatureStatus | null>(null);

  const fetchQuota = useCallback(() => {
    let mounted = true;

    api.get("/ai/usage")
      .then((response: { data?: AIQuotaResponse }) => {
        const current = response.data?.quotas?.find((item) => item.feature === feature) || null;
        if (mounted) {
          setQuota(current);
        }
      })
      .catch(() => {
        if (mounted) {
          setQuota(null);
        }
      });

    return () => {
      mounted = false;
    };
  }, [feature]);

  useEffect(() => {
    return fetchQuota();
  }, [fetchQuota]);

  useEffect(() => {
    const handleQuotaUpdate = () => {
      fetchQuota();
    };

    window.addEventListener(AI_QUOTA_UPDATED_EVENT, handleQuotaUpdate);
    return () => {
      window.removeEventListener(AI_QUOTA_UPDATED_EVENT, handleQuotaUpdate);
    };
  }, [fetchQuota]);

  const label = useMemo(() => AI_QUOTA_LABELS[feature], [feature]);

  if (!quota) return null;

  return (
    <div
      className={[
        "flex items-center justify-between rounded-2xl border border-primary/10 bg-primary/5 px-4 py-3 text-[11px] font-bold text-neutral-600",
        className || "",
      ].join(" ")}
    >
      <span>{label}</span>
      <span className="text-primary">
        Sisa hari ini {quota.remaining}/{quota.limit}
      </span>
    </div>
  );
}
