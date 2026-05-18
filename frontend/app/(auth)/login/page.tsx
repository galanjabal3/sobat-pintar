"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/Button";
import api from "@/lib/api";
import { SOBI_ASSETS } from "@/lib/assets";
import { renderGoogleButton } from "@/lib/googleAuth";
import { useAuthStore } from "@/store/authStore";

const GOOGLE_LOGIN_BUTTON_ID = "googleLoginBtn";
const GOOGLE_BUTTON_WIDTH = 340;

const loginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();

  const setAuth = useAuthStore((state) => state.setAuth);
  const user = useAuthStore((state) => state.user);

  const [isHydrated, setIsHydrated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleReady, setIsGoogleReady] = useState(false);

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

  const handleGoogleResponse = useCallback(
    async (response: any) => {
      setIsLoading(true);
      setError(null);

      try {
        const res = await api.post("/auth/google", {
          id_token: response.credential,
        });

        const { access_token, refresh_token, user } = res.data;

        setAuth(user, access_token, refresh_token);
        router.push("/dashboard");
      } catch (err: any) {
        setError(
          err.response?.data?.error || "Google login gagal. Silakan coba lagi."
        );
      } finally {
        setIsLoading(false);
      }
    },
    [router, setAuth]
  );

  const initializeGoogle = useCallback(() => {
    const isReady = renderGoogleButton({
      buttonElementId: GOOGLE_LOGIN_BUTTON_ID,
      clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      callback: handleGoogleResponse,
      text: "signin_with",
    });

    setIsGoogleReady(isReady);
  }, [handleGoogleResponse]);

  useEffect(() => {
    initializeGoogle();
  }, [initializeGoogle]);

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post("/auth/login", data);
      const { access_token, refresh_token, user } = response.data;

      setAuth(user, access_token, refresh_token);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.error || "Login gagal. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-white px-8 py-12">
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={initializeGoogle}
      />

      <Link
        href="/"
        className="absolute left-6 top-8 p-2 text-neutral-400 transition-colors hover:text-neutral-800"
        aria-label="Kembali ke halaman utama"
      >
        <ChevronLeft size={28} />
      </Link>

      <div className="mb-8 flex flex-col items-center">
        <div className="relative mb-4 h-48 w-48 sm:h-56 sm:w-56">
          <Image
            src={SOBI_ASSETS.WAVING}
            alt="Sobi Mascot"
            fill
            priority
            sizes="(max-width: 640px) 192px, 224px"
            className="object-contain drop-shadow-2xl"
          />
        </div>

        <h1 className="mb-2 text-center text-3xl font-black text-neutral-800">
          Halo, Sobat!
        </h1>

        <p className="text-center font-medium text-neutral-400">
          Masuk untuk lanjut belajar bareng Sobi
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <input
            {...register("email")}
            type="email"
            placeholder="Email"
            autoComplete="email"
            className="w-full rounded-2xl border border-gray-100 bg-gray-50 p-5 text-neutral-700 transition-all focus:border-primary focus:outline-none"
          />

          {errors.email && (
            <p className="ml-2 mt-1.5 text-[10px] font-bold text-error">
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <input
            {...register("password")}
            type="password"
            placeholder="Password"
            autoComplete="current-password"
            className="w-full rounded-2xl border border-gray-100 bg-gray-50 p-5 text-neutral-700 transition-all focus:border-primary focus:outline-none"
          />

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
          className="h-auto w-full rounded-2xl py-6 text-lg shadow-lg shadow-primary/20"
          isLoading={isLoading}
        >
          Masuk
        </Button>
      </form>

      <div className="mt-6 flex flex-col items-center gap-4">
        <div className="flex w-full items-center gap-4">
          <div className="h-px flex-1 bg-gray-100" />
          <span className="text-xs font-bold uppercase tracking-widest text-neutral-300">
            Atau
          </span>
          <div className="h-px flex-1 bg-gray-100" />
        </div>

        <div className="w-full">
          {!isGoogleReady && (
            <div className="flex h-[44px] items-center justify-center">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-primary" />
            </div>
          )}

          <div className={isGoogleReady ? "block w-full" : "invisible h-0 w-full"}>
            <div
              id={GOOGLE_LOGIN_BUTTON_ID}
              className="flex min-h-[44px] w-full justify-center"
            />
          </div>
        </div>
      </div>

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