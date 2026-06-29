export const dynamic = 'force-dynamic';
import { MetricGrid, PageHeader, PrimaryButton, SectionCard, StatusBadge } from "@/components/crm/ui";
import { getAnalyticsPageData } from "@/lib/crm-store";

export default async function AnalyticsPage() {
  const { metrics, insights } = await getAnalyticsPageData();

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="BI · Июнь"
        title="Аналитика"
        description="Показатели загрузки, продаж, возвратов и эффективности каналов привлечения"
        action={<PrimaryButton>Экспорт отчета</PrimaryButton>}
      />

      <SectionCard title="Ключевые метрики" description="Главные показатели месяца для оценки роста клуба.">
        <MetricGrid items={metrics} />
      </SectionCard>

      <SectionCard title="Инсайты" description="Короткие выводы, на что смотреть администратору и основателю прямо сейчас.">
        <div className="insight-grid">
          {insights.map((insight) => (
            <article key={insight.title} className="insight-card">
              <StatusBadge value={insight.badge} />
              <h3>{insight.title}</h3>
              <p>{insight.text}</p>
            </article>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
