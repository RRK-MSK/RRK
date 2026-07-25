export const dynamic = 'force-dynamic';

import { MetricGrid, PageHeader, SectionCard } from "@/components/crm/ui";
import { getClassesPageData } from "@/lib/crm-store";
import { CrmCalendarPlanner } from "@/components/crm/calendar-planner";
import { ClassCard } from "@/components/crm/class-card";
import { ClassesTable } from "@/components/crm/classes-table";
import { AddClassModal } from "@/components/crm/add-class-modal";

export default async function CalendarPage() {
  const { metrics, rows, summaries } = await getClassesPageData();

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Календарь · Москва, Бауманская"
        title="Календарь"
        description="Здесь можно добавлять, редактировать, отменять и удалять занятия, которые сразу синхронизируются с сайтом."
        action={<AddClassModal />}
      />

      <SectionCard title="Операционная сводка" description="Сколько занятий открыто, где sold out и сколько денег в потенциале.">
        <MetricGrid items={metrics} />
      </SectionCard>

      <SectionCard
        title="Планирование по дням"
        description="Визуальный календарь как на сайте: нажмите на день, посмотрите занятия и сразу добавьте новое с ценой, временем и вместимостью."
      >
        <CrmCalendarPlanner rows={rows} />
      </SectionCard>

      <SectionCard
        title="Загрузка по занятиям"
        description="Понятный срез по каждому занятию: сколько записалось, сколько оплатило и сколько мест еще осталось."
        rightLabel={`${summaries.length} занятий`}
      >
        <div className="crm-class-load-grid">
          {summaries.map((item) => (
            <ClassCard key={`${item.date}-${item.time}-${item.title}`} item={item} />
          ))}
        </div>
      </SectionCard>

      <ClassesTable initialRows={rows} />
    </div>
  );
}
