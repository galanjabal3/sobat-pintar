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
    <div className="min-h-screen bg-[#FDFEFF] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-[400px] bg-gradient-to-b from-red-50 to-transparent -z-10" />
      
      <div className="w-full max-w-md">
        <EmptyState
          type="error"
          title="Sistem Sedang Sibuk"
          description="Ups! Ada sedikit masalah saat memuat halaman ini. Sobi sedang berusaha memperbaikinya!"
          actionLabel="Muat Ulang Halaman"
          onAction={() => reset()}
        />
        
        <div className="mt-8 text-center">
           <button 
             onClick={() => router.push("/dashboard")}
             className="text-xs font-black uppercase tracking-widest text-neutral-400 hover:text-primary transition-colors"
           >
             Kembali ke Beranda
           </button>
        </div>
      </div>
    </div>
  );
}
