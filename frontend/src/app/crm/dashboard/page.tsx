import { MetricGrid, PageHeader, SectionCard, SimpleTable } from "@/components/crm/ui";
import { getDashboardPageData } from "@/lib/crm-store";
import { AddRecordModal } from "@/components/crm/add-record-modal";
import { ClassCard } from "@/components/crm/class-card";

export default async function DashboardPage() {
  const { metrics, classes, unpaidRecords } = await getDashboardPageData();

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Июнь · Москва, Бауманская"
        title="PPK CRM"
        description="Система записи, оплат и аналитики клуба"
        action={<AddRecordModal />}
      />

      <SectionCard title="Картина июня" description="Быстрый срез по местам, оплатам и ближайшим занятиям.">
        <MetricGrid items={metrics} />
      </SectionCard>

      {unpaidRecords.length > 0 && (
        <SectionCard title="Неоплаченные заявки" description="Клиенты, которые записались, но не завершили оплату.">
          <SimpleTable rows={unpaidRecords} />
        </SectionCard>
      )}

      <SectionCard
        title="Ближайшие занятия"
        description="Афиша РРК на июнь: места, оплаты, лист ожидания и текущий статус."
        rightLabel="13 занятий"
      >
        <div className="class-list">
          {classes.map((item, idx) => (
            <ClassCard key={`${item.title}-${idx}`} item={item} variant="dashboard" />
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
