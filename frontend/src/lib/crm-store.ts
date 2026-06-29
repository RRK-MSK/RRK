import "server-only";

import {
  analyticsMetrics,
  attentionMetrics,
  classRows,
  classesMetrics,
  dashboardMetrics,
  expenseMetrics,
  expenseRows,
  participantFinance,
  participantHistory,
  participantMetrics,
  participantProfile,
  participants,
  paymentRows,
  paymentsMetrics,
  recordMetrics,
  recordRows,
  reviewMetrics,
  reviewRows,
  settingsCards,
  upcomingClasses,
} from "@/lib/crm-data";
import type { ClassCard, Metric, ParticipantRow, TableRow } from "@/lib/crm-data";
import { hasSupabasePublicEnv, hasSupabaseServiceRoleEnv } from "@/lib/supabase/env";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

type EventRow = {
  id: string;
  title: string;
  subtitle: string | null;
  category: string | null;
  city: string | null;
  host: string | null;
  status: string | null;
  starts_at: string;
  ends_at: string | null;
  price_rub: number | null;
  capacity: number | null;
  booked_count: number | null;
  paid_count: number | null;
  pending_count: number | null;
  waitlist_count: number | null;
  is_published: boolean | null;
};

type ParticipantDbRow = {
  id: string;
  slug: string;
  full_name: string;
  telegram: string | null;
  phone: string | null;
  email: string | null;
  source: string | null;
  status: string | null;
  tags: string[] | null;
  visits_count: number | null;
  total_paid_rub: number | null;
  unpaid_rub: number | null;
  next_event_title: string | null;
  next_event_at: string | null;
  first_contact_at: string | null;
  note: string | null;
  created_at: string;
  enrollments?: {
    status: string | null;
    events: {
      title: string | null;
      starts_at: string | null;
    } | {
      title: string | null;
      starts_at: string | null;
    }[] | null;
  }[];
};

type EnrollmentJoinedRow = {
  id: string;
  source: string | null;
  status: string | null;
  payment_status: string | null;
  confirmation_status: string | null;
  note: string | null;
  participant: {
    full_name: string | null;
    telegram: string | null;
    phone: string | null;
    email: string | null;
  } | null;
  event: {
    id: string;
    title: string | null;
    starts_at: string | null;
  } | null;
};

type PaymentJoinedRow = {
  id: string;
  amount_rub: number | null;
  method: string | null;
  status: string | null;
  paid_at: string | null;
  source?: string | null;
  participant: {
    full_name: string | null;
  } | null;
  event: {
    title: string | null;
  } | null;
};

type ExpenseRow = {
  id: string;
  spent_at: string | null;
  category: string | null;
  description: string | null;
  amount_rub: number | null;
  period_label: string | null;
  status: string | null;
};

type ReviewRow = {
  id: string;
  author_name: string | null;
  source: string | null;
  text: string | null;
  rating: number | null;
  status: string | null;
};

type SettingsCard = {
  title: string;
  text: string;
};

export type DashboardPageData = {
  metrics: Metric[];
  classes: ClassCard[];
  unpaidRecords: TableRow[];
};

export type ParticipantsPageData = {
  metrics: Metric[];
  rows: ParticipantRow[];
};

export type ParticipantProfileData = {
  profile: typeof participantProfile & { id: string };
  finance: Metric[];
  history: (TableRow & { id: string; event_id?: string })[];
  availableEvents: { id: string; title: string; starts_at: string; status: string | null }[];
};

export type TablePageData = {
  metrics: Metric[];
  rows: TableRow[];
};

export type ClassLoadSummary = {
  id: string;
  title: string;
  date: string;
  time: string;
  host: string;
  format: string;
  status: string;
  booked: number;
  capacity: number;
  paid: number;
  pending: number;
  free: number;
  waitlist: number;
  canceled: number;
  revenue: string;
};

export type ClassesPageData = {
  metrics: Metric[];
  rows: TableRow[];
  summaries: ClassLoadSummary[];
};

export type RecordsPageData = {
  funnelMetrics: Metric[];
  attentionMetrics: Metric[];
  rows: TableRow[];
};

export type AnalyticsPageData = {
  metrics: Metric[];
  insights: { title: string; text: string; badge: string }[];
};

export type SettingsPageData = {
  cards: SettingsCard[];
};

const pendingPaymentStatuses = ["pending", "waiting_payment", "unpaid", "manual_check"];

export function getSupabaseConnectionStatus() {
  return {
    publicConfigured: hasSupabasePublicEnv(),
    serviceConfigured: hasSupabaseServiceRoleEnv(),
  };
}

