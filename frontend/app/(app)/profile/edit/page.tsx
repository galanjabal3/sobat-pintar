"use client";

import Image from "next/image";
import React from "react";
import { Camera, Mail, Save, School, Trash2, User } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { ProfileCard } from "@/components/profile/ProfileCard";
import { ProfileShell } from "@/components/profile/ProfileShell";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { useToastStore } from "@/store/toastStore";

const LEVELS = [
  { value: "TK", label: "TK", description: "Taman Kanak" },
  { value: "SD", label: "SD", description: "Sekolah Dasar" },
  { value: "SMP", label: "SMP", description: "Menengah Pertama" },
  { value: "SMA", label: "SMA", description: "Menengah Atas" },
] as const;

export default function EditProfilePage() {
  const { user, fetchProfile, updateUser } = useAuthStore();
  const { addToast } = useToastStore();
  const [name, setName] = React.useState("");
  const [level, setLevel] = React.useState("SD");
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(null);
  const [avatarPublicId, setAvatarPublicId] = React.useState<string | null>(null);
  const [avatarFile, setAvatarFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  React.useEffect(() => {
    if (user) {
      setName(user.name || "");
      setLevel(user.level || "SD");
      setAvatarUrl(user.avatar_url || null);
      setAvatarPublicId(user.avatar_public_id || null);
    }
  }, [user]);

  React.useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      addToast("Gunakan gambar JPG, PNG, atau WEBP.", "error");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      addToast("Ukuran foto maksimal 5MB.", "error");
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setAvatarFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const clearAvatar = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setAvatarFile(null);
    setPreviewUrl(null);
    setAvatarUrl(null);
    setAvatarPublicId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();

    if (trimmedName.length < 2) {
      addToast("Nama minimal 2 karakter.", "error");
      return;
    }

    setIsSaving(true);
    try {
      let nextAvatarUrl = avatarUrl;
      let nextAvatarPublicId = avatarPublicId;

      if (avatarFile) {
        try {
          const formData = new FormData();
          formData.append("image", avatarFile);
          const uploadResponse = await api.post("/upload/profile", formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          });
          nextAvatarUrl = uploadResponse.data.data?.url || uploadResponse.data.url;
          nextAvatarPublicId =
            uploadResponse.data.data?.public_id || uploadResponse.data.public_id;
        } catch (uploadError) {
          console.error(uploadError);
          addToast("Foto gagal diunggah. Coba lagi atau simpan tanpa foto.", "error");
          return;
        }
      }

      let response;
      try {
        response = await api.patch("/user/profile", {
          name: trimmedName,
          level,
          avatar_url: nextAvatarUrl,
          avatar_public_id: nextAvatarPublicId,
        });
      } catch (profileError) {
        console.error(profileError);
        addToast("Profil gagal disimpan. Coba lagi sebentar lagi.", "error");
        return;
      }

      updateUser(response.data);
      setAvatarFile(null);
      setPreviewUrl(null);
      setAvatarUrl(response.data.avatar_url || null);
      setAvatarPublicId(response.data.avatar_public_id || null);
      addToast("Profil berhasil diperbarui.", "success");
    } catch (err) {
      console.error(err);
      addToast("Gagal memperbarui profil.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ProfileShell
      title="Edit Profil"
      description="Perbarui identitas belajar dan jenjang sekolahmu."
      mascotMessage="Ayo perbarui profilmu agar Sobi bisa menemani belajar dengan lebih pas."
    >
      <form onSubmit={handleSave} className="space-y-6">
        <ProfileCard className="space-y-5">
          <div className="flex flex-col items-center">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleAvatarChange}
            />
            <div className="relative">
              <div className="relative w-28 h-28 rounded-full bg-primary/10 border-4 border-white shadow-2xl shadow-primary/10 flex items-center justify-center text-4xl font-black text-primary overflow-hidden">
                {previewUrl || avatarUrl ? (
                  <Image
                    src={previewUrl || avatarUrl || ""}
                    alt="Foto profil"
                    fill
                    className="object-cover"
                    sizes="112px"
                    unoptimized={Boolean(previewUrl)}
                  />
                ) : (
                  user?.name?.[0] || "S"
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full bg-primary text-white border-4 border-white shadow-lg flex items-center justify-center"
                aria-label="Ubah foto profil"
              >
                <Camera size={18} strokeWidth={2.5} />
              </button>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs font-black uppercase tracking-widest text-primary"
              >
                Ubah Foto Profil
              </button>
              {previewUrl || avatarUrl ? (
                <button
                  type="button"
                  onClick={clearAvatar}
                  className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-widest text-red-500"
                >
                  <Trash2 size={13} />
                  {previewUrl ? "Batalkan" : "Hapus Foto"}
                </button>
              ) : null}
            </div>
            <p className="mt-2 text-center text-[11px] font-bold text-neutral-400">
              JPG, PNG, atau WEBP. Maksimal 5MB.
            </p>
          </div>

          <label className="block">
            <span className="mb-2 block text-xs font-black uppercase tracking-widest text-neutral-400">
              Nama Lengkap
            </span>
            <div className="relative">
              <User
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300"
              />
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                type="text"
                autoComplete="name"
                className="w-full rounded-2xl border-2 border-primary/5 bg-gray-50/70 p-4 pl-12 text-sm font-bold text-neutral-800 outline-none transition-all focus:border-primary/30 focus:bg-white focus:ring-4 focus:ring-primary/5"
                placeholder="Masukkan nama lengkapmu"
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-black uppercase tracking-widest text-neutral-400">
              Alamat Email
            </span>
            <div className="relative">
              <Mail
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300"
              />
              <input
                value={user?.email || ""}
                type="email"
                readOnly
                className="w-full rounded-2xl border-2 border-transparent bg-gray-100/80 p-4 pl-12 text-sm font-bold text-neutral-400 outline-none"
              />
            </div>
            <p className="mt-2 text-[11px] font-bold text-neutral-400">
              Email belum bisa diubah dari aplikasi.
            </p>
          </label>
        </ProfileCard>

        <ProfileCard>
          <div className="mb-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <School size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-sm font-black text-neutral-800">
                Jenjang Sekolah
              </h2>
              <p className="text-[11px] font-bold text-neutral-400">
                Pilih jenjang yang paling sesuai.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {LEVELS.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setLevel(item.value)}
                className={cn(
                  "rounded-2xl border-2 p-4 text-left transition-all",
                  level === item.value
                    ? "border-primary bg-primary/10 shadow-xl shadow-primary/5"
                    : "border-primary/5 bg-gray-50/60 hover:border-primary/20"
                )}
              >
                <span
                  className={cn(
                    "block text-xl font-black",
                    level === item.value ? "text-primary" : "text-neutral-700"
                  )}
                >
                  {item.label}
                </span>
                <span className="mt-1 block text-[11px] font-bold text-neutral-400">
                  {item.description}
                </span>
              </button>
            ))}
          </div>
        </ProfileCard>

        <Button
          type="submit"
          isLoading={isSaving}
          className="w-full h-14 rounded-[1.5rem] font-black shadow-xl shadow-primary/20"
        >
          <Save size={18} className="mr-2" />
          Simpan Perubahan
        </Button>
      </form>
    </ProfileShell>
  );
}
