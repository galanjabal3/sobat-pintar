"use client";

import { EmptyState } from "@/components/ui/EmptyState";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#FDFEFF] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-[400px] bg-gradient-to-b from-orange-50 to-transparent -z-10" />
      
      <div className="w-full max-w-md">
        <EmptyState
          type="error"
          title="Halaman Tidak Ditemukan"
          description="Hmm, Sobi tidak bisa menemukan halaman yang kamu cari. Mungkin link-nya salah atau halamannya sudah dihapus."
          actionLabel="Kembali ke Beranda"
          onAction={() => router.push("/dashboard")}
        />
      </div>
    </div>
  );
}