export async function getDashboardPageData(): Promise<DashboardPageData> {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return {
      metrics: dashboardMetrics,
      classes: upcomingClasses,
      unpaidRecords: [],
    };
  }

  const [events, participantsData, enrollments, payments] = await Promise.all([
    loadEvents(),
    loadParticipants(),
    loadEnrollments(),
    loadPayments(),
  ]);

  if (!events || !participantsData || !enrollments || !payments) {
    return {
      metrics: dashboardMetrics,
      classes: upcomingClasses,
      unpaidRecords: [],
    };
  }

  const totalRevenue = payments
    .filter((payment) => normalize(payment.status).includes("paid") || normalize(payment.status).includes("оплачен"))
    .reduce((sum, payment) => sum + (payment.amount_rub ?? 0), 0);
  const soldSpots = events.reduce((sum, event) => sum + (event.booked_count ?? 0), 0);
  
  // Для расчета заполняемости исключаем бесплатные события-заглушки (capacity >= 10000)
  const eventsForFillRate = events.filter(e => (e.capacity ?? 0) < 10000);
  const fillRateSold = eventsForFillRate.reduce((sum, event) => sum + (event.booked_count ?? 0), 0);
  const fillRateCapacity = eventsForFillRate.reduce((sum, event) => sum + (event.capacity ?? 0), 0);
  const fillRate = fillRateCapacity > 0 ? Math.round((fillRateSold / fillRateCapacity) * 100) : 0;

  const freeSpots = eventsForFillRate.reduce(
    (sum, event) => sum + Math.max((event.capacity ?? 0) - (event.booked_count ?? 0), 0),
    0,
  );
  const waitingPayment = enrollments.filter((row) => isPendingPaymentStatus(row.payment_status)).length;
  const repeatParticipants = participantsData.filter((row) => (row.visits_count ?? 0) > 1).length;
  const waitlistCount = events.reduce((sum, event) => sum + (event.waitlist_count ?? 0), 0);

  const unpaidRecords = enrollments
    .filter((row) => isPendingPaymentStatus(row.payment_status))
    .map((row) => ({
      participant: row.participant?.full_name ?? "-",
      className: row.event?.title ?? "-",
      payment: row.payment_status ?? "Ждет оплату",
      confirmation: row.confirmation_status ?? "Ожидает",
      contact: row.participant?.telegram ?? row.participant?.phone ?? row.participant?.email ?? "-",
      source: row.source ?? "-",
      status: row.status ?? "Активна",
      action: "Открыть",
    }));

  return {
    metrics: [
      { label: "Выручка", value: formatMoney(totalRevenue), hint: "По подтвержденным платежам" },
      { label: "Занятий", value: String(events.length), hint: "Всего в базе" },
      { label: "Продано мест", value: String(soldSpots), hint: "По всем занятиям" },
      { label: "Свободных мест", value: String(freeSpots), hint: "Суммарно по афише" },
      { label: "Средняя заполняемость", value: `${fillRate}%`, hint: "По capacity и booked_count" },
      { label: "Ждут оплату", value: String(waitingPayment), hint: "Нужна сверка CRM" },
      { label: "Повторные участники", value: String(repeatParticipants), hint: "visits_count > 1" },
      { label: "Лист ожидания", value: String(waitlistCount), hint: "waitlist_count по занятиям" },
    ],
    classes: events
      .filter((event) => isFutureDate(event.starts_at))
      .slice(0, 3)
      .map((event) => ({
        id: event.id,
        title: event.title,
        subtitle: event.subtitle ?? "Занятие из текущей базы Supabase.",
        status: event.status ?? deriveEventStatus(event),
        format: event.category ?? "Практика",
        date: formatShortDate(event.starts_at),
        time: formatTimeRange(event.starts_at, event.ends_at),
        host: event.host ?? "Команда РРК",
        price: formatMoney(event.price_rub),
      })),
    unpaidRecords,
  };
}

