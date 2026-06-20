import { FilterRow, MetricGrid, PageHeader, PrimaryButton, SectionCard, SimpleTable } from "@/components/crm/ui";
import { getReviewsPageData } from "@/lib/crm-store";

export default async function ReviewsPage() {
  const { metrics, rows } = await getReviewsPageData();

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Контент · Комьюнити"
        title="Отзывы"
        description="Сбор, согласование и подготовка отзывов для сайта и социальных сетей"
        action={<PrimaryButton>Запросить отзыв</PrimaryButton>}
      />

      <SectionCard title="Сводка отзывов" description="Что уже пришло, что можно использовать и где нужен следующий запрос.">
        <MetricGrid items={metrics} />
      </SectionCard>

      <SectionCard title="Лента отзывов" description="Текущие отзывы участников с источниками и статусом публикации." rightLabel="12 новых">
        <FilterRow
          filters={["Все", "Новые", "Согласован", "Черновик", "К публикации"]}
          searchPlaceholder="Поиск по автору, источнику или тексту"
        />
        <SimpleTable rows={rows} />
      </SectionCard>
    </div>
  );
}
