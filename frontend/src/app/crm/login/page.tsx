export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const errorMessage =
    params.error === "forbidden"
      ? "У этого аккаунта нет доступа к CRM."
      : params.error === "config"
        ? "Supabase Auth не настроен. Проверьте переменные окружения."
        : params.error === "1"
          ? "Неверный email или пароль."
          : null;

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
            Email
            <input
              name="email"
              type="email"
              autoComplete="email"
              placeholder="admin@example.com"
              required
            />
          </label>
          <label>
            Пароль
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="Введите пароль"
              required
            />
          </label>
          {errorMessage ? <div className="login-error">{errorMessage}</div> : null}
          <button type="submit" className="primary-button login-submit">
            Войти
          </button>
        </form>
      </div>
    </div>
  );
}
