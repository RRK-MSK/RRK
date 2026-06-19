import { FilterRow, MetricGrid, PageHeader, PrimaryButton, SectionCard, SimpleTable } from "@/components/crm/ui";
import { paymentRows, paymentsMetrics } from "@/lib/crm-data";

export default function PaymentsPage() {
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Финансы · Июнь"
        title="Оплаты"
        description="Все входящие платежи, сверка ЮKassa и ручные переводы"
        action={<PrimaryButton>Добавить оплату</PrimaryButton>}
      />

      <SectionCard title="Платежная сводка" description="Сколько оплачено, что ждет сверки и какой средний чек по клубу.">
        <MetricGrid items={paymentsMetrics} />
      </SectionCard>

      <SectionCard title="Реестр оплат" description="Основная таблица для учета платежей и сверки чеков." rightLabel="71 подтверждено">
        <FilterRow
          filters={["Все", "Оплачено", "Ждут", "ЮKassa", "Перевод"]}
          searchPlaceholder="Поиск по участнику, назначению, сумме или статусу"
        />
        <SimpleTable rows={paymentRows} />
      </SectionCard>
    </div>
  );
}
