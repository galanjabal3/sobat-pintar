import React from "react";
import { Share2, Copy, X, Check } from "lucide-react";
import { Button } from "./Button";
import { useToastStore } from "@/store/toastStore";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title?: string;
  heading?: string;
}

export default function ShareModal({ isOpen, onClose, url, title = "Penjelasan dari Sobi", heading = "Bagikan Penjelasan" }: ShareModalProps) {
  const { addToast } = useToastStore();
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      addToast("Tautan berhasil disalin!", "success");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      addToast("Gagal menyalin tautan. Silakan coba lagi.", "error");
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          url: url,
        });
        onClose();
      } catch (err: unknown) {
        if (!(err instanceof DOMException && err.name === "AbortError")) {
          addToast("Gagal membagikan tautan. Silakan coba lagi.", "error");
        }
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-xl relative animate-in fade-in zoom-in duration-200">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600"
          aria-label="Tutup dialog berbagi"
        >
          <X size={20} />
        </button>
        
        <h3 className="text-lg font-black text-neutral-800 mb-6">{heading}</h3>
        
        <div className="space-y-3">
          {typeof navigator !== 'undefined' && !!navigator.share && (
            <Button onClick={handleNativeShare} className="w-full bg-primary py-4 rounded-xl flex items-center justify-center gap-2 font-bold">
              <Share2 size={18} />
              Bagikan
            </Button>
          )}
          
          <Button onClick={handleCopy} variant="outline" className="w-full py-4 rounded-xl flex items-center justify-center gap-2 border-2 font-bold">
            {copied ? <Check size={18} /> : <Copy size={18} />}
            {copied ? "Link Disalin" : "Salin Link"}
          </Button>
        </div>
      </div>
    </div>
  );
}
