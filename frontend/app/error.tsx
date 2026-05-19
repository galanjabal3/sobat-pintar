"use client";

import { useEffect } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { useRouter } from "next/navigation";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#FDFEFF] flex items-center justify-center px-6 py-12 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-72 bg-gradient-to-b from-red-50 to-transparent -z-10" />

      <div className="w-full max-w-sm text-center">
        <div className="scale-90 origin-center">
          <EmptyState
            type="error"
            title="Sistem Sedang Sibuk"
            description="Ups! Ada sedikit masalah saat memuat halaman ini. Coba muat ulang atau kembali ke beranda."
            actionLabel="Muat Ulang"
            onAction={() => reset()}
          />
        </div>

        <button
          onClick={() => router.push("/dashboard")}
          className="mt-2 inline-flex h-12 items-center justify-center px-6 text-xs font-black uppercase tracking-widest text-neutral-500 hover:text-primary transition-colors"
        >
          Kembali ke Beranda
        </button>
      </div>
    </div>
  );
}
