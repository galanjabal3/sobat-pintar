"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { SOBI_ASSETS } from "@/lib/assets";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import api from "@/lib/api";

export default function SharePage() {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Validasi ID agar bersih dari karakter aneh
    const cleanId = Array.isArray(id) ? id[0] : id;
    
    const fetchShared = async () => {
      try {
        const response = await api.get(`/public/explain/${cleanId}`);
        setData(response.data);
      } catch (err) {
        console.error("Failed to fetch shared explanation", err);
      } finally {
        setIsLoading(false);
      }
    };
    if (cleanId) fetchShared();
  }, [id]);

  if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-primary" /></div>;
  if (!data) return <div className="text-center p-20 text-neutral-500">Penjelasan tidak ditemukan.</div>;

  return (
    <div className="px-6 pt-12 pb-24 max-w-2xl mx-auto">
      <h1 className="text-xl font-black text-neutral-800 mb-8 text-center">Penjelasan Sobi</h1>

      <div className="space-y-6">
        {/* User Question */}
        <div className="bg-gray-50 p-5 rounded-3xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black text-neutral-400 mb-2 uppercase tracking-widest">Pertanyaan</p>
          {data.image_url && (
            <div className="relative w-full aspect-square mb-4 rounded-2xl overflow-hidden border border-gray-200">
              <Image 
                src={data.image_url} 
                alt="Pertanyaan gambar" 
                fill 
                sizes="(max-width: 768px) 100vw, 672px"
                className="object-cover"
                unoptimized
              />
            </div>
          )}
          <p className="text-neutral-700 text-sm font-medium leading-relaxed">{data.question}</p>
        </div>

        {/* AI Answer */}
        <div className="bg-white border-2 border-primary/20 rounded-[2.5rem] p-6 relative shadow-sm">
          <div className="absolute -top-6 -left-2 w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-lg shadow-black/5 border border-gray-100 overflow-hidden p-1">
            <div className="w-full h-full relative">
              <Image 
                src={SOBI_ASSETS.DEFAULT} 
                alt="Sobi" 
                fill 
                unoptimized 
                priority
                sizes="56px"
                className="object-contain" 
              />
            </div>
          </div>
          <div className="pt-6">
            <p className="text-[10px] font-black text-primary mb-3 uppercase tracking-widest">Penjelasan Sobi</p>
            <div className="prose prose-sm max-w-none text-neutral-800">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({children}) => <h1 className="text-lg font-bold text-gray-800 mt-3 mb-1">{children}</h1>,
                  h2: ({children}) => <h2 className="text-base font-bold text-gray-800 mt-3 mb-1">{children}</h2>,
                  h3: ({children}) => <h3 className="text-sm font-bold text-gray-700 mt-2 mb-1">{children}</h3>,
                  p: ({children}) => <p className="text-gray-700 mb-2 leading-relaxed">{children}</p>,
                  strong: ({children}) => <strong className="font-bold text-gray-900">{children}</strong>,
                  ul: ({children}) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                  ol: ({children}) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                  li: ({children}) => <li className="text-gray-700 text-sm">{children}</li>,
                  code: ({children}) => <code className="bg-gray-100 px-1 rounded text-sm font-mono">{children}</code>,
                }}
              >
                {data.answer || ""}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-10">
        <Link href="/">
          <Button className="w-full py-6 rounded-2xl shadow-lg shadow-primary/30 font-bold">
            Mau Belajar Lebih Banyak? Daftar Sobat Pintar!
          </Button>
        </Link>
      </div>
    </div>
  );
}