export async function getParticipantsPageData(): Promise<ParticipantsPageData> {
  const rows = await loadParticipants();

  if (!rows) {
    return {
      metrics: participantMetrics,
      rows: participants,
    };
  }

  const totalPaid = rows.reduce((sum, row) => sum + (row.total_paid_rub ?? 0), 0);
  const totalParticipants = rows.length;
  const newParticipants = rows.filter((row) => (row.visits_count ?? 0) <= 1).length;
  const repeatParticipants = rows.filter((row) => (row.visits_count ?? 0) > 1).length;
  const regularParticipants = rows.filter((row) => (row.visits_count ?? 0) >= 3).length;
  const averageLtv = totalParticipants > 0 ? Math.round(totalPaid / totalParticipants) : 0;

  return {
    metrics: [
      { label: "Всего участников", value: String(totalParticipants), hint: "Текущая база CRM" },
      { label: "Новые", value: String(newParticipants), hint: "0-1 посещение" },
      { label: "Повторные", value: String(repeatParticipants), hint: "Больше одного занятия" },
      { label: "Постоянные", value: String(regularParticipants), hint: "3+ посещения" },
      { label: "Общая сумма оплат", value: formatMoney(totalPaid), hint: "По total_paid_rub" },
      { label: "Средний LTV", value: formatMoney(averageLtv), hint: "Оплаты / участники" },
    ],
    rows: rows.map((row) => {
      let computedNextTitle = row.next_event_title;
      let computedNextAt = row.next_event_at;
      let lastVisitDate = "";

      if (row.enrollments && row.enrollments.length > 0) {
        const futureEnrollments = row.enrollments
          .map((e) => {
            const ev = unwrapRelation(e.events);
            return ev ? { title: ev.title, starts_at: ev.starts_at, status: e.status } : null;
          })
          .filter((ev) => ev && ev.starts_at && isFutureDate(ev.starts_at) && (!ev.status || ev.status === "Активна" || normalize(ev.status).includes("active")))
          .sort((a, b) => sortByDateAsc(a?.starts_at, b?.starts_at));

        if (futureEnrollments.length > 0) {
          computedNextTitle = futureEnrollments[0]?.title ?? computedNextTitle;
          computedNextAt = futureEnrollments[0]?.starts_at ?? computedNextAt;
        }

        const pastEnrollments = row.enrollments
          .map((e) => {
            const ev = unwrapRelation(e.events);
            return ev ? { starts_at: ev.starts_at, status: e.status } : null;
          })
          .filter((ev) => ev && ev.starts_at && !isFutureDate(ev.starts_at) && normalize(ev.status).includes("visited"))
          .sort((a, b) => sortByDateDesc(a?.starts_at, b?.starts_at));
          
        if (pastEnrollments.length > 0) {
          lastVisitDate = formatShortDate(pastEnrollments[0]?.starts_at);
        }
      }

      const isRepeat = (row.visits_count ?? 0) > 0 && !!computedNextTitle;

      return {
        name: row.full_name,
        telegram: row.telegram ?? "-",
        status: row.status ?? "Новый",
        visits: String(row.visits_count ?? 0),
        paid: formatMoney(row.total_paid_rub),
        debt: formatDebt(row.unpaid_rub),
        nextClass: formatNextEvent(computedNextTitle, computedNextAt),
        tags: row.tags ?? [],
        slug: row.slug,
        isRepeat,
        lastVisitDate,
      };
    }),
  };
}

export async function getParticipantProfileData(slug: string): Promise<ParticipantProfileData> {
  const participant = await loadParticipantBySlug(slug);

  const availableEvents = (await loadEvents())?.filter(e => isFutureDate(e.starts_at)) || [];

  if (!participant) {
    return {
      profile: { ...participantProfile, id: "0" },
      finance: participantFinance,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      history: participantHistory as any,
      availableEvents: [],
    };
  }

  const enrollments = await loadEnrollmentsByParticipantId(participant.id);
  const completedVisits = enrollments.filter((row) => normalize(row.status).includes("visited")).length;
  const averageCheck = completedVisits > 0 ? Math.round((participant.total_paid_rub ?? 0) / completedVisits) : 0;
  const lastVisit = enrollments
    .filter((row) => normalize(row.status).includes("visited") && row.event?.starts_at)
    .sort((left, right) => sortByDateDesc(left.event?.starts_at, right.event?.starts_at))[0];
  const nextEnrollment = enrollments
    .filter((row) => row.event?.starts_at && isFutureDate(row.event.starts_at))
    .sort((left, right) => sortByDateAsc(left.event?.starts_at, right.event?.starts_at))[0];

  return {
    profile: {
      id: participant.id,
      name: participant.full_name,
      status: participant.status ?? "Новый",
      tags: participant.tags ?? [],
      telegram: participant.telegram ?? "-",
      phone: participant.phone ?? "-",
      email: participant.email ?? "-",
      source: participant.source ?? "-",
      firstContact: formatShortDate(participant.first_contact_at),
      note: participant.note ?? "Комментарий пока не добавлен.",
    },
    finance: [
      { label: "Всего оплатил", value: formatMoney(participant.total_paid_rub), hint: "Из профиля участника" },
      { label: "Количество посещений", value: String(completedVisits), hint: "По статусу visited" },
      { label: "Средний чек", value: formatMoney(averageCheck), hint: "total_paid_rub / посещения" },
      {
        label: "Последнее посещение",
        value: lastVisit?.event?.starts_at ? formatShortDate(lastVisit.event.starts_at) : "-",
        hint: "Последнее подтвержденное посещение",
      },
      {
        label: "Ближайшая запись",
        value: nextEnrollment?.event?.starts_at ? formatShortDate(nextEnrollment.event.starts_at) : "-",
        hint: nextEnrollment?.event?.title ?? "Пока нет будущих записей",
      },
      { label: "Неоплачено", value: formatMoney(participant.unpaid_rub), hint: "По профилю участника" },
    ],
    history:
      enrollments.length > 0
        ? enrollments.map((row) => ({
            id: row.id,
            event_id: row.event?.id,
            date: formatShortDate(row.event?.starts_at),
            className: row.event?.title ?? "Без названия",
            payment: row.payment_status ?? "Не указано",
            status: row.status ?? "Активна",
            note: row.note ?? "-",
          }))
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        : (participantHistory as any),
    availableEvents: availableEvents.map(e => ({
      id: e.id,
      title: e.title,
      starts_at: e.starts_at,
      status: e.status
    })),
  };
}

