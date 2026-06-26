import { MetricGrid, PageHeader, PrimaryButton, SectionCard } from "@/components/crm/ui";
import { getPaymentsPageData } from "@/lib/crm-store";
import { PaymentsTable } from "@/components/crm/payments-table";

export default async function PaymentsPage() {
  const { metrics, rows } = await getPaymentsPageData();

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Финансы · Июнь"
        title="Оплаты"
        description="Все входящие платежи, сверка ЮKassa и ручные переводы"
        action={<PrimaryButton>Добавить оплату</PrimaryButton>}
      />

      <SectionCard title="Платежная сводка" description="Сколько оплачено, что ждет сверки и какой средний чек по клубу.">
        <MetricGrid items={metrics} />
      </SectionCard>

      <PaymentsTable initialRows={rows} />
    </div>
  );
}

