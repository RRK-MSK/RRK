import { FilterRow, MetricGrid, PageHeader, PrimaryButton, SectionCard, SimpleTable } from "@/components/crm/ui";
import { expenseMetrics, expenseRows } from "@/lib/crm-data";

export default function ExpensesPage() {
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Финансы · Июнь"
        title="Расходы"
        description="Аренда, продвижение, сервисы и другие операционные затраты"
        action={<PrimaryButton>Добавить расход</PrimaryButton>}
      />

      <SectionCard title="Сводка расходов" description="Текущие затраты клуба и влияние на маржинальность месяца.">
        <MetricGrid items={expenseMetrics} />
      </SectionCard>

      <SectionCard title="Реестр расходов" description="Операционный список расходов по категориям и периодам." rightLabel="8 активных строк">
        <FilterRow
          filters={["Все", "Аренда", "Маркетинг", "Сервисы", "План"]}
          searchPlaceholder="Поиск по статье, периоду или описанию"
        />
        <SimpleTable rows={expenseRows} />
      </SectionCard>
    </div>
  );
}
