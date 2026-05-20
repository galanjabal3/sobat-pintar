import type { Metadata } from "next";
import { Poppins, Plus_Jakarta_Sans } from "next/font/google";
import { ToastContainer } from "@/components/ui/Toast";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plus-jakarta-sans",
});

export const metadata: Metadata = {
  title: "Sobat Pintar — Teman Belajar AI",
  description: "Platform belajar AI untuk pelajar Indonesia (TK-SMA)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${poppins.variable} ${plusJakartaSans.variable}`}>
      <body>
        <main className="relative mx-auto min-h-dvh w-full max-w-[430px] overflow-hidden bg-white shadow-2xl shadow-black/20 md:border-x md:border-white/10">
          {children}
          <ToastContainer />
        </main>
      </body>
    </html>
  );
}
