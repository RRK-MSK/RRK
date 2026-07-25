export const dynamic = 'force-dynamic';
import { MetricGrid, PageHeader, SectionCard } from "@/components/crm/ui";
import { PaymentFormModal, type PaymentFormOption } from "@/components/crm/payment-form-modal";
import { getPaymentsPageData } from "@/lib/crm-store";
import { PaymentsTable } from "@/components/crm/payments-table";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export default async function PaymentsPage() {
  const { metrics, rows } = await getPaymentsPageData();
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
        eyebrow="Финансы · Июнь"
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
    </div>
  );
}
