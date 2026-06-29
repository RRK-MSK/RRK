export const dynamic = 'force-dynamic';
import { FilterRow, MetricGrid, PageHeader, PrimaryButton, SectionCard, SimpleTable } from "@/components/crm/ui";
import { getClassesPageData } from "@/lib/crm-store";
import { ClassCard } from "@/components/crm/class-card";

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
            <ClassCard key={`${item.date}-${item.time}-${item.title}`} item={item} />
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
