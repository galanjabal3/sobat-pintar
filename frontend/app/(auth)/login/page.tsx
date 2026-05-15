"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/Button";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import Image from "next/image";
import { ChevronLeft } from "lucide-react";

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
 
  React.useEffect(() => {
    const unsub = useAuthStore.persist.onFinishHydration(() => {
      setIsHydrated(true);
    });
 
    if (useAuthStore.persist.hasHydrated()) {
      setIsHydrated(true);
    }
 
    return () => unsub();
  }, []);
 
  React.useEffect(() => {
    if (isHydrated && user) {
      router.push("/dashboard");
    }
  }, [isHydrated, user, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

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
    <div className="flex flex-col min-h-screen px-8 py-12 bg-white relative">
      {/* Back Button */}
      <Link 
        href="/" 
        className="absolute top-8 left-6 p-2 text-neutral-400 hover:text-neutral-800 transition-colors"
      >
        <ChevronLeft size={28} />
      </Link>

      <div className="mb-12 flex flex-col items-center">
        <div className="w-32 h-32 relative mb-6">
          <Image
            src="https://res.cloudinary.com/dzzflhq79/image/upload/v1778706261/image_tyr7o1.png"
            alt="Sobi Mascot"
            fill
            priority
            sizes="128px"
            className="object-contain"
          />
        </div>
        <h1 className="text-3xl font-black text-neutral-800 mb-2">Halo, Sobat!</h1>
        <p className="text-neutral-400 font-medium">Masuk untuk lanjut belajar bareng Sobi</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <input
            {...register("email")}
            type="email"
            placeholder="Email"
            className="w-full p-5 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:border-primary transition-all text-neutral-700"
          />
          {errors.email && (
            <p className="text-error text-[10px] font-bold mt-1.5 ml-2">{errors.email.message}</p>
          )}
        </div>

        <div>
          <input
            {...register("password")}
            type="password"
            placeholder="Password"
            className="w-full p-5 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:border-primary transition-all text-neutral-700"
          />
          {errors.password && (
            <p className="text-error text-[10px] font-bold mt-1.5 ml-2">{errors.password.message}</p>
          )}
        </div>

        {error && (
          <div className="bg-red-50 text-error p-4 rounded-2xl text-xs font-bold border border-red-100">
            {error}
          </div>
        )}

        <Button type="submit" className="w-full py-6 h-auto text-lg rounded-2xl shadow-lg shadow-primary/20" isLoading={isLoading}>
          Masuk
        </Button>
      </form>

      <div className="mt-auto pt-12 text-center">
        <p className="text-neutral-400 text-sm font-medium">
          Belum punya akun?{" "}
          <Link href="/register" className="text-primary font-black">
            Daftar Sekarang
          </Link>
        </p>
      </div>
    </div>
  );
}
