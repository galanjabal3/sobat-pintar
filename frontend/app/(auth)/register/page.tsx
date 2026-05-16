"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/Button";
import api from "@/lib/api";
import Image from "next/image";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { SOBI_ASSETS } from "@/lib/assets";

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
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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

  const onSubmit = async (data: RegisterFormValues) => {
    console.log("Submitting registration data:", data);
    setIsLoading(true);
    setError(null);
    try {
      console.log("Calling API: POST /auth/register");
      await api.post("/auth/register", data);
      console.log("Registration successful");
      setSuccess("Pendaftaran berhasil! Mengalihkan ke halaman masuk...");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || "Pendaftaran gagal. Silakan coba lagi.");
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

      <div className="mb-6 flex flex-col items-center">
        <div className="w-40 h-40 sm:w-48 sm:h-48 relative mb-2">
          <Image
            src={SOBI_ASSETS.WAVING}
            alt="Sobi Mascot"
            fill
            priority
            sizes="(max-width: 640px) 160px, 192px"
            className="object-contain drop-shadow-2xl"
          />
        </div>
        <h1 className="text-3xl font-black text-neutral-800 mb-1 text-center">Gabung Sobi</h1>
        <p className="text-neutral-400 font-medium text-center">Belajar jadi lebih seru bareng AI</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <input
            {...register("name")}
            placeholder="Nama Lengkap"
            className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:border-primary transition-all text-neutral-700 font-medium"
          />
          {errors.name && (
            <p className="text-error text-[10px] font-bold mt-1.5 ml-2">{errors.name.message}</p>
          )}
        </div>

        <div>
          <input
            {...register("email")}
            type="email"
            placeholder="Email"
            className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:border-primary transition-all text-neutral-700 font-medium"
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
            className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:border-primary transition-all text-neutral-700 font-medium"
          />
          {errors.password && (
            <p className="text-error text-[10px] font-bold mt-1.5 ml-2">{errors.password.message}</p>
          )}
        </div>

        <div className="pt-2">
          <p className="text-[10px] font-black text-neutral-300 uppercase tracking-widest mb-3 ml-1">Pilih Jenjang</p>
          <div className="grid grid-cols-4 gap-2">
            {["TK", "SD", "SMP", "SMA"].map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setValue("level", level as any)}
                className={cn(
                  "py-3 rounded-xl text-xs font-black transition-all border-2",
                  selectedLevel === level
                    ? "bg-primary border-primary text-white shadow-md shadow-primary/20"
                    : "bg-gray-50 border-transparent text-neutral-400 hover:bg-gray-100"
                )}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-error p-4 rounded-2xl text-xs font-bold border border-red-100">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-teal-50 text-primary p-4 rounded-2xl text-xs font-bold border border-teal-100">
            {success}
          </div>
        )}

        <Button type="submit" className="w-full py-6 h-auto text-lg rounded-2xl shadow-lg shadow-primary/20 mt-4" isLoading={isLoading}>
          Daftar Sekarang
        </Button>
      </form>

      <div className="mt-auto pt-10 text-center">
        <p className="text-neutral-400 text-sm font-medium">
          Sudah punya akun?{" "}
          <Link href="/login" className="text-primary font-black">
            Masuk
          </Link>
        </p>
      </div>
    </div>
  );
}
