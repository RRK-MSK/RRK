import Link from "next/link";

import { FilterRow, MetricGrid, PageHeader, SectionCard, StatusBadge } from "@/components/crm/ui";
import { AddParticipantModal } from "@/components/crm/add-participant-modal";
import { getParticipantsPageData } from "@/lib/crm-store";

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

      <SectionCard
        title="Все участники"
        description="Компактная база для ежедневной работы с людьми, касаниями и оплатами."
        rightLabel="20 участников"
      >
        <FilterRow
          filters={["Все", "Новые", "Повторные", "Постоянные", "В листе ожидания", "Есть неоплаченные записи"]}
          searchPlaceholder="Поиск по имени, Telegram, телефону, email"
        />
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Участник</th>
                <th>Telegram</th>
                <th>Статус</th>
                <th>Посещений</th>
                <th>Сумма оплат</th>
                <th>Неоплачено</th>
                <th>Ближайшая запись</th>
                <th>Теги</th>
                <th>Действие</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((participant) => (
                <tr key={participant.slug}>
                  <td>
                    <div className="name-cell">
                      <strong>{participant.name}</strong>
                      <span>Профиль участника</span>
                    </div>
                  </td>
                  <td>{participant.telegram}</td>
                  <td>
                    <StatusBadge value={participant.status} />
                  </td>
                  <td>{participant.visits}</td>
                  <td>{participant.paid}</td>
                  <td>{participant.debt}</td>
                  <td>{participant.nextClass}</td>
                  <td>
                    <div className="tag-row">
                      {participant.tags.map((tag) => (
                        <StatusBadge key={tag} value={tag} />
                      ))}
                    </div>
                  </td>
                  <td>
                    <Link href={`/crm/participants/${participant.slug}`} className="ghost-button link-button">
                      Открыть
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
