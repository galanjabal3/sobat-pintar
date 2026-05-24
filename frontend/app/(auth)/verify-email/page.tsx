import { Suspense } from "react";

import VerifyEmailClient from "./verify-email-client";

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-[#FDFEFF] px-6">
          <p className="text-sm font-bold text-neutral-400">Memuat halaman verifikasi...</p>
        </div>
      }
    >
      <VerifyEmailClient />
    </Suspense>
  );
}
