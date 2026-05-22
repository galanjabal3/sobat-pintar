export type AIQuotaFeature = "chat" | "explain" | "summary" | "practice" | "schedule";
export const AI_QUOTA_UPDATED_EVENT = "ai-quota-updated";

export interface AIQuotaFeatureStatus {
  feature: AIQuotaFeature;
  used: number;
  limit: number;
  remaining: number;
}

export interface AIQuotaResponse {
  date: string;
  quotas: AIQuotaFeatureStatus[];
}

export const AI_QUOTA_LABELS: Record<AIQuotaFeature, string> = {
  chat: "Chat Sobi",
  explain: "Jelasin Sobi",
  summary: "Rangkum Sobi",
  practice: "Latihan Soal",
  schedule: "Jadwal Belajar",
};

export function notifyAIQuotaUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(AI_QUOTA_UPDATED_EVENT));
}
