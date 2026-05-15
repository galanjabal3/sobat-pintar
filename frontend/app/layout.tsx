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
        <main className="min-h-screen max-w-md mx-auto bg-white relative">
          {children}
          <ToastContainer />
        </main>
      </body>
    </html>
  );
}
