import type { Metadata } from "next";
import { Cairo, Changa } from "next/font/google";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-cairo",
  display: "swap",
});

const changa = Changa({
  subsets: ["arabic", "latin"],
  weight: ["600", "700", "800"],
  variable: "--font-changa",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "CoachMatch | اكتشف مدربك", template: "%s | CoachMatch" },
  description: "منصة حقيقية لاكتشاف وحجز المدربين الرياضيين المعتمدين في مصر — 30 رياضة، حجز فوري، دفع آمن.",
  keywords: ["مدرب رياضي", "حجز مدرب", "كوتش", "جيم", "بادل", "تنس", "ملاكمة", "سباحة"],
  openGraph: {
    type: "website",
    locale: "ar_EG",
    siteName: "CoachMatch",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} ${changa.variable}`}>
      <body className="min-h-screen bg-[var(--bg)] text-[var(--text)] antialiased">
        <div
          className="pointer-events-none fixed inset-0 z-0"
          style={{
            background: [
              "radial-gradient(ellipse 90% 45% at 50% -8%, rgba(255,106,61,.13), transparent)",
              "radial-gradient(circle at 88% 82%, rgba(46,159,199,.06), transparent 38%)",
              "radial-gradient(circle at 4% 18%, rgba(123,92,246,.04), transparent 30%)",
            ].join(", "),
          }}
          aria-hidden
        />
        <Header />
        <main className="relative z-10 mx-auto min-h-[calc(100vh-72px)] max-w-6xl px-4 pb-28 pt-6 sm:px-6 lg:px-8">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}
