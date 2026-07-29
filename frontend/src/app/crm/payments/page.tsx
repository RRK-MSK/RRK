export const dynamic = 'force-dynamic';
import { MetricGrid, PageHeader, SectionCard } from "@/components/crm/ui";
import { PaymentFormModal, type PaymentFormOption } from "@/components/crm/payment-form-modal";
import { getPaymentsPageData } from "@/lib/crm-store";
import { PaymentsTable } from "@/components/crm/payments-table";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export default async function PaymentsPage() {
  const { metrics, rows, auditRows = [] } = await getPaymentsPageData();
  const supabase = getSupabaseAdminClient();

  let participants: PaymentFormOption[] = [];
  let events: PaymentFormOption[] = [];
  let promoCodes: PaymentFormOption[] = [];

  if (supabase) {
    const [participantsResponse, eventsResponse, promoCodesResponse] = await Promise.all([
      supabase.from("participants").select("id, full_name").order("full_name", { ascending: true }),
      supabase.from("events").select("id, title, starts_at").order("starts_at", { ascending: true }),
      supabase.from("promo_codes").select("id, code").order("code", { ascending: true }),
    ]);

    participants = (participantsResponse.data ?? []).map((participant) => ({
      id: participant.id,
      label: participant.full_name ?? "Без имени",
    }));

    events = (eventsResponse.data ?? []).map((event) => ({
      id: event.id,
      label: `${event.title ?? "Без названия"}${event.starts_at ? ` · ${new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Moscow" }).format(new Date(event.starts_at))}` : ""}`,
    }));

    promoCodes = (promoCodesResponse.data ?? []).map((promoCode) => ({
      id: promoCode.id,
      label: promoCode.code ?? "Без кода",
    }));
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Финансы"
        title="Оплаты"
        description="Все входящие платежи, сверка ЮKassa и ручные переводы"
        action={
          <PaymentFormModal
            triggerLabel="Добавить оплату"
            participants={participants}
            events={events}
            promoCodes={promoCodes}
          />
        }
      />

      <SectionCard title="Платежная сводка" description="Сколько оплачено, что ждет сверки и какой средний чек по клубу.">
        <MetricGrid items={metrics} />
      </SectionCard>

      <PaymentsTable initialRows={rows} participants={participants} events={events} promoCodes={promoCodes} />

      <SectionCard title="История выручки" description="Журнал переносов, возвратов и подтвержденных оплат для аудита.">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Дата</th>
                <th>Операция</th>
                <th>Влияние</th>
                <th>Сумма</th>
                <th>Участник</th>
                <th>Занятие</th>
                <th>Причина</th>
              </tr>
            </thead>
            <tbody>
              {auditRows.map((row, index) => (
                <tr key={`${row.date}-${row.operation}-${index}`}>
                  <td>{row.date}</td>
                  <td>{row.operation}</td>
                  <td>{row.direction}</td>
                  <td>{row.amount}</td>
                  <td>{row.participant}</td>
                  <td>{row.event}</td>
                  <td>{row.reason}</td>
                </tr>
              ))}
              {auditRows.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", color: "var(--muted)", padding: "32px" }}>
                    Пока нет записей в журнале выручки
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
