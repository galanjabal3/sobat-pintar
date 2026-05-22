import { Clock, Sparkles } from "lucide-react";

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
  exam_date?: string;
  schedule: DailySchedule[];
  tips?: string[];
}

export function ScheduleView({ result }: { result: ScheduleResult }) {
  return (
    <div className="space-y-5">
      <div className="space-y-3">
        {result.schedule.map((day) => (
          <div key={day.date} className="rounded-[2rem] bg-primary/5 p-4">
            <div className="mb-3 flex items-center gap-2 text-primary">
              <Clock size={14} />
              <p className="text-[10px] font-black uppercase tracking-widest">{day.date}</p>
            </div>
            <div className="space-y-2">
              {day.sessions.map((session, index) => (
                <div key={`${day.date}-${session.subject}-${index}`} className="rounded-2xl bg-white p-4">
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

      {result.tips && result.tips.length > 0 && (
        <div className="rounded-[2rem] border-2 border-secondary/10 bg-secondary/5 p-5">
          <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-secondary">Tips Sobi</p>
          <ul className="space-y-2">
            {result.tips.map((tip) => (
              <li key={tip} className="flex gap-2 text-xs font-bold leading-relaxed text-neutral-600">
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
