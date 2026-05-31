import { cn } from "@/lib/utils";

interface AIProcessNoticeProps {
  show: boolean;
  className?: string;
}

export function AIProcessNotice({ show, className }: AIProcessNoticeProps) {
  if (!show) return null;

  return (
    <p className={cn("text-center text-[11px] font-bold leading-relaxed text-neutral-400", className)}>
      Sobi masih memproses. Jangan refresh dulu ya.
    </p>
  );
}