export async function getPaymentsPageData(): Promise<TablePageData> {
  const [rows, enrollments] = await Promise.all([loadPayments(), loadEnrollments()]);

  if (!rows) {
    return {
      metrics: paymentsMetrics,
      rows: paymentRows,
    };
  }

  // Create a mapping from participant_id + event_id -> source to attach source to payments
  const sourceMap = new Map<string, string>();
  if (enrollments) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    enrollments.forEach((enrollment: any) => {
      if (enrollment.participant && enrollment.event) {
        const key = `${enrollment.participant.full_name}-${enrollment.event.title}`;
        sourceMap.set(key, enrollment.source || "Сайт");
      }
    });
  }

  const paidRows = rows.filter((row) => normalize(row.status).includes("paid") || normalize(row.status).includes("оплач"));
  const waitingRows = rows.filter((row) => isPendingPaymentStatus(row.status) || normalize(row.status).includes("ожид") || normalize(row.status).includes("ждет"));
  const totalRevenue = paidRows.reduce((sum, row) => sum + (row.amount_rub ?? 0), 0);
  const averageCheck = paidRows.length > 0 ? Math.round(totalRevenue / paidRows.length) : 0;

  return {
    metrics: [
      { label: "Оплачено", value: String(paidRows.length), hint: "Платежи подтверждены" },
      { label: "Ожидают сверки", value: String(waitingRows.length), hint: "Нужно проверить вручную" },
      { label: "Выручка", value: formatMoney(totalRevenue), hint: "По проведенным оплатам" },
      { label: "Средний чек", value: formatMoney(averageCheck), hint: "По подтвержденным платежам" },
    ],
    rows: rows.map((row) => {
      const key = `${row.participant?.full_name}-${row.event?.title}`;
      const source = sourceMap.get(key) || "Сайт";
      
      return {
        date: formatShortDate(row.paid_at),
        participant: row.participant?.full_name ?? "-",
        purpose: row.event?.title ?? "-",
        method: row.method ?? "Не указан",
        amount: formatMoney(row.amount_rub),
        source: source,
        status: row.status ?? "Ждет",
        action: "Открыть",
      };
    }),
  };
}

export async function getClassesPageData(): Promise<ClassesPageData> {
  const rows = await loadEvents();

  if (!rows) {
    return {
      metrics: classesMetrics,
      rows: classRows,
      summaries: classRows.map((row, idx) => createFallbackClassSummary(row, idx)),
    };
  }

  const openCount = rows.filter((row) => deriveEventStatus(row) === "Открыто").length;
  const soldOutCount = rows.filter((row) => deriveEventStatus(row) === "SOLD OUT").length;
  const freeSpots = rows.reduce(
    (sum, row) => sum + Math.max((row.capacity ?? 0) - (row.booked_count ?? 0), 0),
    0,
  );
  const waitingPayments = rows.reduce((sum, row) => sum + (row.pending_count ?? 0), 0);
  const potentialRevenue = rows.reduce((sum, row) => sum + ((row.capacity ?? 0) * (row.price_rub ?? 0)), 0);

  return {
    metrics: [
      { label: "Всего занятий", value: String(rows.length), hint: "Текущая база афиши" },
      { label: "Открыто для записи", value: String(openCount), hint: "Есть свободные места" },
      { label: "SOLD OUT", value: String(soldOutCount), hint: "Свободных мест нет" },
      { label: "Свободных мест", value: String(freeSpots), hint: "По всем занятиям" },
      { label: "Ожидают оплаты", value: String(waitingPayments), hint: "По pending_count" },
      { label: "Потенциальная выручка", value: formatMoney(potentialRevenue), hint: "capacity * price_rub" },
    ],
    summaries: rows.map((row) => {
      const capacity = row.capacity ?? 0;
      const booked = row.booked_count ?? 0;
      const paid = row.paid_count ?? 0;
      const pending = row.pending_count ?? 0;
      const free = Math.max(capacity - booked, 0);

      return {
        id: row.id,
        title: row.title,
        date: formatShortDate(row.starts_at),
        time: formatTimeRange(row.starts_at, row.ends_at),
        host: row.host ?? "Команда РРК",
        format: row.category ?? "Практика",
        status: row.status ?? deriveEventStatus(row),
        booked,
        capacity,
        paid,
        pending,
        free,
        waitlist: row.waitlist_count ?? 0,
        canceled: 0, // This needs proper data structure if we track canceled per event, assuming 0 for now
        revenue: formatMoney(paid * (row.price_rub ?? 0)),
      };
    }),
    rows: rows.map((row) => ({
      date: formatShortDate(row.starts_at),
      time: formatTimeRange(row.starts_at, row.ends_at),
      title: row.title,
      format: row.category ?? "Практика",
      host: row.host ?? "Команда РРК",
      enrolled: `${row.booked_count ?? 0} из ${row.capacity ?? 0}`,
      paid: String(row.paid_count ?? 0),
      pending: String(row.pending_count ?? 0),
      free: String(Math.max((row.capacity ?? 0) - (row.booked_count ?? 0), 0)),
      revenue: formatMoney((row.paid_count ?? 0) * (row.price_rub ?? 0)),
      status: row.status ?? deriveEventStatus(row),
      action: "Открыть",
    })),
  };
}

