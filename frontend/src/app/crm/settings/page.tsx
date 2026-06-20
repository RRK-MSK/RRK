import { PageHeader, PrimaryButton } from "@/components/crm/ui";
import { getSettingsPageData } from "@/lib/crm-store";

export default async function SettingsPage() {
  const { cards } = await getSettingsPageData();

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Система · Конфигурация"
        title="Настройки"
        description="Доступы, интеграции, платежи и техническая конфигурация CRM"
        action={<PrimaryButton>Сохранить конфигурацию</PrimaryButton>}
      />

      <div className="settings-grid">
        {cards.map((card) => (
          <section key={card.title} className="settings-card">
            <h2>{card.title}</h2>
            <p>{card.text}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
