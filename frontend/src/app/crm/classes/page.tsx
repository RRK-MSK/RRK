import { FilterRow, MetricGrid, PageHeader, PrimaryButton, SectionCard, SimpleTable } from "@/components/crm/ui";
import { getClassesPageData } from "@/lib/crm-store";

export default async function ClassesPage() {
  const { metrics, rows, summaries } = await getClassesPageData();

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Июнь · Москва, Бауманская"
        title="Занятия"
        description="Афиша, загрузка, оплаты и статусы всех тренировок РРК"
        action={<PrimaryButton>Добавить занятие</PrimaryButton>}
      />

      <SectionCard title="Операционная сводка" description="Сколько занятий открыто, где sold out и сколько денег в потенциале.">
        <MetricGrid items={metrics} />
      </SectionCard>

      <SectionCard
        title="Загрузка по занятиям"
        description="Понятный срез по каждому занятию: сколько записалось, сколько оплатило и сколько мест еще осталось."
        rightLabel="13 занятий"
      >
        <div className="crm-class-load-grid">
          {summaries.map((item) => (
            <article key={`${item.date}-${item.time}-${item.title}`} className="crm-class-load-card">
              <div className="class-badges">
                <span className="status-badge tone-gray">{item.format}</span>
                <span className={`status-badge ${item.status === "SOLD OUT" ? "tone-burgundy" : item.status.includes("Почти") ? "tone-sand" : "tone-green"}`}>
                  {item.status}
                </span>
              </div>
              <h3>{item.title}</h3>
              <p className="crm-class-load-meta">
                {item.date} · {item.time} · {item.host}
              </p>
              <div className="crm-class-load-stats">
                <div>
                  <span>Записалось</span>
                  <strong>
                    {item.booked}/{item.capacity}
                  </strong>
                </div>
                <div>
                  <span>Оплачено</span>
                  <strong>{item.paid}</strong>
                </div>
                <div>
                  <span>Ждут</span>
                  <strong>{item.pending}</strong>
                </div>
                <div>
                  <span>Свободно</span>
                  <strong>{item.free}</strong>
                </div>
                <div>
                  <span>Вейтлист</span>
                  <strong>{item.waitlist}</strong>
                </div>
              </div>
              <div className="crm-class-load-progress" aria-hidden="true">
                <span style={{ width: `${item.capacity > 0 ? Math.min((item.booked / item.capacity) * 100, 100) : 0}%` }} />
              </div>
              <p className="crm-class-load-revenue">Выручка: {item.revenue}</p>
            </article>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="Таблица занятий"
        description="Для быстрой сверки чисел по каждому занятию в одном месте."
        rightLabel={`${rows.length} строк`}
      >
        <FilterRow
          filters={["Все", "Открыто", "Почти заполнено", "SOLD OUT", "Прошло"]}
          searchPlaceholder="Поиск по названию, ведущему, формату или дате"
        />
        <SimpleTable rows={rows} />
      </SectionCard>
    </div>
  );
}