export async function getRecordsPageData(): Promise<RecordsPageData> {
  const [enrollments, events] = await Promise.all([loadEnrollments(), loadEvents()]);

  if (!enrollments || !events) {
    return {
      funnelMetrics: recordMetrics,
      attentionMetrics,
      rows: recordRows,
    };
  }

  const pending = enrollments.filter((row) => isPendingPaymentStatus(row.payment_status)).length;
  const paid = enrollments.filter((row) => normalize(row.payment_status).includes("paid")).length;
  const confirmed = enrollments.filter((row) => normalize(row.confirmation_status).includes("confirm")).length;
  const waitlist = enrollments.filter((row) => normalize(row.status).includes("wait")).length;
  const canceled = enrollments.filter((row) => normalize(row.status).includes("cancel")).length;
  const withoutContact = enrollments.filter((row) => {
    const participant = row.participant;
    return !participant?.telegram && !participant?.phone && !participant?.email;
  }).length;
  const oneOrTwoSpotsLeft = events.filter((row) => {
    const free = Math.max((row.capacity ?? 0) - (row.booked_count ?? 0), 0);
    return free > 0 && free <= 2;
  }).length;
  const reminders = enrollments.filter((row) => Boolean(row.note)).length;

  return {
    funnelMetrics: [
      { label: "Всего записей", value: String(enrollments.length), hint: "По таблице enrollments" },
      { label: "Ждут оплату", value: String(pending), hint: "pending / unpaid / manual_check" },
      { label: "Оплачено", value: String(paid), hint: "Есть подтвержденный платеж" },
      { label: "Подтверждено", value: String(confirmed), hint: "confirmation_status = confirmed" },
      { label: "В листе ожидания", value: String(waitlist), hint: "Статус waitlist" },
      { label: "Отмены / переносы", value: String(canceled), hint: "Статусы c cancel" },
    ],
    attentionMetrics: [
      { label: "Ждут оплату", value: String(pending), hint: "Нужно проверить платежи" },
      { label: "Без контакта", value: String(withoutContact), hint: "Нет Telegram, телефона и email" },
      { label: "Осталось 1-2 места", value: String(oneOrTwoSpotsLeft), hint: "Можно дожать афишу" },
      { label: "Лист ожидания", value: String(waitlist), hint: "Записи со статусом waitlist" },
      { label: "Напомнить", value: String(reminders), hint: "Есть комментарий у записи" },
    ],
    rows: enrollments.map((row) => ({
      participant: row.participant?.full_name ?? "-",
      className: row.event?.title ?? "-",
      payment: row.payment_status ?? "Ждет оплату",
      confirmation: row.confirmation_status ?? "Ожидает",
      contact: row.participant?.telegram ?? row.participant?.phone ?? row.participant?.email ?? "-",
      source: row.source ?? "-",
      status: row.status ?? "Активна",
      action: "Открыть",
    })),
  };
}

export async function getExpensesPageData(): Promise<TablePageData> {
  const rows = await loadExpenses();

  if (!rows) {
    return {
      metrics: expenseMetrics,
      rows: expenseRows,
    };
  }

  const paid = rows.filter((row) => normalize(row.status).includes("paid"));
  const planned = rows.filter((row) => normalize(row.status).includes("plan"));
  const totalPaid = paid.reduce((sum, row) => sum + (row.amount_rub ?? 0), 0);
  const totalPlanned = planned.reduce((sum, row) => sum + (row.amount_rub ?? 0), 0);
  const margin = totalPaid > 0 ? Math.max(0, 100 - Math.round((totalPaid / Math.max(totalPaid + totalPlanned, 1)) * 100)) : 0;

  return {
    metrics: [
      { label: "Расходы", value: formatMoney(totalPaid), hint: "Подтвержденные списания" },
      { label: "Маржинальность", value: `${margin}%`, hint: "Черновой расчет для CRM" },
      { label: "Постоянные расходы", value: formatMoney(sumByCategory(rows, "Аренда", "Сервисы")), hint: "Повторяющиеся статьи" },
      { label: "Переменные расходы", value: formatMoney(sumOtherCategories(rows, ["Аренда", "Сервисы"])), hint: "Под мероприятия и маркетинг" },
    ],
    rows: rows.map((row) => ({
      date: formatShortDate(row.spent_at),
      category: row.category ?? "-",
      description: row.description ?? "-",
      amount: formatMoney(row.amount_rub),
      period: row.period_label ?? "-",
      status: row.status ?? "План",
      action: "Открыть",
    })),
  };
}

