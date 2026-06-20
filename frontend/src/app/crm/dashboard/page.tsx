import { MetricGrid, PageHeader, PrimaryButton, SectionCard, StatusBadge } from "@/components/crm/ui";
import { getDashboardPageData } from "@/lib/crm-store";

export default async function DashboardPage() {
  const { metrics, classes } = await getDashboardPageData();

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Июнь · Москва, Бауманская"
        title="PPK CRM"
        description="Система записи, оплат и аналитики клуба"
        action={<PrimaryButton>Добавить занятие</PrimaryButton>}
      />

      <SectionCard title="Картина июня" description="Быстрый срез по местам, оплатам и ближайшим занятиям.">
        <MetricGrid items={metrics} />
      </SectionCard>

      <SectionCard
        title="Ближайшие занятия"
        description="Афиша РРК на июнь: места, оплаты, лист ожидания и текущий статус."
        rightLabel="13 занятий"
      >
        <div className="class-list">
          {classes.map((item) => (
            <article key={item.title} className="class-card">
              <div className="class-card-main">
                <div className="class-badges">
                  <StatusBadge value={item.status} />
                  <StatusBadge value={item.format} />
                </div>
                <h3>{item.title}</h3>
                <p>{item.subtitle}</p>
              </div>
              <dl className="class-meta">
                <div>
                  <dt>Дата</dt>
                  <dd>{item.date}</dd>
                </div>
                <div>
                  <dt>Время</dt>
                  <dd>{item.time}</dd>
                </div>
                <div>
                  <dt>Ведущий</dt>
                  <dd>{item.host}</dd>
                </div>
                <div>
                  <dt>Цена</dt>
                  <dd>{item.price}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
