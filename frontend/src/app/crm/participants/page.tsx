export const dynamic = 'force-dynamic';
import { MetricGrid, PageHeader, SectionCard } from "@/components/crm/ui";
import { AddParticipantModal } from "@/components/crm/add-participant-modal";
import { getParticipantsPageData } from "@/lib/crm-store";
import { ParticipantsTable } from "@/components/crm/participants-table";

export default async function ParticipantsPage() {
  const { metrics, rows } = await getParticipantsPageData();

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Июнь · Москва, Бауманская"
        title="Участники"
        description="База людей, посещений, оплат и повторных касаний РРК"
        action={<AddParticipantModal />}
      />

      <SectionCard title="База клуба" description="Кто приходит впервые, кто возвращается и сколько денег уже принес клубу.">
        <MetricGrid items={metrics} />
      </SectionCard>

      <ParticipantsTable initialRows={rows} />
    </div>
  );
}