export async function getReviewsPageData(): Promise<TablePageData> {
  const rows = await loadReviews();

  if (!rows) {
    return {
      metrics: reviewMetrics,
      rows: reviewRows,
    };
  }

  const newRows = rows.filter((row) => normalize(row.status).includes("new")).length;
  const approvedRows = rows.filter((row) => normalize(row.status).includes("approve")).length;
  const averageRatingRaw =
    rows.length > 0 ? rows.reduce((sum, row) => sum + (row.rating ?? 0), 0) / rows.length : 0;

  return {
    metrics: [
      { label: "Новых отзывов", value: String(newRows), hint: "Статус new" },
      { label: "Средняя оценка", value: averageRatingRaw > 0 ? averageRatingRaw.toFixed(1) : "-", hint: "По rating" },
      { label: "Ждут публикации", value: String(approvedRows), hint: "Можно выводить на сайт" },
      { label: "Всего отзывов", value: String(rows.length), hint: "Текущая таблица reviews" },
    ],
    rows: rows.map((row) => ({
      author: row.author_name ?? "-",
      source: row.source ?? "-",
      text: row.text ?? "-",
      rating: row.rating ? `${row.rating}/5` : "-",
      status: row.status ?? "Черновик",
      action: "Открыть",
    })),
  };
}

export async function getAnalyticsPageData(): Promise<AnalyticsPageData> {
  const [participantsData, enrollments, payments, events] = await Promise.all([
    loadParticipants(),
    loadEnrollments(),
    loadPayments(),
    loadEvents(),
  ]);

  if (!participantsData || !enrollments || !payments || !events) {
    return {
      metrics: analyticsMetrics,
      insights: defaultInsights,
    };
  }

  const paidCount = payments.filter((row) => normalize(row.status).includes("paid")).length;
  const conversion = enrollments.length > 0 ? Math.round((paidCount / enrollments.length) * 100) : 0;
  const repeatCount = participantsData.filter((row) => (row.visits_count ?? 0) > 1).length;
  const repeatShare = participantsData.length > 0 ? Math.round((repeatCount / participantsData.length) * 100) : 0;
  const totalCapacity = events.reduce((sum, row) => sum + (row.capacity ?? 0), 0);
  const totalBooked = events.reduce((sum, row) => sum + (row.booked_count ?? 0), 0);
  const avgLoad = totalCapacity > 0 ? Math.round((totalBooked / totalCapacity) * 100) : 0;
  const totalRevenue = payments
    .filter((row) => normalize(row.status).includes("paid"))
    .reduce((sum, row) => sum + (row.amount_rub ?? 0), 0);
  const marketingSpend = (await loadExpenses())?.reduce((sum, row) => {
    if (normalize(row.category).includes("marketing")) {
      return sum + (row.amount_rub ?? 0);
    }
    return sum;
  }, 0) ?? 0;
  const romi = marketingSpend > 0 ? Math.round(((totalRevenue - marketingSpend) / marketingSpend) * 100) : 0;

  return {
    metrics: [
      { label: "ROMI кампаний", value: `${romi >= 0 ? "+" : ""}${romi}%`, hint: "Черновой расчет по marketing" },
      { label: "Повторные записи", value: `${repeatShare}%`, hint: "Участники с visits_count > 1" },
      { label: "Конверсия в оплату", value: `${conversion}%`, hint: "Запись -> платеж" },
      { label: "Средняя загрузка", value: `${avgLoad}%`, hint: "booked_count / capacity" },
    ],
    insights: buildInsights({
      pendingPayments: enrollments.filter((row) => isPendingPaymentStatus(row.payment_status)).length,
      nearSoldOut: events.filter((row) => {
        const free = Math.max((row.capacity ?? 0) - (row.booked_count ?? 0), 0);
        return free > 0 && free <= 2;
      }).length,
      repeatShare,
      topSource: mostFrequent(
        participantsData.map((row) => row.source).filter((value): value is string => Boolean(value)),
      ),
    }),
  };
}

export async function getSettingsPageData(): Promise<SettingsPageData> {
  const status = getSupabaseConnectionStatus();

  return {
    cards: settingsCards.map((card) => {
      if (card.title !== "Supabase") {
        return card;
      }

      if (status.publicConfigured && status.serviceConfigured) {
        return {
          ...card,
          text: "Подключение готово: public env и service role key найдены. Можно читать реальные данные CRM и сайта из Supabase.",
        };
      }

      return {
        ...card,
        text: "Supabase пока не подключен. Нужны NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY и SUPABASE_SERVICE_ROLE_KEY.",
      };
    }),
  };
}

const defaultInsights = [
  {
    title: "Лучший канал",
    text: "Когда появятся реальные данные source, здесь можно будет видеть, какой канал приводит самый теплый трафик.",
    badge: "Источник",
  },
  {
    title: "Риск недели",
    text: "Как только CRM начнет читать enrollments и events из Supabase, здесь появятся реальные занятия с нехваткой мест или оплат.",
    badge: "Требует внимания",
  },
  {
    title: "Точка роста",
    text: "После подключения платежей и записей можно будет считать реальные повторы, загрузку и точки роста без ручной сводки.",
    badge: "Потенциал",
  },
];

