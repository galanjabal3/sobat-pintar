"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChevronLeft, Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/Button";
import { GoogleOAuthButton } from "@/components/auth/GoogleOAuthButton";
import api from "@/lib/api";
import { getApiErrorMessage } from "@/lib/apiError";
import { SOBI_ASSETS } from "@/lib/assets";
import { useAuthStore } from "@/store/authStore";
import { GoogleOAuthProvider } from "@react-oauth/google";

const loginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function LoginContent() {
  const router = useRouter();

  const setAuth = useAuthStore((state) => state.setAuth);
  const user = useAuthStore((state) => state.user);

  const [isHydrated, setIsHydrated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    const unsub = useAuthStore.persist.onFinishHydration(() => {
      setIsHydrated(true);
    });

    if (useAuthStore.persist.hasHydrated()) {
      setIsHydrated(true);
    }

    return () => unsub();
  }, []);

  useEffect(() => {
    if (isHydrated && user) {
      router.push("/dashboard");
    }
  }, [isHydrated, user, router]);

  const handleGoogleSuccess = async (authorizationCode: string) => {
    setIsGoogleLoading(true);
    setError(null);

    try {
      const res = await api.post("/auth/google", {
        authorization_code: authorizationCode,
        redirect_uri: window.location.origin,
      }, {
        headers: { "X-Requested-With": "XMLHttpRequest" },
      });

      const { user } = res.data;

      setAuth(user);
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Google login gagal. Silakan coba lagi."));
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setError(null);
    setVerificationEmail(null);

    try {
      const response = await api.post("/auth/login", data);
      const { user } = response.data;

      setAuth(user);
      router.push("/dashboard");
    } catch (err: unknown) {
      const apiError = err as { response?: { status?: number } };
      if (apiError.response?.status === 403) {
        setVerificationEmail(data.email.trim().toLowerCase());
      }
      setError(getApiErrorMessage(err, "Login gagal. Silakan coba lagi."));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-dvh flex-col bg-[#FDFEFF] px-7 py-10">
      <Link
        href="/"
        className="absolute left-5 top-7 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-neutral-800 shadow-xl shadow-primary/5 transition-colors hover:text-primary"
        aria-label="Kembali ke halaman utama"
      >
        <ChevronLeft size={28} />
      </Link>

      <div className="mb-6 flex flex-col items-center pt-8">
        <div className="relative mb-3 h-36 w-36">
          <Image
            src={SOBI_ASSETS.WAVING}
            alt="Sobi Mascot"
            fill
            priority
            sizes="144px"
            className="object-contain drop-shadow-2xl"
          />
        </div>

        <h1 className="mb-2 text-center text-3xl font-black text-neutral-800">
          Halo, Sobat!
        </h1>

        <p className="text-center text-sm font-bold text-neutral-400">
          Masuk untuk lanjut belajar bareng Sobi
        </p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5 rounded-[2.2rem] border-4 border-white bg-white/70 p-5 shadow-2xl shadow-primary/5"
      >
        <div>
          <input
            {...register("email")}
            type="email"
            placeholder="Email"
            autoComplete="email"
            className="w-full rounded-2xl border-2 border-transparent bg-gray-50 p-4 font-bold text-neutral-700 transition-all placeholder:text-neutral-300 focus:border-primary/30 focus:bg-white focus:outline-none"
          />

          {errors.email && (
            <p className="ml-2 mt-1.5 text-[10px] font-bold text-error">
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <div className="relative">
            <input
              {...register("password")}
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              autoComplete="current-password"
              className="w-full rounded-2xl border-2 border-transparent bg-gray-50 p-4 pr-14 font-bold text-neutral-700 transition-all placeholder:text-neutral-300 focus:border-primary/30 focus:bg-white focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-300 transition-colors hover:text-primary"
              aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {errors.password && (
            <p className="ml-2 mt-1.5 text-[10px] font-bold text-error">
              {errors.password.message}
            </p>
          )}
        </div>

        {error && (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-xs font-bold text-error">
            {error}
          </div>
        )}

        <Button
          type="submit"
          className="h-auto w-full rounded-2xl py-5 text-lg font-black shadow-lg shadow-primary/20"
          isLoading={isLoading || isGoogleLoading}
        >
          Masuk
        </Button>

        {verificationEmail && (
          <p className="text-center text-xs font-bold text-neutral-400">
            Email ini belum diverifikasi.{" "}
            <Link
              href={`/verify-email?email=${encodeURIComponent(verificationEmail)}`}
              className="text-primary"
            >
              Kirim ulang link
            </Link>
          </p>
        )}

        <div className="flex items-center gap-4 pt-2">
          <div className="h-px flex-1 bg-gray-100" />
          <span className="text-xs font-bold uppercase tracking-widest text-neutral-300">
            Atau
          </span>
          <div className="h-px flex-1 bg-gray-100" />
        </div>

        <GoogleOAuthButton
          label="Login dengan Google"
          isLoading={isGoogleLoading}
          disabled={isLoading}
          onCode={handleGoogleSuccess}
          onError={() => setError("Google login gagal. Silakan coba lagi.")}
        />
      </form>

      <div className="mt-auto pt-12 text-center">
        <p className="text-sm font-medium text-neutral-400">
          Belum punya akun?{" "}
          <Link href="/register" className="font-black text-primary">
            Daftar Sekarang
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""}>
      <LoginContent />
    </GoogleOAuthProvider>
  );
}
