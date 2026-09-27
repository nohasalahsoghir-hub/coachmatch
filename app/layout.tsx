import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import "./globals.css";

const cairo = Cairo({ subsets: ["arabic", "latin"], weight: ["400", "500", "600", "700", "800"] });

export const metadata: Metadata = {
  title: "CoachMatch",
  description: "منصة حقيقية لاكتشاف وحجز المدربين الرياضيين",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${cairo.className} min-h-screen bg-[#07110e] text-white antialiased`}>
        <Header />
        <main className="mx-auto min-h-[calc(100vh-72px)] max-w-6xl px-4 pb-28 pt-6 sm:px-6 lg:px-8">{children}</main>
        <BottomNav />
      </body>
    </html>
  );
}
