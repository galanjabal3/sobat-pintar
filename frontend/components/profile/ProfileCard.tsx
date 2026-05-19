import React from "react";

import { cn } from "@/lib/utils";

interface ProfileCardProps {
  children: React.ReactNode;
  className?: string;
}

export function ProfileCard({ children, className }: ProfileCardProps) {
  return (
    <section
      className={cn(
        "bg-white/80 backdrop-blur-xl border-2 border-white rounded-[2rem] p-5 shadow-xl shadow-primary/5",
        className
      )}
    >
      {children}
    </section>
  );
}
