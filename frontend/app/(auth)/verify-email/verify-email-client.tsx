"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, Mail, RotateCcw, CheckCircle2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/Button";
import api from "@/lib/api";
import { getApiErrorMessage } from "@/lib/apiError";
import { SOBI_ASSETS } from "@/lib/assets";

type VerifyState = "idle" | "verifying" | "success" | "error";

const RESEND_COOLDOWN_SECONDS = 60;
const RESEND_COOLDOWN_STORAGE_PREFIX = "sobat-pintar:verification-resend-until:";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function getResendCooldownKey(email: string) {
  const normalizedEmail = normalizeEmail(email);
  return normalizedEmail ? `${RESEND_COOLDOWN_STORAGE_PREFIX}${normalizedEmail}` : null;
}

export default function VerifyEmailClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const initialEmail = searchParams.get("email") || "";
  const sentFlag = searchParams.get("sent") === "1";

  const [email, setEmail] = useState(initialEmail);
  const [state, setState] = useState<VerifyState>(token ? "verifying" : "idle");
  const [message, setMessage] = useState(
    sentFlag ? "Link verifikasi sudah dikirim ke email kamu." : "Cek inbox untuk verifikasi akunmu."
  );
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldownSeconds, setResendCooldownSeconds] = useState(0);
  const [cooldownEmail, setCooldownEmail] = useState("");
  const verificationTokenRef = useRef<string | null>(null);
  const isResendCoolingDown =
    resendCooldownSeconds > 0 &&
    (cooldownEmail === "" || cooldownEmail === normalizeEmail(email));

  const pageTitle = useMemo(() => {
    if (state === "success") return "Email Terverifikasi";
    if (state === "error") return "Link Verifikasi Bermasalah";
    return "Verifikasi Email";
  }, [state]);

  const verifyToken = useCallback(async (nextToken: string) => {
    if (!nextToken || verificationTokenRef.current === nextToken) return;

    verificationTokenRef.current = nextToken;

    setState("verifying");
    setError(null);

    try {
      await api.post("/auth/verify-email", { token: nextToken });
      if (verificationTokenRef.current !== nextToken) return;

      setState("success");
      setMessage("Email kamu sudah aktif. Sekarang kamu bisa masuk.");
    } catch (err: unknown) {
      if (verificationTokenRef.current !== nextToken) return;

      setState("error");
      setError(getApiErrorMessage(err, "Link verifikasi tidak valid atau sudah kedaluwarsa."));
    }
  }, []);

  useEffect(() => {
    if (token) {
      verifyToken(token);
    }
  }, [token, verifyToken]);

  useEffect(() => {
    const storageKey = getResendCooldownKey(initialEmail);
    if (!storageKey) return;

    const storedUntil = Number(window.localStorage.getItem(storageKey));
    const remainingSeconds = Math.ceil((storedUntil - Date.now()) / 1000);
    if (remainingSeconds > 0) {
      setCooldownEmail(normalizeEmail(initialEmail));
      setResendCooldownSeconds(remainingSeconds);
      setMessage("Periksa email kamu untuk melanjutkan verifikasi.");
      setSuccessMessage("Email verifikasi baru saja diminta. Tunggu sebelum mengirim ulang.");
      return;
    }

    window.localStorage.removeItem(storageKey);
    if (sentFlag) {
      window.localStorage.setItem(
        storageKey,
        String(Date.now() + RESEND_COOLDOWN_SECONDS * 1000)
      );
      setCooldownEmail(normalizeEmail(initialEmail));
      setResendCooldownSeconds(RESEND_COOLDOWN_SECONDS);
    }
  }, [initialEmail, sentFlag]);

  useEffect(() => {
    if (resendCooldownSeconds <= 0) {
      const storageKey = getResendCooldownKey(cooldownEmail);
      if (storageKey) {
        window.localStorage.removeItem(storageKey);
      }
      return;
    }

    const timerID = window.setTimeout(() => {
      setResendCooldownSeconds((seconds) => Math.max(0, seconds - 1));
    }, 1000);

    return () => window.clearTimeout(timerID);
  }, [cooldownEmail, resendCooldownSeconds]);

  const handleResend = async () => {
    if (!email.trim()) {
      setSuccessMessage(null);
      setError("Masukkan email yang dipakai saat daftar.");
      return;
    }

    setIsResending(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await api.post("/auth/resend-verification", { email });
      const normalizedEmail = normalizeEmail(email);
      const storageKey = getResendCooldownKey(normalizedEmail);
      if (storageKey) {
        window.localStorage.setItem(
          storageKey,
          String(Date.now() + RESEND_COOLDOWN_SECONDS * 1000)
        );
      }
      setMessage("Periksa email kamu untuk melanjutkan verifikasi.");
      setSuccessMessage(
        "Permintaan berhasil. Jika email terdaftar dan belum aktif, link verifikasi akan dikirim."
      );
      setCooldownEmail(normalizedEmail);
      setResendCooldownSeconds(RESEND_COOLDOWN_SECONDS);
      setState("idle");
      router.replace(`/verify-email?email=${encodeURIComponent(normalizedEmail)}`);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Gagal mengirim ulang email verifikasi."));
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="relative flex min-h-dvh flex-col bg-[#FDFEFF] px-7 py-10">
      <Link
        href="/login"
        className="absolute left-5 top-7 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-neutral-800 shadow-xl shadow-primary/5 transition-colors hover:text-primary"
        aria-label="Kembali ke halaman masuk"
      >
        <ChevronLeft size={28} />
      </Link>

      <div className="mb-6 flex flex-col items-center pt-8">
        <div className="pointer-events-none relative mb-3 h-36 w-36">
          <Image
            src={SOBI_ASSETS.WAVING}
            alt="Sobi Mascot"
            fill
            priority
            sizes="144px"
            className="pointer-events-none object-contain drop-shadow-2xl"
          />
        </div>

        <p className="mb-1 text-[10px] font-black uppercase tracking-[0.3em] text-primary">
          Sobat Pintar
        </p>
        <h1 className="text-center text-3xl font-black text-neutral-800">{pageTitle}</h1>
        <p className="mt-2 max-w-sm text-center text-sm font-bold leading-relaxed text-neutral-400">
          {message}
        </p>
      </div>

      <div className="space-y-5 rounded-[2.2rem] border-4 border-white bg-white/70 p-5 shadow-2xl shadow-primary/5">
        {state === "verifying" ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
            <p className="text-sm font-bold text-neutral-500">Sedang memverifikasi email...</p>
          </div>
        ) : state === "success" ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-50 text-green-600">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <p className="text-base font-black text-neutral-800">
              Kamu sudah bisa login sekarang.
            </p>
            <Link
              href="/login"
              className="inline-flex h-auto w-full items-center justify-center rounded-2xl bg-primary px-6 py-4 text-base font-black text-white shadow-lg shadow-primary/20 transition-opacity hover:opacity-90"
            >
              Masuk Sekarang
            </Link>
          </div>
        ) : (
          <>
            <div className="rounded-[1.6rem] bg-primary/5 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-primary shadow-sm">
                  <Mail size={20} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-black text-neutral-800">Kirim ulang verifikasi</p>
                  <p className="mt-1 text-xs font-medium leading-relaxed text-neutral-500">
                    Masukkan email yang kamu pakai saat daftar, lalu kirim ulang link verifikasi.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                placeholder="Email"
                autoComplete="email"
                className="w-full rounded-2xl border-2 border-transparent bg-gray-50 p-4 font-bold text-neutral-700 transition-all placeholder:text-neutral-300 focus:border-primary/30 focus:bg-white focus:outline-none"
              />
            </div>

            {successMessage && (
              <div className="rounded-2xl border border-green-100 bg-green-50 p-4 text-xs font-bold text-green-700">
                {successMessage}
              </div>
            )}

            {error && (
              <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-xs font-bold text-error">
                {error}
              </div>
            )}

            <Button
              type="button"
              onClick={handleResend}
              isLoading={isResending}
              disabled={isResendCoolingDown}
              className="h-auto w-full rounded-2xl py-5 text-lg font-black shadow-lg shadow-primary/20"
            >
              <RotateCcw size={18} className="mr-2" />
              {isResendCoolingDown
                ? `Kirim lagi dalam ${resendCooldownSeconds} dtk`
                : "Kirim Ulang Email"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
