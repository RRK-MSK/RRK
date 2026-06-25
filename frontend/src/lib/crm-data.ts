export type NavItem = {
  label: string;
  href: string;
};

export type Metric = {
  label: string;
  value: string;
  hint: string;
};

export type ClassCard = {
  id?: string;
  title: string;
  subtitle: string;
  status: string;
  format: string;
  date: string;
  time: string;
  host: string;
  price: string;
};

export type ParticipantRow = {
  name: string;
  telegram: string;
  status: string;
  visits: string;
  paid: string;
  debt: string;
  nextClass: string;
  tags: string[];
  slug: string;
  isRepeat?: boolean;
  lastVisitDate?: string;
};

export type TableRow = Record<string, string>;

export const crmNavItems: NavItem[] = [
  { label: "Дашборд", href: "/crm/dashboard" },
  { label: "Участники", href: "/crm/participants" },
  { label: "Занятия", href: "/crm/classes" },
  { label: "Записи", href: "/crm/records" },
  { label: "Оплаты", href: "/crm/payments" },
  { label: "Расходы", href: "/crm/expenses" },
  { label: "Отзывы", href: "/crm/reviews" },
  { label: "Аналитика", href: "/crm/analytics" },
  { label: "Настройки", href: "/crm/settings" },
];

export const dashboardMetrics: Metric[] = [
  { label: "Выручка за месяц", value: "142 000 Р", hint: "По оплаченных записям" },
  { label: "Занятий в июне", value: "13", hint: "Основные и вечерние группы" },
  { label: "Продано мест", value: "89", hint: "Из 130 доступных" },
  { label: "Свободных мест", value: "41", hint: "Суммарно по афише" },
  { label: "Средняя заполняемость", value: "68%", hint: "Занятые места / лимит" },
  { label: "Ожидают оплаты", value: "18", hint: "Нужно сверить вручную" },
  { label: "Повторные участники", value: "18", hint: "Mock-оценка для MVP" },
  { label: "Лист ожидания", value: "11", hint: "В основном sold out группы" },
];

export const upcomingClasses: ClassCard[] = [
  {
    title: "Говорить чтобы слушали",
    subtitle: "Разговорная практика про ясность, внимание и живое присутствие.",
    status: "SOLD OUT",
    format: "Практика",
    date: "2 июня",
    time: "19:00-22:00",
    host: "Александр Гронский",
    price: "2 000 Р",
  },
  {
    title: "Ошибки как топливо",
    subtitle: "Вечерняя группа про контакт с собой, ошибками и свободой действия.",
    status: "Почти заполнено",
    format: "Практика",
    date: "7 июня",
    time: "16:00-19:00",
    host: "Влас Ибрагимов",
    price: "2 000 Р",
  },
  {
    title: "Юмор без заготовок",
    subtitle: "Групповое занятие с акцентом на импровизацию и речь в моменте.",
    status: "Открыто",
    format: "Интенсив",
    date: "9 июня",
    time: "19:30-22:00",
    host: "Мария Кравцова",
    price: "2 500 Р",
  },
];

export const participantMetrics: Metric[] = [
  { label: "Всего участников", value: "20", hint: "В mock-базе РРК" },
  { label: "Новые", value: "5", hint: "0-1 посещение" },
  { label: "Повторные", value: "15", hint: "Больше одного занятия" },
  { label: "Постоянные", value: "10", hint: "3+ посещения" },
  { label: "Общая сумма оплат", value: "126 000 Р", hint: "По totalPaid участников" },
  { label: "Средний LTV", value: "6 300 Р", hint: "Оплаты / участники" },
];

export const participants: ParticipantRow[] = [
  {
    name: "Алина Громова",
    telegram: "@alina_g",
    status: "Постоянный",
    visits: "4",
    paid: "8 000 Р",
    debt: "4 000 Р ждет",
    nextClass: "9 июня | юмор без заготовок",
    tags: ["вечер"],
    slug: "alina-gromova",
  },
  {
    name: "Анастасия Волкова",
    telegram: "@anastasia_v",
    status: "Постоянный",
    visits: "7",
    paid: "14 000 Р",
    debt: "-",
    nextClass: "2 июня | говорить чтобы слушали",
    tags: ["постоянный"],
    slug: "anastasia-volkova",
  },
  {
    name: "Дмитрий Орлов",
    telegram: "@dmitry_orlov",
    status: "Повторный",
    visits: "2",
    paid: "4 000 Р",
    debt: "2 000 Р ждет",
    nextClass: "7 июня | ошибки как топливо",
    tags: ["новый поток"],
    slug: "dmitry-orlov",
  },
  {
    name: "Екатерина Шульгина",
    telegram: "@katya_voice",
    status: "Новый",
    visits: "1",
    paid: "2 000 Р",
    debt: "-",
    nextClass: "15 июня | смелый диалог",
    tags: ["утро"],
    slug: "ekaterina-shulgina",
  },
];