function buildInsights({
  pendingPayments,
  nearSoldOut,
  repeatShare,
  topSource,
}: {
  pendingPayments: number;
  nearSoldOut: number;
  repeatShare: number;
  topSource: string;
}) {
  return [
    {
      title: "Лучший канал",
      text: `Сейчас самый частый источник в CRM: ${topSource}. Дальше это можно связать с реальными оплатами и возвратами.`,
      badge: topSource,
    },
    {
      title: "Риск недели",
      text: `Ждут сверки ${pendingPayments} записей, а у ${nearSoldOut} занятий осталось 1-2 места. Это главная точка ручной проверки.`,
      badge: "Требует внимания",
    },
    {
      title: "Точка роста",
      text: `Доля повторных участников сейчас ${repeatShare}%. Это основа для LTV, ретеншна и будущих автоматических касаний.`,
      badge: "Потенциал",
    },
  ];
}

async function loadEvents() {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("events")
    .select(
      "id, title, subtitle, category, city, host, status, starts_at, ends_at, price_rub, capacity, booked_count, paid_count, pending_count, waitlist_count, is_published",
    )
    .order("starts_at", { ascending: true });

  if (error) {
    console.error("Supabase events query failed", error);
    return null;
  }

  return (data ?? []) as EventRow[];
}

async function loadParticipants() {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("participants")
    .select(
      "id, slug, full_name, telegram, phone, email, source, status, tags, visits_count, total_paid_rub, unpaid_rub, next_event_title, next_event_at, first_contact_at, note, created_at, enrollments(status, events(title, starts_at))",
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Supabase participants query failed", error);
    return null;
  }

  return (data ?? []) as ParticipantDbRow[];
}

async function loadParticipantBySlug(slug: string) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("participants")
    .select(
      "id, slug, full_name, telegram, phone, email, source, status, tags, visits_count, total_paid_rub, unpaid_rub, next_event_title, next_event_at, first_contact_at, note, created_at, enrollments(status, events(title, starts_at))",
    )
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("Supabase participant profile query failed", error);
    return null;
  }

  return (data ?? null) as ParticipantDbRow | null;
}

async function loadEnrollments() {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("enrollments")
    .select(
      "id, source, status, payment_status, confirmation_status, note, participant:participants(full_name, telegram, phone, email), event:events(id, title, starts_at)",
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Supabase enrollments query failed", error);
    return null;
  }

  return ((data ?? []) as unknown[]).map((row) => normalizeEnrollmentRow(row));
}

async function loadEnrollmentsByParticipantId(participantId: string) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("enrollments")
    .select(
      "id, source, status, payment_status, confirmation_status, note, participant:participants(full_name, telegram, phone, email), event:events(id, title, starts_at)",
    )
    .eq("participant_id", participantId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Supabase participant enrollments query failed", error);
    return [];
  }

  return ((data ?? []) as unknown[]).map((row) => normalizeEnrollmentRow(row));
}

async function loadPayments() {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("payments")
    .select("id, amount_rub, method, status, paid_at, participant:participants(full_name), event:events(title)")
    .order("paid_at", { ascending: false });

  if (error) {
    console.error("Supabase payments query failed", error);
    return null;
  }

  return ((data ?? []) as unknown[]).map((row) => normalizePaymentRow(row));
}

async function loadExpenses() {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("expenses")
    .select("id, spent_at, category, description, amount_rub, period_label, status")
    .order("spent_at", { ascending: false });

  if (error) {
    console.error("Supabase expenses query failed", error);
    return null;
  }

  return (data ?? []) as ExpenseRow[];
}

async function loadReviews() {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("reviews")
    .select("id, author_name, source, text, rating, status")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Supabase reviews query failed", error);
    return null;
  }

  return (data ?? []) as ReviewRow[];
}

function formatMoney(value: number | null | undefined) {
  const amount = value ?? 0;
  return `${new Intl.NumberFormat("ru-RU").format(amount)} Р`;
}

function formatDebt(value: number | null | undefined) {
  const amount = value ?? 0;

  if (amount <= 0) {
    return "-";
  }

  return `${new Intl.NumberFormat("ru-RU").format(amount)} Р ждет`;
}

function formatShortDate(value: string | null | undefined) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
  }).format(date);
}

function formatTimeRange(startValue: string | null | undefined, endValue: string | null | undefined) {
  if (!startValue) {
    return "-";
  }

  const start = new Date(startValue);

  if (Number.isNaN(start.getTime())) {
    return "-";
  }

  const startTime = new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(start);

  if (!endValue) {
    return startTime;
  }

  const end = new Date(endValue);

  if (Number.isNaN(end.getTime())) {
    return startTime;
  }

  const endTime = new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(end);

  return `${startTime}-${endTime}`;
}

function formatNextEvent(title: string | null, startsAt: string | null) {
  if (!title || !startsAt) {
    return "-";
  }

  return `${formatShortDate(startsAt)} | ${title.toLowerCase()}`;
}

