"use client";

import React from "react";
import { CheckCircle2, Info, Languages, LogOut, Palette, Shield, Bell } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ProfileCard } from "@/components/profile/ProfileCard";
import { ProfileShell } from "@/components/profile/ProfileShell";
import { SettingsToggle } from "@/components/profile/SettingsToggle";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

const SETTINGS_STORAGE_KEY = "sobat-pintar-settings";

type LocalSettings = {
  theme: "light" | "dark";
};

const DEFAULT_SETTINGS: LocalSettings = {
  theme: "light",
};

export default function AppSettingsPage() {
  const router = useRouter();
  const { logout } = useAuthStore();
  const [settings, setSettings] = React.useState<LocalSettings>(DEFAULT_SETTINGS);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = React.useState(false);

  React.useEffect(() => {
    const rawSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!rawSettings) return;

    try {
      setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(rawSettings) });
    } catch (err) {
      console.error("Failed to parse local app settings", err);
    }
  }, []);

  const updateSetting = <K extends keyof LocalSettings>(
    key: K,
    value: LocalSettings[K]
  ) => {
    const nextSettings = { ...settings, [key]: value };
    setSettings(nextSettings);
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(nextSettings));
  };

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // Local logout should still proceed when the network is unavailable.
    }
    logout();
    router.push("/login");
  };

  return (
    <ProfileShell
      title="Pengaturan App"
      description="Atur pengalaman belajar di Sobat Pintar."
      mascotMessage="Sesuaikan aplikasi supaya belajar terasa makin nyaman untukmu."
      className="pt-10 sm:pt-12"
    >
      <div className="space-y-5 sm:space-y-6">
        <ProfileCard className="p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary sm:h-10 sm:w-10">
              <Bell size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-[15px] font-black text-neutral-800 sm:text-base">
                Preferensi Notifikasi
              </h2>
              <p className="text-[11px] font-bold text-neutral-400">
                Belum tersedia di versi development.
              </p>
            </div>
          </div>

          <div className="space-y-2.5 sm:space-y-3">
            <SettingsToggle
              checked={false}
              onChange={() => undefined}
              label="Pengingat Belajar"
              description="Akan diaktifkan setelah sistem notifikasi siap."
              disabled
              badge="Belum tersedia"
            />
            <SettingsToggle
              checked={false}
              onChange={() => undefined}
              label="Papan Skor & Tantangan"
              description="Akan diaktifkan setelah tantangan belajar siap."
              disabled
              badge="Belum tersedia"
            />
          </div>
        </ProfileCard>

        <ProfileCard>
          <div className="mb-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <Palette size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-base font-black text-neutral-800">
                Tampilan Aplikasi
              </h2>
              <p className="text-[11px] font-bold text-neutral-400">
                Bahasa dan tema yang kamu gunakan.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[1.5rem] bg-gray-50/70 p-4">
              <div className="mb-3 flex items-center gap-2">
                <Languages size={18} className="text-primary" strokeWidth={2.5} />
                <h3 className="text-sm font-black text-neutral-800">Bahasa</h3>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  className="flex min-h-[64px] w-full items-center justify-between rounded-2xl border-2 border-primary bg-primary/10 px-4 py-3 text-left"
                >
                  <span className="text-sm font-black text-primary">
                    Bahasa Indonesia
                  </span>
                  <CheckCircle2 size={20} className="text-primary fill-primary/10" />
                </button>
                <button
                  type="button"
                  disabled
                  className="flex min-h-[64px] w-full items-center justify-between gap-3 rounded-2xl border-2 border-primary/5 bg-white/70 px-4 py-3 text-left opacity-60"
                >
                  <span className="text-sm font-black text-neutral-500">
                    English
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                    Belum tersedia
                  </span>
                </button>
              </div>
            </div>

            <div className="rounded-[1.5rem] bg-gray-50/70 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Palette size={18} className="text-primary" strokeWidth={2.5} />
                  <h3 className="text-sm font-black text-neutral-800">
                    Tema Aplikasi
                  </h3>
                </div>
                <span className="shrink-0 rounded-full bg-secondary/15 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-secondary">
                  Dalam rencana
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 rounded-2xl bg-white/70 p-2">
                {[
                  { value: "light", label: "Terang" },
                  { value: "dark", label: "Gelap" },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    disabled={item.value === "dark"}
                    onClick={() =>
                      updateSetting("theme", item.value as LocalSettings["theme"])
                    }
                    className={cn(
                      "min-h-[48px] rounded-xl px-3 text-xs font-black transition-all",
                      settings.theme === item.value
                        ? "bg-white text-primary shadow-md"
                        : "text-neutral-400",
                      item.value === "dark" && "opacity-50"
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-[11px] font-bold leading-relaxed text-neutral-400">
                Mode gelap akan diaktifkan setelah tema global siap.
              </p>
            </div>
          </div>
        </ProfileCard>

        <ProfileCard>
          <div className="mb-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-secondary/15 text-secondary flex items-center justify-center">
              <Info size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-base font-black text-neutral-800">
                Info Aplikasi
              </h2>
              <p className="text-[11px] font-bold text-neutral-400">
                v0.1.0 local testing
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {[
              { label: "Kebijakan Privasi", icon: Shield },
              { label: "Syarat & Ketentuan", icon: Info },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  type="button"
                  disabled
                  className="flex w-full items-center justify-between rounded-2xl p-4 text-left opacity-70"
                >
                  <span className="flex items-center gap-3 text-sm font-black text-neutral-700">
                    <Icon size={18} className="text-neutral-300" />
                    {item.label}
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                    Belum tersedia
                  </span>
                </button>
              );
            })}
          </div>
        </ProfileCard>

        <Button
          type="button"
          variant="outline"
          onClick={() => setIsLogoutModalOpen(true)}
          className="w-full h-14 rounded-[1.5rem] border-red-100 text-red-500 hover:bg-red-50 hover:border-red-200 hover:text-red-500 font-black"
        >
          <LogOut size={18} className="mr-2" />
          Keluar dari Akun
        </Button>

        <p className="text-center text-[11px] font-bold text-neutral-400">
          Dibuat untuk Sobat Pintar se-Indonesia.
        </p>
      </div>

      <Modal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleLogout}
        title="Keluar dari Akun?"
        description="Kamu harus login kembali nanti untuk mengakses data belajarmu bersama Sobi."
        confirmText="Ya, Keluar"
        cancelText="Tetap Masuk"
        variant="logout"
      />
    </ProfileShell>
  );
}
