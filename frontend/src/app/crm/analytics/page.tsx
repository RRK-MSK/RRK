import { MetricGrid, PageHeader, PrimaryButton, SectionCard, StatusBadge } from "@/components/crm/ui";
import { analyticsMetrics } from "@/lib/crm-data";

const insights = [
  {
    title: "Лучший канал",
    text: "Reels и рекомендации дают самый теплый трафик: выше конверсия в оплату и возврат на повторные встречи.",
    badge: "Reels",
  },
  {
    title: "Риск недели",
    text: "У двух ближайших занятий осталось по 1-2 места, но часть заявок все еще ждет оплаты. Нужна ручная сверка.",
    badge: "Требует внимания",
  },
  {
    title: "Точка роста",
    text: "Можно усилить дожим листа ожидания и автоматические напоминания, чтобы добрать до sold out без лишней рекламы.",
    badge: "Потенциал",
  },
];

export default function AnalyticsPage() {
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="BI · Июнь"
        title="Аналитика"
        description="Показатели загрузки, продаж, возвратов и эффективности каналов привлечения"
        action={<PrimaryButton>Экспорт отчета</PrimaryButton>}
      />

      <SectionCard title="Ключевые метрики" description="Главные показатели месяца для оценки роста клуба.">
        <MetricGrid items={analyticsMetrics} />
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
