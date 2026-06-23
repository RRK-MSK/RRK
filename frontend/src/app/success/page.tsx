import Link from "next/link";
import { SiteFooter } from "@/components/site/footer";
import { SuccessClient } from "./success-client";

export default function SuccessPage({
  searchParams,
}: {
  searchParams: { event_title?: string; event_id?: string };
}) {
  const eventTitle = searchParams.event_title;
  const eventId = searchParams.event_id;

  return (
    <main className="site-page" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {eventId && <SuccessClient eventId={eventId} />}
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
            Оплата прошла!
          </h1>
          {eventTitle ? (
            <div style={{ marginBottom: "24px" }}>
              <p style={{ color: "var(--fg)", fontSize: "20px", marginBottom: "8px", fontWeight: 500 }}>
                Вы успешно записаны на событие:
              </p>
              <p style={{ color: "var(--brand)", fontSize: "24px", fontWeight: "bold", fontFamily: "var(--font-display)", textTransform: "uppercase" }}>
                {eventTitle}
              </p>
            </div>
          ) : null}
          <p style={{ color: "var(--muted)", fontSize: "18px", marginBottom: "32px", lineHeight: "1.5" }}>
            Ждем вас на занятии. Обратите внимание: при отмене брони менее чем за 48 часов оплата не возвращается.
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
