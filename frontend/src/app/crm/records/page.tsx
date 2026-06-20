import { FilterRow, MetricGrid, PageHeader, PrimaryButton, SectionCard, SimpleTable } from "@/components/crm/ui";
import { getRecordsPageData } from "@/lib/crm-store";

export default async function RecordsPage() {
  const { funnelMetrics, attentionMetrics, rows } = await getRecordsPageData();

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Июнь · Москва, Бауманская"
        title="Записи"
        description="Заявки, оплаты, подтверждения и посещения участников"
        action={<PrimaryButton>Добавить запись</PrimaryButton>}
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

      <SectionCard title="Все записи" description="Операционная таблица заявок, оплат, посещений и переносов." rightLabel="89 записей">
        <FilterRow
          filters={["Все", "Ждут оплату", "Подтверждено", "Waitlist", "Отмены"]}
          searchPlaceholder="Поиск по участнику, занятию, источнику или контакту"
        />
        <SimpleTable rows={rows} />
      </SectionCard>
    </div>
  );
}
