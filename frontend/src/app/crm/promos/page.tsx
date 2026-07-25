export const dynamic = "force-dynamic";

import { MetricGrid, PageHeader, SectionCard } from "@/components/crm/ui";
import { PromoCodeModal } from "@/components/crm/promo-code-modal";
import { PromoCodesTable, type PromoCodeRow } from "@/components/crm/promo-codes-table";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

type PromoCodeDbRow = {
  id: string;
  code: string;
  description: string | null;
  discount_percent: number;
  valid_from: string | null;
  expires_at: string | null;
  usage_limit: number | null;
  is_single_use: boolean;
  is_active: boolean;
  applicable_services: string[] | null;
};

type PromoUsageRow = {
  promo_code_id: string;
};

type PromoPaymentRow = {
  promo_code_id: string | null;
  discount_amount_rub: number | null;
  status: string | null;
};

export default async function PromoCodesPage() {
  const supabase = getSupabaseAdminClient();

  let rows: PromoCodeRow[] = [];
  let metrics = [
    { label: "Активные промокоды", value: "0", hint: "Действуют сейчас" },
    { label: "Всего использований", value: "0", hint: "По таблице usage" },
    { label: "С лимитом", value: "0", hint: "Есть ограничение по количеству" },
    { label: "Скидок выдано", value: "0 Р", hint: "По подтвержденным оплатам" },
  ];

  if (supabase) {
    const [promoCodesResponse, usagesResponse, paymentsResponse] = await Promise.all([
      supabase.from("promo_codes").select("id, code, description, discount_percent, valid_from, expires_at, usage_limit, is_single_use, is_active, applicable_services").order("created_at", { ascending: false }),
      supabase.from("promo_code_usages").select("promo_code_id"),
      supabase.from("payments").select("promo_code_id, discount_amount_rub, status"),
    ]);

    const promoCodes = (promoCodesResponse.data ?? []) as PromoCodeDbRow[];
    const usages = (usagesResponse.data ?? []) as PromoUsageRow[];
    const payments = (paymentsResponse.data ?? []) as PromoPaymentRow[];
    const usagesByPromoCodeId = new Map<string, number>();

    for (const usage of usages) {
      usagesByPromoCodeId.set(usage.promo_code_id, (usagesByPromoCodeId.get(usage.promo_code_id) ?? 0) + 1);
    }

    const now = Date.now();
    const activeCount = promoCodes.filter((promo) => {
      const notStarted = promo.valid_from ? new Date(promo.valid_from).getTime() > now : false;
      const expired = promo.expires_at ? new Date(promo.expires_at).getTime() < now : false;
      return promo.is_active && !notStarted && !expired;
    }).length;
    const totalDiscount = payments
      .filter((payment) => payment.promo_code_id && (payment.status ?? "").toLowerCase().includes("оплач"))
      .reduce((sum, payment) => sum + (payment.discount_amount_rub ?? 0), 0);

    metrics = [
      { label: "Активные промокоды", value: String(activeCount), hint: "Действуют сейчас" },
      { label: "Всего использований", value: String(usages.length), hint: "По таблице usage" },
      { label: "С лимитом", value: String(promoCodes.filter((promo) => Boolean(promo.usage_limit)).length), hint: "Есть ограничение по количеству" },
      { label: "Скидок выдано", value: `${new Intl.NumberFormat("ru-RU").format(totalDiscount)} Р`, hint: "По подтвержденным оплатам" },
    ];

    rows = promoCodes.map((promo) => {
      const usageCount = usagesByPromoCodeId.get(promo.id) ?? 0;
      const status = getPromoStatus(promo, now);
      return {
        id: promo.id,
        code: promo.code,
        description: promo.description ?? "",
        discount: `${promo.discount_percent}%`,
        period: formatPromoPeriod(promo.valid_from, promo.expires_at),
        used: promo.usage_limit ? `${usageCount} / ${promo.usage_limit}` : String(usageCount),
        services: promo.applicable_services?.join(", ") ?? "all",
        status,
        discountPercentRaw: promo.discount_percent,
        validFromRaw: promo.valid_from,
        expiresAtRaw: promo.expires_at,
        usageLimitRaw: promo.usage_limit,
        isSingleUseRaw: promo.is_single_use,
        isActiveRaw: promo.is_active,
        applicableServicesRaw: promo.applicable_services ?? ["all"],
      };
    });
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Скидки · Маркетинг"
        title="Промокоды"
        description="Создание и управление промокодами, лимитами, сроками действия и аналитикой применений."
        action={<PromoCodeModal triggerLabel="Добавить промокод" />}
      />

      <SectionCard title="Сводка по промокодам" description="Сколько кодов активно, сколько раз они использовались и на какую сумму дали скидку.">
        <MetricGrid items={metrics} />
      </SectionCard>

      <PromoCodesTable rows={rows} />
    </div>
  );
}

function getPromoStatus(promo: PromoCodeDbRow, now: number) {
  if (!promo.is_active) {
    return "Выключен";
  }

  if (promo.valid_from && new Date(promo.valid_from).getTime() > now) {
    return "Запланирован";
  }

  if (promo.expires_at && new Date(promo.expires_at).getTime() < now) {
    return "Истек";
  }

  return "Активен";
}

function formatPromoPeriod(validFrom: string | null, expiresAt: string | null) {
  const start = validFrom ? formatDateTime(validFrom) : "Сразу";
  const end = expiresAt ? formatDateTime(expiresAt) : "Без срока";
  return `${start} -> ${end}`;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Moscow",
  }).format(new Date(value));
}
