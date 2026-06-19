import { DEMO_LOGIN, DEMO_PASSWORD } from "@/lib/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const hasError = params.error === "1";

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">PPK CRM</div>
        <h1>Вход в CRM</h1>
        <p>
          Закрытая зона для команды клуба. После входа будут доступны дашборд, участники,
          занятия, записи, оплаты и аналитика.
        </p>

        <form action="/api/crm/login" method="post" className="login-form">
          <label>
            Логин
            <input name="login" placeholder="Введите логин" defaultValue={DEMO_LOGIN} required />
          </label>
          <label>
            Пароль
            <input
              name="password"
              type="password"
              placeholder="Введите пароль"
              defaultValue={DEMO_PASSWORD}
              required
            />
          </label>
          {hasError ? <div className="login-error">Неверный логин или пароль.</div> : null}
          <button type="submit" className="primary-button login-submit">
            Войти
          </button>
        </form>

        <div className="login-hint">
          Демо-доступ: <strong>{DEMO_LOGIN}</strong> / <strong>{DEMO_PASSWORD}</strong>
        </div>
      </div>
    </div>
  );
}
