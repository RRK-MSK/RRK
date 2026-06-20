import Link from "next/link";

import { MetricGrid, PageHeader, PrimaryButton, SectionCard, SimpleTable, StatusBadge } from "@/components/crm/ui";
import { getParticipantProfileData } from "@/lib/crm-store";

export default async function ParticipantProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { profile, finance, history } = await getParticipantProfileData(slug);

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Июнь · Москва, Бауманская"
        title="Участники"
        description="База людей, посещений, оплат и повторных касаний РРК"
        action={<PrimaryButton>Добавить участника</PrimaryButton>}
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
          <div className="profile-actions">
            <PrimaryButton>Записать на занятие</PrimaryButton>
            <button className="ghost-button">Отметить оплату</button>
            <button className="ghost-button">Добавить тег</button>
            <button className="ghost-button">Добавить отзыв</button>
            <button className="ghost-button">Добавить комментарий</button>
          </div>
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
        <SimpleTable rows={history} />
      </SectionCard>
    </div>
  );
}
