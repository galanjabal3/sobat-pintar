"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { ChevronLeft, Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/Button";
import api from "@/lib/api";
import { getApiErrorMessage } from "@/lib/apiError";
import { cn } from "@/lib/utils";
import { SOBI_ASSETS } from "@/lib/assets";
import { renderGoogleButton } from "@/lib/googleAuth";
import { useAuthStore } from "@/store/authStore";

const GOOGLE_REGISTER_BUTTON_ID = "googleRegisterBtn";

const registerSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  level: z.enum(["TK", "SD", "SMP", "SMA"], {
    required_error: "Pilih jenjang sekolahmu",
  }),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const user = useAuthStore((state) => state.user);

  const [isHydrated, setIsHydrated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleReady, setIsGoogleReady] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      level: "SD",
    },
  });

  const selectedLevel = watch("level");

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
      } catch (err: unknown) {
        setError(getApiErrorMessage(err, "Google register gagal. Silakan coba lagi."));
      } finally {
        setIsLoading(false);
      }
    },
    [router, setAuth]
  );

  const initializeGoogle = useCallback(() => {
    const isReady = renderGoogleButton({
      buttonElementId: GOOGLE_REGISTER_BUTTON_ID,
      clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      callback: handleGoogleResponse,
      text: "signup_with",
    });

    setIsGoogleReady(isReady);
  }, [handleGoogleResponse]);

  useEffect(() => {
    initializeGoogle();
  }, [initializeGoogle]);

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    setError(null);

    try {
      await api.post("/auth/register", data);

      let response;

      try {
        response = await api.post("/auth/login", {
          email: data.email,
          password: data.password,
        });
      } catch {
        throw new Error("Akun berhasil dibuat, tapi belum bisa masuk otomatis. Silakan coba masuk manual.");
      }

      const { access_token, refresh_token, user } = response.data;

      setAuth(user, access_token, refresh_token);
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Pendaftaran gagal. Silakan coba lagi."));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-dvh flex-col bg-[#FDFEFF] px-7 py-10">
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={initializeGoogle}
      />

      <Link
        href="/"
        className="absolute left-5 top-7 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-neutral-800 shadow-xl shadow-primary/5 transition-colors hover:text-primary"
        aria-label="Kembali ke halaman utama"
      >
        <ChevronLeft size={28} />
      </Link>

      <div className="mb-5 flex flex-col items-center pt-8">
        <div className="relative mb-2 h-32 w-32">
          <Image
            src={SOBI_ASSETS.WAVING}
            alt="Sobi Mascot"
            fill
            priority
            sizes="128px"
            className="object-contain drop-shadow-2xl"
          />
        </div>

        <h1 className="mb-1 text-center text-3xl font-black text-neutral-800">
          Gabung Sobi
        </h1>

        <p className="text-center text-sm font-bold text-neutral-400">
          Belajar jadi lebih seru bareng AI
        </p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4 rounded-[2.2rem] border-4 border-white bg-white/70 p-5 shadow-2xl shadow-primary/5"
      >
        <div>
          <input
            {...register("name")}
            type="text"
            placeholder="Nama Lengkap"
            autoComplete="name"
            className="w-full rounded-2xl border-2 border-transparent bg-gray-50 p-4 font-bold text-neutral-700 transition-all placeholder:text-neutral-300 focus:border-primary/30 focus:bg-white focus:outline-none"
          />

          {errors.name && (
            <p className="ml-2 mt-1.5 text-[10px] font-bold text-error">
              {errors.name.message}
            </p>
          )}
        </div>

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
              autoComplete="new-password"
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

        <div className="pt-2">
          <p className="mb-3 ml-1 text-[10px] font-black uppercase tracking-widest text-neutral-300">
            Pilih Jenjang
          </p>

          <div className="grid grid-cols-4 gap-2">
            {(["TK", "SD", "SMP", "SMA"] as const).map((level) => (
              <button
                key={level}
                type="button"
                onClick={() =>
                  setValue("level", level, {
                    shouldValidate: true,
                    shouldDirty: true,
                  })
                }
                className={cn(
                  "rounded-xl border-2 py-3 text-xs font-black transition-all",
                  selectedLevel === level
                    ? "border-primary bg-primary text-white shadow-md shadow-primary/20"
                    : "border-transparent bg-gray-50 text-neutral-400 hover:bg-gray-100"
                )}
              >
                {level}
              </button>
            ))}
          </div>

          {errors.level && (
            <p className="ml-2 mt-1.5 text-[10px] font-bold text-error">
              {errors.level.message}
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
          className="mt-2 h-auto w-full rounded-2xl py-5 text-lg font-black shadow-lg shadow-primary/20"
          isLoading={isLoading}
        >
          Daftar Sekarang
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

        <div className="w-full rounded-[1.6rem] border-2 border-white bg-white/80 p-2 shadow-xl shadow-primary/5">
          {!isGoogleReady && (
            <div className="flex h-[48px] items-center justify-center">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-primary" />
            </div>
          )}

          <div className={isGoogleReady ? "block w-full" : "invisible h-0 w-full"}>
            <div
              id={GOOGLE_REGISTER_BUTTON_ID}
              className="flex min-h-[48px] w-full justify-center overflow-hidden rounded-full"
            />
          </div>
        </div>
      </div>

      <div className="mt-auto pt-10 text-center">
        <p className="text-sm font-medium text-neutral-400">
          Sudah punya akun?{" "}
          <Link href="/login" className="font-black text-primary">
            Masuk
          </Link>
        </p>
      </div>
    </div>
  );
}
