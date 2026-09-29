import type { Metadata } from "next";
import { Tajawal } from "next/font/google";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import "./globals.css";

const tajawal = Tajawal({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700", "800"],
  variable: "--font-tajawal",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "CoachMatch | اكتشف مدربك", template: "%s | CoachMatch" },
  description: "منصة لاكتشاف وحجز المدربين الرياضيين المعتمدين في مصر.",
  keywords: ["مدرب رياضي","حجز مدرب","كوتش","جيم","بادل","تنس","ملاكمة","سباحة"],
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://coachmatch-amber.vercel.app"),
  openGraph: {
    type: "website",
    locale: "ar_EG",
    siteName: "CoachMatch",
    title: "CoachMatch | اكتشف مدربك",
    description: "اكتشاف المدرب وحجز الجلسة بسهولة.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={tajawal.variable}>
      <body className="min-h-screen bg-[var(--bg)] text-[var(--text)] antialiased">
        <Header />
        <main className="relative z-10 mx-auto min-h-[calc(100vh-64px)] max-w-6xl px-4 pb-24 pt-8 sm:px-6 lg:px-8">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}
