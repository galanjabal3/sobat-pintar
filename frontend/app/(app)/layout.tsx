"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/layout/BottomNav";
import { useAuthStore } from "@/store/authStore";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [isHydrated, setIsHydrated] = React.useState(false);

  useEffect(() => {
    // Wait for hydration to complete
    const unsub = useAuthStore.persist.onFinishHydration(() => {
      setIsHydrated(true);
    });

    if (useAuthStore.persist.hasHydrated()) {
      setIsHydrated(true);
    }

    return () => unsub();
  }, []);

  useEffect(() => {
    if (isHydrated && !user) {
      router.push("/login");
    }
  }, [isHydrated, user, router]);

  if (!isHydrated || !user) {
    return (
      <div className="min-h-screen bg-[#FDFEFF] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="pb-24">
      {children}
      <BottomNav />
    </div>
  );
}
