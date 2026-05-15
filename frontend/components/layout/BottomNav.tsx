"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Camera, User, PenTool } from "lucide-react";
import { cn } from "@/lib/utils";

const BottomNav = () => {
  const pathname = usePathname();

  const showAll = process.env.NEXT_PUBLIC_DEBUG_MODE === "true";

  const navItems = [
    { label: "BERANDA", icon: Home, href: "/dashboard", enabled: true },
    { label: "JELASIN", icon: Camera, href: "/explain", enabled: true },
    { label: "LATIHAN", icon: PenTool, href: "/practice", enabled: true },
    { label: "PROFIL", icon: User, href: "/profile", enabled: true },
  ].filter(item => item.enabled || showAll);

  return (
    <div className="fixed bottom-0 left-0 right-0 px-6 pb-6 pt-2 bg-gradient-to-t from-white via-white/80 to-transparent z-50">
      <nav className="max-w-md mx-auto bg-white/90 backdrop-blur-xl border border-neutral-100 flex justify-between items-center p-2 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1.5 transition-all duration-300 py-4 flex-1 rounded-3xl",
                isActive 
                  ? "bg-secondary text-neutral-900 shadow-lg shadow-secondary/20 scale-100" 
                  : "text-neutral-400 hover:text-neutral-600"
              )}
            >
              <Icon size={20} strokeWidth={isActive ? 3 : 2} />
              <span className="text-[8px] font-black tracking-[0.05em] uppercase">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default BottomNav;
