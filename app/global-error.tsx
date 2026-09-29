"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[CoachMatch] Global error", error);
  }, [error]);

  return (
    <html lang="ar" dir="rtl">
      <body style={{ margin: 0, background: "#15181C", color: "#E9EBEE", fontFamily: "Tajawal, Arial, sans-serif" }}>
        <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "24px", textAlign: "center" }}>
          <section style={{ maxWidth: 520, width: "100%", border: "1px solid #343A42", background: "#262B31", borderRadius: 24, padding: 32, boxSizing: "border-box" }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#8FACF7" }}>CoachMatch</div>
            <h1 style={{ margin: "12px 0 0", fontSize: 28 }}>حصل خطأ غير متوقع</h1>
            <p style={{ margin: "12px 0 0", color: "#B7BCC3", lineHeight: 1.9, fontSize: 14 }}>تعذر تحميل المنصة بشكل سليم. الحالة غير مؤكدة، راجعي الصفحة قبل تكرار أي عملية.</p>
            <button onClick={() => reset()} style={{ marginTop: 24, minHeight: 44, padding: "0 18px", border: 0, borderRadius: 14, background: "#3E6FF2", color: "#F7F9FF", fontWeight: 800, cursor: "pointer" }}>إعادة المحاولة</button>
          </section>
        </main>
      </body>
    </html>
  );
}
