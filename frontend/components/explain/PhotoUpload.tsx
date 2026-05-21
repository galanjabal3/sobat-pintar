import React, { useRef, useState } from "react";
import Image from "next/image";
import { Camera, X, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface PhotoUploadProps {
  onPhotoSelect: (file: File | null) => void;
}

const PhotoUpload: React.FC<PhotoUploadProps> = ({ onPhotoSelect }) => {
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onPhotoSelect(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setPreview(null);
    onPhotoSelect(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="w-full">
      {preview ? (
        <div className="relative rounded-3xl overflow-hidden border-2 border-primary/20 bg-gray-50 h-64">
          <Image
            src={preview}
            alt="Preview"
            fill
            unoptimized
            className="object-contain"
            sizes="100vw"
          />
          <button
            onClick={removePhoto}
            className="absolute top-4 right-4 p-2 bg-red-500 text-white rounded-full shadow-lg"
          >
            <X size={20} />
          </button>
        </div>
      ) : (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="w-full h-48 border-2 border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center gap-2 bg-gray-50 text-neutral-400 hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <Camera size={40} strokeWidth={1.5} />
          <p className="text-sm font-medium">Ambil Foto Soal</p>
          <p className="text-[10px]">atau klik untuk pilih dari galeri</p>
        </div>
      )}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
    </div>
  );
};

export default PhotoUpload;