function normalize(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function createFallbackClassSummary(row: TableRow, idx: number): ClassLoadSummary {
  const booked = extractFirstNumber(row.spots);
  const capacity = extractSecondNumber(row.spots, 10);
  const free = extractLastNumber(row.spots, Math.max(capacity - booked, 0));
  const paid = extractFirstNumber(row.payments);
  const pending = extractLastNumber(row.payments, 0);

  return {
    id: `fallback-${idx}`,
    title: row.title,
    date: row.date,
    time: row.time,
    host: row.host,
    format: row.format,
    status: row.status,
    booked,
    capacity,
    paid,
    pending,
    free,
    waitlist: 0,
    canceled: 0,
    revenue: row.revenue,
  };
}

function isPendingPaymentStatus(value: string | null | undefined) {
  return pendingPaymentStatuses.includes(normalize(value));
}

function deriveEventStatus(event: Pick<EventRow, "status" | "capacity" | "booked_count">) {
  if (event.status) {
    return event.status;
  }

  const capacity = event.capacity ?? 0;
  const bookedCount = event.booked_count ?? 0;
  const freeSpots = Math.max(capacity - bookedCount, 0);

  if (capacity > 0 && freeSpots === 0) {
    return "SOLD OUT";
  }

  if (freeSpots <= 2) {
    return "Почти заполнено";
  }

  return "Открыто";
}

function isFutureDate(value: string | null | undefined) {
  if (!value) {
    return false;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  return date.getTime() >= Date.now();
}

function sumByCategory(rows: ExpenseRow[], ...categories: string[]) {
  return rows.reduce((sum, row) => {
    if (categories.some((category) => normalize(row.category) === category.toLowerCase())) {
      return sum + (row.amount_rub ?? 0);
    }

    return sum;
  }, 0);
}

function sumOtherCategories(rows: ExpenseRow[], categories: string[]) {
  return rows.reduce((sum, row) => {
    if (!categories.some((category) => normalize(row.category) === category.toLowerCase())) {
      return sum + (row.amount_rub ?? 0);
    }

    return sum;
  }, 0);
}

function mostFrequent(values: string[]) {
  if (values.length === 0) {
    return "Не указан";
  }

  const counter = new Map<string, number>();

  for (const value of values) {
    counter.set(value, (counter.get(value) ?? 0) + 1);
  }

  return [...counter.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ?? "Не указан";
}

function extractFirstNumber(value: string | undefined) {
  const match = value?.match(/(\d+)/);
  return match ? Number(match[1]) : 0;
}

function extractSecondNumber(value: string | undefined, fallback: number) {
  const matches = value?.match(/\d+/g);
  return matches && matches.length > 1 ? Number(matches[1]) : fallback;
}

function extractLastNumber(value: string | undefined, fallback: number) {
  const matches = value?.match(/\d+/g);
  return matches && matches.length > 0 ? Number(matches[matches.length - 1]) : fallback;
}

function normalizeEnrollmentRow(raw: unknown): EnrollmentJoinedRow {
  const row = raw as {
    id: string;
    source: string | null;
    status: string | null;
    payment_status: string | null;
    confirmation_status: string | null;
    note: string | null;
    participant:
      | {
          full_name: string | null;
          telegram: string | null;
          phone: string | null;
          email: string | null;
        }
      | {
          full_name: string | null;
          telegram: string | null;
          phone: string | null;
          email: string | null;
        }[]
      | null;
    event:
      | {
          id: string;
          title: string | null;
          starts_at: string | null;
        }
      | {
          id: string;
          title: string | null;
          starts_at: string | null;
        }[]
      | null;
  };

  return {
    id: row.id,
    source: row.source,
    status: row.status,
    payment_status: row.payment_status,
    confirmation_status: row.confirmation_status,
    note: row.note,
    participant: unwrapRelation(row.participant),
    event: unwrapRelation(row.event),
  };
}

function normalizePaymentRow(raw: unknown): PaymentJoinedRow {
  const row = raw as {
    id: string;
    amount_rub: number | null;
    method: string | null;
    status: string | null;
    paid_at: string | null;
    participant:
      | {
          full_name: string | null;
        }
      | {
          full_name: string | null;
        }[]
      | null;
    event:
      | {
          title: string | null;
        }
      | {
          title: string | null;
        }[]
      | null;
  };

  return {
    id: row.id,
    amount_rub: row.amount_rub,
    method: row.method,
    status: row.status,
    paid_at: row.paid_at,
    participant: unwrapRelation(row.participant),
    event: unwrapRelation(row.event),
  };
}

function unwrapRelation<T>(value: T | T[] | null) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function sortByDateAsc(left: string | null | undefined, right: string | null | undefined) {
  return new Date(left ?? 0).getTime() - new Date(right ?? 0).getTime();
}

function sortByDateDesc(left: string | null | undefined, right: string | null | undefined) {
  return new Date(right ?? 0).getTime() - new Date(left ?? 0).getTime();
}
