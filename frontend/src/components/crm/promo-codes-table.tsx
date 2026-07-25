"use client";

import { useMemo, useState } from "react";
import { deletePromoCode } from "@/app/crm/actions";
import { FilterRow, SectionCard, StatusBadge } from "@/components/crm/ui";
import { PromoCodeModal, type PromoCodeInitialData } from "@/components/crm/promo-code-modal";

export type PromoCodeRow = {
  id: string;
  code: string;
  discount: string;
  period: string;
  used: string;
  services: string;
  status: string;
  description?: string;
  discountPercentRaw: number;
  validFromRaw?: string | null;
  expiresAtRaw?: string | null;
  usageLimitRaw?: number | null;
  isSingleUseRaw: boolean;
  isActiveRaw: boolean;
  applicableServicesRaw: string[];
};

export function PromoCodesTable({ rows }: { rows: PromoCodeRow[] }) {
  const [activeFilter, setActiveFilter] = useState("Все");
  const [searchQuery, setSearchQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const filteredRows = useMemo(() => {
    let result = rows;

    if (activeFilter === "Активные") {
      result = result.filter((row) => row.status.toLowerCase().includes("актив"));
    } else if (activeFilter === "Истекшие") {
      result = result.filter((row) => row.status.toLowerCase().includes("истек"));
    } else if (activeFilter === "Выключенные") {
      result = result.filter((row) => row.status.toLowerCase().includes("выключ"));
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((row) =>
        [row.code, row.description, row.services, row.period].some((value) =>
          String(value ?? "").toLowerCase().includes(query),
        ),
      );
    }

    return result;
  }, [rows, activeFilter, searchQuery]);

  const handleDelete = async (id: string) => {
    if (!confirm("Удалить этот промокод?")) {
      return;
    }

    setBusyId(id);

    try {
      await deletePromoCode(id);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Ошибка при удалении";
      alert(message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <SectionCard
      title="Список промокодов"
      description="Создание, редактирование, удаление и контроль лимитов использования."
      rightLabel={`${filteredRows.length} кодов`}
    >
      <FilterRow
        filters={["Все", "Активные", "Истекшие", "Выключенные"]}
        searchPlaceholder="Поиск по коду, описанию или услугам"
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Код</th>
              <th>Скидка</th>
              <th>Период</th>
              <th>Использовано</th>
              <th>Услуги</th>
              <th>Статус</th>
              <th>Действие</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row) => (
              <tr key={row.id}>
                <td>
                  <strong>{row.code}</strong>
                  {row.description ? <div style={{ color: "var(--muted)", fontSize: "13px", marginTop: "4px" }}>{row.description}</div> : null}
                </td>
                <td>{row.discount}</td>
                <td>{row.period}</td>
                <td>{row.used}</td>
                <td>{row.services}</td>
                <td><StatusBadge value={row.status} /></td>
                <td>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <PromoCodeModal
                      triggerLabel="Редактировать"
                      triggerClassName="ghost-button"
                      initialData={toInitialData(row)}
                    />
                    <button
                      type="button"
                      className="ghost-button"
                      style={{ color: "var(--brand)", opacity: busyId === row.id ? 0.5 : 1 }}
                      disabled={busyId === row.id}
                      onClick={() => handleDelete(row.id)}
                    >
                      Удалить
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}

function toInitialData(row: PromoCodeRow): PromoCodeInitialData {
  return {
    id: row.id,
    code: row.code,
    description: row.description,
    discountPercent: row.discountPercentRaw,
    validFrom: row.validFromRaw ?? null,
    expiresAt: row.expiresAtRaw ?? null,
    usageLimit: row.usageLimitRaw ?? null,
    isSingleUse: row.isSingleUseRaw,
    isActive: row.isActiveRaw,
    applicableServices: row.applicableServicesRaw,
  };
}