export const classesMetrics: Metric[] = [
  { label: "Всего занятий", value: "13", hint: "Июньская афиша" },
  { label: "Открыто для записи", value: "9", hint: "Есть свободные места" },
  { label: "SOLD OUT", value: "4", hint: "Запись закрыта" },
  { label: "Свободных мест", value: "43", hint: "По всем занятиям" },
  { label: "Ожидают оплаты", value: "13", hint: "Записи к сверке" },
  { label: "Потенциальная выручка", value: "260 000 Р", hint: "При полной загрузке" },
];

export const classRows: TableRow[] = [
  {
    date: "2 июня",
    time: "19:00-22:00",
    title: "говорить чтобы слушали",
    format: "Практика",
    host: "Александр Гронский",
    spots: "10/10 | свободных мест нет",
    payments: "10 оплачено | 0 ждут",
    revenue: "20 000 Р",
    status: "SOLD OUT",
    action: "Открыть",
  },
  {
    date: "7 июня",
    time: "16:00-19:00",
    title: "ошибки как топливо",
    format: "Практика",
    host: "Влас Ибрагимов",
    spots: "9/10 | свободно 1",
    payments: "9 оплачено | 0 ждут",
    revenue: "18 000 Р",
    status: "SOLD OUT",
    action: "Открыть",
  },
  {
    date: "9 июня",
    time: "19:30-22:00",
    title: "юмор без заготовок",
    format: "Интенсив",
    host: "Мария Кравцова",
    spots: "8/12 | свободно 4",
    payments: "6 оплачено | 2 ждут",
    revenue: "15 000 Р",
    status: "Почти заполнено",
    action: "Открыть",
  },
];

export const recordMetrics: Metric[] = [
  { label: "Всего записей", value: "89", hint: "По всем занятиям июня" },
  { label: "Ждут оплату", value: "14", hint: "Нужно дожать" },
  { label: "Оплачено", value: "71", hint: "Есть платеж" },
  { label: "Подтверждено", value: "33", hint: "Готовы к занятию" },
  { label: "В листе ожидания", value: "4", hint: "Внутри записей" },
  { label: "Отмены / переносы", value: "5", hint: "Нужна сверка" },
];

export const attentionMetrics: Metric[] = [
  { label: "Ждут оплату", value: "14", hint: "pending / unpaid / failed" },
  { label: "Без контакта", value: "0", hint: "Нет Telegram или телефона/email" },
  { label: "Осталось 1-2 места", value: "1", hint: "Можно дожать афишу" },
  { label: "Лист ожидания", value: "15", hint: "Записи и waitlist" },
  { label: "Напомнить", value: "34", hint: "Есть комментарий" },
];

export const recordRows: TableRow[] = [
  {
    participant: "Алина Громова",
    className: "юмор без заготовок",
    payment: "Ждет оплату",
    confirmation: "Ожидает",
    contact: "@alina_g",
    source: "Reels",
    status: "Активна",
    action: "Сверить",
  },
  {
    participant: "Дмитрий Орлов",
    className: "ошибки как топливо",
    payment: "Оплачено",
    confirmation: "Подтверждено",
    contact: "+7 999 000-00-01",
    source: "Telegram",
    status: "Активна",
    action: "Открыть",
  },
  {
    participant: "Екатерина Шульгина",
    className: "смелый диалог",
    payment: "Waitlist",
    confirmation: "В листе ожидания",
    contact: "katya@example.com",
    source: "Сайт",
    status: "Отложена",
    action: "Сверить",
  },
];

export const paymentsMetrics: Metric[] = [
  { label: "Оплачено", value: "71", hint: "Платежи подтверждены" },
  { label: "Ожидают сверки", value: "14", hint: "ЮKassa / ручная проверка" },
  { label: "Выручка месяца", value: "142 000 Р", hint: "По проведенным оплатам" },
  { label: "Средний чек", value: "2 150 Р", hint: "По текущему периоду" },
];

export const paymentRows: TableRow[] = [
  {
    date: "1 июня",
    participant: "Анастасия Волкова",
    purpose: "говорить чтобы слушали",
    method: "ЮKassa",
    amount: "2 000 Р",
    status: "Оплачено",
    action: "Квитанция",
  },
  {
    date: "3 июня",
    participant: "Алина Громова",
    purpose: "юмор без заготовок",
    method: "Перевод",
    amount: "2 000 Р",
    status: "Ждет",
    action: "Сверить",
  },
  {
    date: "4 июня",
    participant: "Дмитрий Орлов",
    purpose: "ошибки как топливо",
    method: "ЮKassa",
    amount: "2 000 Р",
    status: "Оплачено",
    action: "Квитанция",
  },
];

