"use client";

import React from "react";
import { Laptop, Lock, ShieldCheck, Smartphone, Tablet, Verified } from "lucide-react";

import { ProfileCard } from "@/components/profile/ProfileCard";
import { ProfileShell } from "@/components/profile/ProfileShell";

const DEVICES = [
  {
    icon: Smartphone,
    name: "Perangkat ini",
    meta: "Aktif sekarang",
    active: true,
  },
  {
    icon: Laptop,
    name: "Browser desktop",
    meta: "Riwayat perangkat segera hadir",
    active: false,
  },
  {
    icon: Tablet,
    name: "Tablet",
    meta: "Riwayat perangkat segera hadir",
    active: false,
  },
];

export default function SecurityPage() {
  return (
    <ProfileShell
      title="Keamanan"
      description="Pantau dan jaga akun belajarmu tetap aman."
      mascotMessage="Sobi bantu mengingatkan: jangan pernah bagikan kata sandi atau kode login ke siapa pun."
    >
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <ProfileCard className="flex flex-col">
            <div className="mb-4 flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-secondary/15 text-secondary flex items-center justify-center">
                <Lock size={22} strokeWidth={2.5} />
              </div>
              <h2 className="text-base font-black text-neutral-800">
                Kata Sandi
              </h2>
            </div>
            <p className="mb-5 flex-1 text-xs font-bold leading-relaxed text-neutral-500">
              Ganti kata sandi secara berkala untuk menjaga akun dari akses
              yang tidak diinginkan.
            </p>
            <button
              type="button"
              disabled
              className="w-full rounded-2xl border-2 border-neutral-100 bg-gray-50 px-4 py-3 text-sm font-black text-neutral-400"
            >
              Segera Hadir
            </button>
          </ProfileCard>

          <ProfileCard className="flex flex-col">
            <div className="mb-4 flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <Verified size={22} strokeWidth={2.5} />
              </div>
              <h2 className="text-base font-black text-neutral-800">
                Verifikasi 2 Langkah
              </h2>
            </div>
            <div className="mb-4 rounded-2xl bg-gray-50 p-3">
              <p className="text-xs font-black text-neutral-700">
                Status: Belum aktif
              </p>
            </div>
            <p className="mb-5 flex-1 text-xs font-bold leading-relaxed text-neutral-500">
              Tambahkan lapisan keamanan ekstra setiap kali kamu masuk.
            </p>
            <button
              type="button"
              disabled
              className="w-full rounded-2xl border-2 border-neutral-100 bg-gray-50 px-4 py-3 text-sm font-black text-neutral-400"
            >
              Segera Hadir
            </button>
          </ProfileCard>
        </div>

        <ProfileCard>
          <div className="mb-5 flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <ShieldCheck size={22} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-base font-black text-neutral-800">
                Perangkat yang Masuk
              </h2>
              <p className="text-[11px] font-bold text-neutral-400">
                Daftar lengkap akan tersedia setelah session device aktif.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {DEVICES.map((device) => {
              const Icon = device.icon;
              return (
                <div
                  key={device.name}
                  className="flex items-center justify-between rounded-2xl bg-gray-50/70 p-4"
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      size={22}
                      className={device.active ? "text-primary" : "text-neutral-300"}
                      strokeWidth={2.5}
                    />
                    <div>
                      <p className="text-sm font-black text-neutral-800">
                        {device.name}
                      </p>
                      <p className="text-[11px] font-bold text-neutral-400">
                        {device.meta}
                      </p>
                    </div>
                  </div>
                  {device.active ? (
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-primary">
                      Aktif
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>
        </ProfileCard>

        <div className="rounded-[2rem] bg-secondary/10 p-5 text-xs font-bold leading-relaxed text-neutral-600">
          Sobat Pintar tidak akan pernah meminta kata sandi lewat chat, SMS,
          atau media sosial. Jika ada pesan mencurigakan, abaikan dan laporkan.
        </div>
      </div>
    </ProfileShell>
  );
}
