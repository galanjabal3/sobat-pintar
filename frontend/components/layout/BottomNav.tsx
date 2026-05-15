"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Camera, MessageCircle, User, PenTool } from "lucide-react";
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
    <nav className="fixed bottom-6 left-4 right-4 bg-white/90 backdrop-blur-xl border border-white/50 flex justify-between items-center py-2 px-1 z-50 rounded-[2rem] shadow-2xl shadow-black/5">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-1 transition-all duration-300 py-3 px-1 flex-1 min-w-[60px] rounded-3xl",
              isActive 
                ? "bg-secondary text-neutral-900 shadow-md shadow-secondary/20 scale-105" 
                : "text-neutral-400 hover:text-neutral-600"
            )}
          >
            <Icon size={20} strokeWidth={isActive ? 3 : 2} />
            <span className="text-[7px] font-black tracking-tighter uppercase whitespace-nowrap">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};

export default BottomNav;
