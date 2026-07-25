export const dynamic = 'force-dynamic';
import { PageHeader, PrimaryButton } from "@/components/crm/ui";
import { getSettingsPageData } from "@/lib/crm-store";

export default async function SettingsPage() {
  const { cards } = await getSettingsPageData();

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Система · Конфигурация"
        title="Настройки и инструкции"
        description="Доступы, интеграции, платежи и техническая конфигурация CRM"
        action={<PrimaryButton>Сохранить конфигурацию</PrimaryButton>}
      />

      <section className="settings-card" style={{ marginBottom: '24px', background: 'var(--surface)', padding: '24px', borderRadius: '12px', border: '1px solid var(--line)' }}>
        <h2 style={{ marginBottom: '16px', color: 'var(--brand)' }}>Как пользоваться CRM-системой РРК</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', color: 'var(--text)' }}>
          <div>
            <strong>1. Добавление занятий (Афиша)</strong>
            <p style={{ marginTop: '4px', color: 'var(--muted)', lineHeight: '1.5' }}>
              Перейдите во вкладку <strong>Календарь</strong> и нажмите кнопку «Добавить занятие» в правом верхнем углу. Заполните название, дату, время, вместимость и при необходимости ценовые пороги. После сохранения занятие мгновенно появится и в CRM, и на публичном сайте для клиентов. Если нужно изменить, отменить или удалить занятие, используйте кнопки в таблице внизу страницы.
            </p>
          </div>
          <div>
            <strong>2. Управление записями (Бронь мест)</strong>
            <p style={{ marginTop: '4px', color: 'var(--muted)', lineHeight: '1.5' }}>
              Во вкладке <strong>Записи</strong> или прямо в карточке занятия вы можете вручную добавить человека (кнопка «Записать участника»). Выбирайте нужного клиента или создавайте нового. Эта функция позволяет записывать людей даже сверх лимита мест (например, 11-го человека на занятие с лимитом 10).
            </p>
          </div>
          <div>
            <strong>3. Профили участников и история</strong>
            <p style={{ marginTop: '4px', color: 'var(--muted)', lineHeight: '1.5' }}>
              Во вкладке <strong>Участники</strong> находится база всех клиентов. Кликнув «Открыть», вы попадете в профиль. В самом низу профиля — история всех занятий (будущих и прошедших) с точным временем. Там же находятся кнопки: «Отметить оплату», «Перенести» (на другое занятие) или «Отменить».
            </p>
          </div>
          <div>
            <strong>4. Оплаты и статусы на сайте</strong>
            <p style={{ marginTop: '4px', color: 'var(--muted)', lineHeight: '1.5' }}>
              Сайт и CRM работают как единое целое. Если в CRM лимит мест исчерпан (например, записалось 10 из 10), на сайте автоматически появится красная плашка <strong>«Мест нет»</strong>, и клиенты не смогут сами записаться на это занятие. Если мест осталось мало (менее 10), на сайте покажется плашка «Осталось X мест».
            </p>
          </div>
        </div>
      </section>

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
