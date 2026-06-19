import { FilterRow, MetricGrid, PageHeader, PrimaryButton, SectionCard, SimpleTable } from "@/components/crm/ui";
import { classRows, classesMetrics } from "@/lib/crm-data";

export default function ClassesPage() {
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Июнь · Москва, Бауманская"
        title="Занятия"
        description="Афиша, загрузка, оплаты и статусы всех тренировок РРК"
        action={<PrimaryButton>Добавить занятие</PrimaryButton>}
      />

      <SectionCard title="Операционная сводка" description="Сколько занятий открыто, где sold out и сколько денег в потенциале.">
        <MetricGrid items={classesMetrics} />
      </SectionCard>

      <SectionCard
        title="Все занятия"
        description="Компактная таблица для ежедневной сверки мест, оплат и статусов."
        rightLabel="13 занятий"
      >
        <FilterRow
          filters={["Все", "Открыто", "Почти заполнено", "SOLD OUT", "Прошло"]}
          searchPlaceholder="Поиск по названию, ведущему, формату или дате"
        />
        <SimpleTable rows={classRows} />
      </SectionCard>
    </div>
  );
}
