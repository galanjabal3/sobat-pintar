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
import { useAuthStore } from "@/store/authStore";
import { useToastStore } from "@/store/toastStore";

const SETTINGS_STORAGE_KEY = "sobat-pintar-settings";

type LocalSettings = {
  studyReminder: boolean;
  leaderboardUpdates: boolean;
  theme: "light" | "dark";
};

const DEFAULT_SETTINGS: LocalSettings = {
  studyReminder: true,
  leaderboardUpdates: false,
  theme: "light",
};

export default function AppSettingsPage() {
  const router = useRouter();
  const { logout } = useAuthStore();
  const { addToast } = useToastStore();
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

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const showComingSoon = () => {
    addToast("Halaman dokumen segera tersedia.", "info");
  };

  return (
    <ProfileShell
      title="Pengaturan App"
      description="Atur pengalaman belajar di Sobat Pintar."
      mascotMessage="Sesuaikan aplikasi supaya belajar terasa makin nyaman untukmu."
    >
      <div className="space-y-6">
        <ProfileCard>
          <div className="mb-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <Bell size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-base font-black text-neutral-800">
                Preferensi Notifikasi
              </h2>
              <p className="text-[11px] font-bold text-neutral-400">
                Tersimpan di perangkat ini.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <SettingsToggle
              checked={settings.studyReminder}
              onChange={(checked) => updateSetting("studyReminder", checked)}
              label="Pengingat Belajar"
              description="Dapatkan pengingat dari Sobi untuk belajar tepat waktu."
            />
            <SettingsToggle
              checked={settings.leaderboardUpdates}
              onChange={(checked) => updateSetting("leaderboardUpdates", checked)}
              label="Papan Skor & Tantangan"
              description="Tampilkan update peringkat dan tantangan belajar."
            />
          </div>
        </ProfileCard>

        <div className="grid gap-4 sm:grid-cols-2">
          <ProfileCard>
            <div className="mb-4 flex items-center gap-3">
              <Languages size={20} className="text-primary" strokeWidth={2.5} />
              <h2 className="text-base font-black text-neutral-800">Bahasa</h2>
            </div>
            <div className="space-y-3">
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-2xl border-2 border-primary bg-primary/10 p-4 text-left"
              >
                <span className="text-sm font-black text-primary">
                  Bahasa Indonesia
                </span>
                <CheckCircle2 size={20} className="text-primary fill-primary/10" />
              </button>
              <button
                type="button"
                disabled
                className="flex w-full items-center justify-between rounded-2xl border-2 border-primary/5 bg-gray-50/70 p-4 text-left opacity-60"
              >
                <span className="text-sm font-black text-neutral-500">
                  English
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                  Segera
                </span>
              </button>
            </div>
          </ProfileCard>

          <ProfileCard>
            <div className="mb-4 flex items-center gap-3">
              <Palette size={20} className="text-primary" strokeWidth={2.5} />
              <h2 className="text-base font-black text-neutral-800">
                Tema Aplikasi
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-3 rounded-2xl bg-gray-50 p-2">
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
                    "rounded-xl p-3 text-xs font-black transition-all",
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
            <p className="mt-3 text-[11px] font-bold text-neutral-400">
              Mode gelap akan diaktifkan setelah tema global siap.
            </p>
          </ProfileCard>
        </div>

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
                  onClick={showComingSoon}
                  className="flex w-full items-center justify-between rounded-2xl p-4 text-left transition-colors hover:bg-gray-50"
                >
                  <span className="flex items-center gap-3 text-sm font-black text-neutral-700">
                    <Icon size={18} className="text-neutral-300" />
                    {item.label}
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                    Buka
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
