import { FilterRow, MetricGrid, PageHeader, PrimaryButton, SectionCard, SimpleTable } from "@/components/crm/ui";
import { getPaymentsPageData } from "@/lib/crm-store";

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

      <SectionCard title="Реестр оплат" description="Основная таблица для учета платежей и сверки чеков." rightLabel="71 подтверждено">
        <FilterRow
          filters={["Все", "Оплачено", "Ждут", "ЮKassa", "Перевод"]}
          searchPlaceholder="Поиск по участнику, назначению, сумме или статусу"
        />
        <SimpleTable rows={rows} />
      </SectionCard>
    </div>
  );
}
