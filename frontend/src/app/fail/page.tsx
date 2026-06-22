import Link from "next/link";
import { SiteFooter } from "@/components/site/footer";

export default function FailPage() {
  return (
    <main className="site-page" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <section 
        className="site-section" 
        style={{ 
          flex: 1, 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center", 
          textAlign: "center",
          padding: "40px 20px"
        }}
      >
        <div style={{ maxWidth: "600px", padding: "40px", background: "var(--surface-strong)", borderRadius: "24px", border: "1px solid var(--line)" }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "42px", color: "var(--brand)", marginBottom: "16px", textTransform: "uppercase", lineHeight: 1.1 }}>
            Оплата не прошла
          </h1>
          <p style={{ color: "var(--muted)", fontSize: "18px", marginBottom: "32px", lineHeight: "1.5" }}>
            К сожалению, банк отклонил платеж. Вы можете попробовать оплатить другой картой или вернуться на главную страницу и записаться заново.
          </p>
          <Link href="/" className="site-button primary" style={{ display: "inline-flex", justifyContent: "center" }}>
            Вернуться на главную
          </Link>
        </div>
      </section>
      
      <SiteFooter />
    </main>
  );
}
