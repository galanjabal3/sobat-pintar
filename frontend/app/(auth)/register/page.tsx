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
import { cn } from "@/lib/utils";
import { SOBI_ASSETS } from "@/lib/assets";
import { useAuthStore } from "@/store/authStore";
import { GoogleOAuthProvider } from "@react-oauth/google";

const registerSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  confirmPassword: z.string().min(6, "Konfirmasi password minimal 6 karakter"),
  level: z.enum(["TK", "SD", "SMP", "SMA"], {
    required_error: "Pilih jenjang sekolahmu",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Password dan konfirmasi password harus sama",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

function RegisterContent() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const user = useAuthStore((state) => state.user);

  const [isHydrated, setIsHydrated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
      confirmPassword: "",
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
      setError(getApiErrorMessage(err, "Google register gagal. Silakan coba lagi."));
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post("/auth/register", {
        name: data.name,
        email: data.email,
        password: data.password,
        level: data.level,
      });

      const verificationSent = Boolean(response.data?.verification_sent);
      router.push(
        `/verify-email?email=${encodeURIComponent(data.email)}&sent=${verificationSent ? "1" : "0"}`
      );
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Pendaftaran gagal. Silakan coba lagi."));
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

      <div className="mb-5 flex flex-col items-center pt-8">
        <div className="pointer-events-none relative mb-2 h-32 w-32">
          <Image
            src={SOBI_ASSETS.WAVING}
            alt="Sobi Mascot"
            fill
            priority
            sizes="128px"
            className="pointer-events-none object-contain drop-shadow-2xl"
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

        <div>
          <div className="relative">
            <input
              {...register("confirmPassword")}
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Konfirmasi Password"
              autoComplete="new-password"
              className="w-full rounded-2xl border-2 border-transparent bg-gray-50 p-4 pr-14 font-bold text-neutral-700 transition-all placeholder:text-neutral-300 focus:border-primary/30 focus:bg-white focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((current) => !current)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-300 transition-colors hover:text-primary"
              aria-label={showConfirmPassword ? "Sembunyikan password" : "Tampilkan password"}
            >
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {errors.confirmPassword && (
            <p className="ml-2 mt-1.5 text-[10px] font-bold text-error">
              {errors.confirmPassword.message}
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
          isLoading={isLoading || isGoogleLoading}
        >
          Daftar Sekarang
        </Button>

        <div className="flex items-center gap-4 pt-2">
          <div className="h-px flex-1 bg-gray-100" />
          <span className="text-xs font-bold uppercase tracking-widest text-neutral-300">
            Atau
          </span>
          <div className="h-px flex-1 bg-gray-100" />
        </div>

        <GoogleOAuthButton
          label="Daftar dengan Google"
          isLoading={isGoogleLoading}
          disabled={isLoading}
          onCode={handleGoogleSuccess}
          onError={() => setError("Google register gagal. Silakan coba lagi.")}
        />
      </form>

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

export default function RegisterPage() {
  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""}>
      <RegisterContent />
    </GoogleOAuthProvider>
  );
}
