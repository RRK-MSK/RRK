export const dynamic = 'force-dynamic';
import { FilterRow, MetricGrid, PageHeader, SectionCard, SimpleTable } from "@/components/crm/ui";
import { getRecordsPageData } from "@/lib/crm-store";
import { AddRecordModal } from "@/components/crm/add-record-modal";
import { RecordsTable } from "@/components/crm/records-table";

export default async function RecordsPage() {
  const { funnelMetrics, attentionMetrics, rows } = await getRecordsPageData();

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Июнь · Москва, Бауманская"
        title="Записи"
        description="Заявки, оплаты, подтверждения и посещения участников"
        action={<AddRecordModal />}
      />

      <SectionCard
        title="Воронка записей"
        description="Кто ждет оплату, кто подтвержден и какие записи требуют сверки."
        rightLabel="По всем занятиям июня"
      >
        <MetricGrid items={funnelMetrics} />
      </SectionCard>

      <SectionCard title="Требует внимания" description="Быстрая подсказка, что администратору стоит проверить прямо сейчас.">
        <MetricGrid items={attentionMetrics} />
      </SectionCard>

      <RecordsTable initialRows={rows} />
    </div>
  );
}
