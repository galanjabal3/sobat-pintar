import { Clock, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

export interface StudySession {
  subject: string;
  duration_minutes: number;
  topic: string;
}

export interface DailySchedule {
  date: string;
  sessions: StudySession[];
}

export interface ScheduleResult {
  id: string;
  title?: string;
  exam_date?: string;
  schedule?: DailySchedule[] | null;
  tips?: string[];
  status?: "processing" | "completed" | "failed";
  error_message?: string;
}

export function ScheduleView({ result }: { result: ScheduleResult }) {
  const schedule = Array.isArray(result.schedule) ? result.schedule : [];
  const tips = Array.isArray(result.tips) ? result.tips : [];

  const formatDayDate = (date: string) => {
    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) return date;
    return format(parsedDate, "EEEE, d MMM yyyy", { locale: idLocale });
  };

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        {schedule.length === 0 ? (
          <div className="rounded-[2rem] border-2 border-dashed border-primary/15 bg-primary/[0.02] p-5 text-center">
            <p className="text-sm font-black text-neutral-800">
              {tips.length > 0 ? "Jadwal belum terbaca" : "Belum ada sesi belajar"}
            </p>
            <p className="mt-1 text-xs font-bold leading-relaxed text-neutral-400">
              {tips.length > 0
                ? "Coba unggah foto jadwal yang lebih jelas atau buat jadwal secara manual."
                : "Tambahkan jadwal baru supaya Sobi bisa menyusun rencana belajarmu."}
            </p>
          </div>
        ) : schedule.map((day, dayIndex) => (
          <div key={`${day.date}-${dayIndex}`} className="rounded-[2rem] bg-primary/5 p-4">
            <div className="mb-3 flex items-center gap-2 text-primary">
              <Clock size={14} />
              <p className="text-[10px] font-black uppercase tracking-widest">{formatDayDate(day.date)}</p>
            </div>
            <div className="space-y-2">
              {(Array.isArray(day.sessions) ? day.sessions : []).map((session, index) => (
                <div key={`${day.date}-${dayIndex}-${session.subject}-${index}`} className="rounded-2xl bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-neutral-800">{session.subject}</p>
                      <p className="mt-1 text-xs font-bold leading-relaxed text-neutral-500">{session.topic}</p>
                    </div>
                    <span className="rounded-full bg-secondary/10 px-3 py-1 text-[10px] font-black text-secondary">
                      {session.duration_minutes}m
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {tips.length > 0 && (
        <div className="rounded-[2rem] border-2 border-secondary/10 bg-secondary/5 p-5">
          <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-secondary">Tips Sobi</p>
          <ul className="space-y-2">
            {tips.map((tip, index) => (
              <li key={`${tip}-${index}`} className="flex gap-2 text-xs font-bold leading-relaxed text-neutral-600">
                <Sparkles size={14} className="mt-0.5 shrink-0 text-secondary" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
