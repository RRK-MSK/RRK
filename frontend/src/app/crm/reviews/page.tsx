import { FilterRow, MetricGrid, PageHeader, PrimaryButton, SectionCard, SimpleTable } from "@/components/crm/ui";
import { reviewMetrics, reviewRows } from "@/lib/crm-data";

export default function ReviewsPage() {
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Контент · Комьюнити"
        title="Отзывы"
        description="Сбор, согласование и подготовка отзывов для сайта и социальных сетей"
        action={<PrimaryButton>Запросить отзыв</PrimaryButton>}
      />

      <SectionCard title="Сводка отзывов" description="Что уже пришло, что можно использовать и где нужен следующий запрос.">
        <MetricGrid items={reviewMetrics} />
      </SectionCard>

      <SectionCard title="Лента отзывов" description="Текущие отзывы участников с источниками и статусом публикации." rightLabel="12 новых">
        <FilterRow
          filters={["Все", "Новые", "Согласован", "Черновик", "К публикации"]}
          searchPlaceholder="Поиск по автору, источнику или тексту"
        />
        <SimpleTable rows={reviewRows} />
      </SectionCard>
    </div>
  );
}
