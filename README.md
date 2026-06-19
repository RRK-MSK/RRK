# PPK CRM

Стартовая структура проекта для Разговорного Клуба:

- `frontend` - клиентские интерфейсы на `Next.js`
- `backend` - серверная логика, интеграции и фоновые процессы
- `database` - схема БД, миграции и сиды
- `supabase` - конфигурация Supabase, edge functions и SQL-миграции

## План архитектуры

### Frontend

- `frontend/apps/site` - публичный сайт клуба
- `frontend/apps/crm` - внутренняя CRM для администратора
- `frontend/shared` - общие UI-компоненты, утилиты и дизайн-система

Оба интерфейса планируются на `Next.js` с единым визуальным стилем.

### Backend

- `backend/api` - серверные обработчики и интеграции
- `backend/webhooks` - входящие webhook-обработчики
- `backend/workers` - фоновые задачи и уведомления

### Database

- `database/schemas` - описание сущностей и модели данных
- `database/migrations` - SQL-миграции
- `database/seeds` - тестовые и стартовые данные

### Supabase

- `supabase/migrations` - миграции для Supabase
- `supabase/functions` - edge functions

## Следующие шаги

1. Инициализировать `Next.js` приложения для `site` и `crm`
2. Подключить `Supabase` как основную backend/platform layer
3. Продумать структуру сущностей: занятия, записи, участники, оплаты, отзывы
4. Собрать UI-kit и макет CRM в фирменной стилистике
5. Подготовить деплой в `GitHub` и `Vercel`
