import Link from "next/link";

import { MetricGrid, PageHeader, PrimaryButton, SectionCard, StatusBadge } from "@/components/crm/ui";
import { ParticipantActions } from "@/components/crm/participant-actions";
import { EnrollmentActions } from "@/components/crm/enrollment-actions";
import { getParticipantProfileData } from "@/lib/crm-store";

export default async function ParticipantProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { profile, finance, history, availableEvents } = await getParticipantProfileData(slug);

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Июнь · Москва, Бауманская"
        title="Участники"
        description="База людей, посещений, оплат и повторных касаний РРК"
      />

      <div className="inline-actions">
        <Link href="/crm/participants" className="ghost-button link-button">
          Назад к участникам
        </Link>
      </div>

      <section className="profile-card">
        <div className="profile-main">
          <div className="tag-row">
            <StatusBadge value={profile.status} />
            {profile.tags.map((tag) => (
              <StatusBadge key={tag} value={tag} />
            ))}
          </div>
          <h2>{profile.name}</h2>
          <ParticipantActions profile={profile} />
        </div>
        <dl className="profile-meta">
          <div>
            <dt>Telegram</dt>
            <dd>{profile.telegram}</dd>
          </div>
          <div>
            <dt>Телефон</dt>
            <dd>{profile.phone}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>{profile.email}</dd>
          </div>
          <div>
            <dt>Источник</dt>
            <dd>{profile.source}</dd>
          </div>
          <div>
            <dt>Дата первого контакта</dt>
            <dd>{profile.firstContact}</dd>
          </div>
          <div>
            <dt>Статус</dt>
            <dd>{profile.status}</dd>
          </div>
          <div className="profile-note">
            <dt>Комментарий администратора</dt>
            <dd>{profile.note}</dd>
          </div>
        </dl>
      </section>

      <SectionCard title="Финансы участника" description="Оплаты, посещения, средний чек и текущие долги по записям.">
        <MetricGrid items={finance} />
      </SectionCard>

      <SectionCard title="История занятий" description="Какие встречи уже были и что запланировано дальше.">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Дата</th>
                <th>Занятие</th>
                <th>Оплата</th>
                <th>Статус</th>
                <th>Действие</th>
              </tr>
            </thead>
            <tbody>
              {history.map((row, idx) => (
                <tr key={row.id || idx}>
                  <td>{row.date}</td>
                  <td>{row.className}</td>
                  <td><StatusBadge value={row.payment} /></td>
                  <td><StatusBadge value={row.status} /></td>
                  <td>
                    {row.status !== "Отменена" && row.id && (
                      <EnrollmentActions 
                        enrollmentId={row.id} 
                        currentEventId={row.event_id} 
                        availableEvents={availableEvents} 
                      />
                    )}
                  </td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", color: "var(--muted)" }}>Нет записей</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