export const expenseMetrics: Metric[] = [
  { label: "Расходы июня", value: "38 000 Р", hint: "Площадка, реклама, сервисы" },
  { label: "Маржинальность", value: "73%", hint: "Без учета налогов" },
  { label: "Постоянные расходы", value: "18 000 Р", hint: "Аренда и сервисы" },
  { label: "Переменные расходы", value: "20 000 Р", hint: "Под мероприятия" },
];

export const expenseRows: TableRow[] = [
  {
    date: "1 июня",
    category: "Аренда",
    description: "Зал на Бауманской",
    amount: "12 000 Р",
    period: "Июнь",
    status: "Оплачено",
    action: "Открыть",
  },
  {
    date: "2 июня",
    category: "Маркетинг",
    description: "Instagram / reels",
    amount: "8 000 Р",
    period: "Неделя 1",
    status: "Оплачено",
    action: "Открыть",
  },
  {
    date: "5 июня",
    category: "Сервисы",
    description: "Telegram + CRM tooling",
    amount: "3 500 Р",
    period: "Месяц",
    status: "План",
    action: "Открыть",
  },
];

export const reviewMetrics: Metric[] = [
  { label: "Новых отзывов", value: "12", hint: "За последние 30 дней" },
  { label: "Средняя оценка", value: "4.9", hint: "По внутренней шкале" },
  { label: "Ждут публикации", value: "3", hint: "Нужно согласовать" },
  { label: "Можно запросить", value: "18", hint: "После недавних посещений" },
];

export const reviewRows: TableRow[] = [
  {
    author: "Алина Громова",
    source: "Telegram",
    text: "После встречи стало легче говорить без зажимов и заготовок.",
    rating: "5/5",
    status: "Новый",
    action: "Опубликовать",
  },
  {
    author: "Дмитрий Орлов",
    source: "Форма сайта",
    text: "Очень бережный формат, много практики и хорошая атмосфера.",
    rating: "5/5",
    status: "Согласован",
    action: "В ленту",
  },
  {
    author: "Екатерина Шульгина",
    source: "Instagram",
    text: "Понравилась энергия группы и понятная модерация ведущего.",
    rating: "4/5",
    status: "Черновик",
    action: "Открыть",
  },
];

export const analyticsMetrics: Metric[] = [
  { label: "ROMI кампаний", value: "+214%", hint: "По последнему месяцу" },
  { label: "Повторные записи", value: "43%", hint: "От всех продаж" },
  { label: "Конверсия в оплату", value: "79%", hint: "Запись -> платеж" },
  { label: "Средняя загрузка", value: "68%", hint: "По всем афишам июня" },
];

export const settingsCards = [
  {
    title: "Доступ в CRM",
    text: "Вход по логину и паролю. На следующем этапе можно добавить роли admin / manager и журнал входов.",
  },
  {
    title: "Интеграция ЮKassa",
    text: "Подключаем checkout, webhook-подтверждения и автопометки оплат в записях.",
  },
  {
    title: "Telegram Mini App",
    text: "Позже добавим дублирующий интерфейс записи и уведомления о статусе мест.",
  },
  {
    title: "Supabase",
    text: "Будет отвечать за auth, таблицы CRM, storage, edge functions и защищенные SQL-политики.",
  },
];

export const participantProfile = {
  name: "Алина Громова",
  status: "Постоянный",
  tags: ["вечер"],
  telegram: "@alina_g",
  phone: "+7 925 100-10-17",
  email: "alina@example.com",
  source: "Reels",
  firstContact: "19 мая",
  note: "Пришел по рекомендации, можно предложить привести друга.",
};

export const participantFinance: Metric[] = [
  { label: "Всего оплатил", value: "8 000 Р", hint: "Из профиля участника" },
  { label: "Количество посещений", value: "4", hint: "Из профиля участника" },
  { label: "Средний чек", value: "2 000 Р", hint: "totalPaid / visitsCount" },
  { label: "Последнее посещение", value: "22 мая", hint: "Последнее посещение" },
  { label: "Ближайшая запись", value: "9 июня", hint: "юмор без заготовок" },
  { label: "Неоплачено", value: "4 000 Р", hint: "2 записи" },
];

export const participantHistory: TableRow[] = [
  {
    date: "22 мая",
    className: "Говорить чтобы слушали",
    payment: "2 000 Р",
    status: "Посетил",
    note: "Активно включалась в практику",
  },
  {
    date: "29 мая",
    className: "Ошибки как топливо",
    payment: "2 000 Р",
    status: "Посетил",
    note: "Попросила материалы после занятия",
  },
  {
    date: "9 июня",
    className: "Юмор без заготовок",
    payment: "Ждет оплату",
    status: "Записан",
    note: "Можно напомнить за день до встречи",
  },
];
