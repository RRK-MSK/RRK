"use client";

import { useState, useMemo } from "react";
import { PaymentFormModal, type PaymentFormOption } from "@/components/crm/payment-form-modal";
import { FilterRow, SectionCard, StatusBadge } from "@/components/crm/ui";
import type { TableRow } from "@/lib/crm-data";

export function PaymentsTable({
  initialRows,
  participants,
  events,
  promoCodes,
}: {
  initialRows: TableRow[];
  participants: PaymentFormOption[];
  events: PaymentFormOption[];
  promoCodes: PaymentFormOption[];
}) {
  const [activeFilter, setActiveFilter] = useState("Все");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredRows = useMemo(() => {
    let result = initialRows;

    if (activeFilter === "Оплачено") {
      result = result.filter(r => r.status?.toString().toLowerCase().includes("оплач") || r.status?.toString().toLowerCase().includes("paid"));
    } else if (activeFilter === "Ждут") {
      result = result.filter(r => r.status?.toString().toLowerCase().includes("ожида") || r.status?.toString().toLowerCase().includes("wait"));
    } else if (activeFilter === "4400 ₽") {
      result = result.filter(r => {
        const amt = r.amount?.toString() || "";
        // Убираем все пробелы (обычные и неразрывные) перед проверкой
        return amt.replace(/\s/g, "").includes("4400");
      });
    } else if (activeFilter === "Бесплатные") {
      result = result.filter(r => r.amount?.toString().includes("0 ₽") || r.amount?.toString().toLowerCase().includes("бесплат") || !r.amount);
    } else if (activeFilter === "Перевод") {
      result = result.filter(r => r.method?.toString().toLowerCase().includes("перевод") || r.method?.toString().toLowerCase().includes("налич"));
    } else if (activeFilter === "Т-Банк") {
      result = result.filter(r => r.method?.toString().toLowerCase().includes("т-банк") || r.method?.toString().toLowerCase().includes("t-bank") || r.method?.toString().toLowerCase().includes("tbank"));
    } else if (activeFilter === "Mini App") {
      result = result.filter(r => r.source?.toString().toLowerCase().includes("mini app") || r.source?.toString().toLowerCase().includes("telegram"));
    } else if (activeFilter === "Сайт") {
      result = result.filter(r => r.source?.toString().toLowerCase() === "сайт" || r.source?.toString().toLowerCase().includes("сайт ("));
    } else if (activeFilter === "Промокоды") {
      result = result.filter(r => r.promoCode && r.promoCode !== "-");
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(r => 
        Object.values(r).some(val => val?.toString().toLowerCase().includes(q))
      );
    }

    return result;
  }, [initialRows, activeFilter, searchQuery]);

  const hiddenKeys = new Set([
    "id",
    "action",
    "slug",
    "participantIdRaw",
    "eventIdRaw",
    "paidAtRaw",
    "amountRubRaw",
    "methodRaw",
    "statusRaw",
    "promoCodeIdRaw",
    "discountAmountRubRaw",
  ]);
  const headers = initialRows.length > 0 ? Object.keys(initialRows[0] ?? {}).filter((key) => !hiddenKeys.has(key)) : [];

  function formatHeader(value: string) {
    if (value === "date") return "Дата";
    if (value === "participant") return "Участник";
    if (value === "purpose") return "Назначение";
    if (value === "method") return "Способ";
    if (value === "amount") return "Сумма";
    if (value === "promoCode") return "Промокод";
    if (value === "discount") return "Скидка";
    if (value === "source") return "Источник";
    if (value === "status") return "Статус";
    
    return value
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (char) => char.toUpperCase())
      .trim();
  }

  const exportToCsv = () => {
    if (filteredRows.length === 0) return;
    
    const csvHeaders = headers.map(formatHeader).join(",");
    const csvRows = filteredRows.map(row => {
      return headers.map(header => {
        const val = row[header] ?? "";
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(",");
    });
    
    const csvContent = [csvHeaders, ...csvRows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `payments_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <SectionCard 
      title="Реестр оплат" 
      description="Основная таблица для учета платежей и сверки чеков." 
      rightLabel={
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span style={{ color: 'var(--muted)', fontSize: '13px' }}>{filteredRows.length} записей</span>
          <button onClick={exportToCsv} className="ghost-button" style={{ padding: '4px 8px', fontSize: '13px' }}>Экспорт (CSV)</button>
        </div>
      }
    >
        <FilterRow
          filters={["Все", "Оплачено", "Ждут", "4400 ₽", "Бесплатные", "Промокоды", "Т-Банк", "Сайт"]}
          searchPlaceholder="Поиск по участнику, назначению, сумме или статусу"
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {headers.map((header) => (
                <th key={header}>{formatHeader(header)}</th>
              ))}
              <th>Действие</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row, index) => (
              <tr key={String(row.id ?? index)}>
                {headers.map((header) => {
                  const value = row[header];
                  const normalizedHeader = header.toLowerCase();
                  const isStatus =
                    normalizedHeader.includes("status") ||
                    normalizedHeader.includes("payment") ||
                    normalizedHeader.includes("confirmation");

                  return (
                    <td key={header}>
                      {isStatus ? (
                        <StatusBadge value={value?.toString() || ""} />
                      ) : (
                        value?.toString()
                      )}
                    </td>
                  );
                })}
                <td>
                  <PaymentFormModal
                    triggerLabel="Редактировать"
                    triggerClassName="ghost-button"
                    participants={participants}
                    events={events}
                    promoCodes={promoCodes}
                    initialData={{
                      id: String(row.id ?? ""),
                      participantId: String(row.participantIdRaw ?? ""),
                      eventId: String(row.eventIdRaw ?? ""),
                      amountRub: Number(row.amountRubRaw ?? 0),
                      method: String(row.methodRaw ?? "Наличные / Перевод"),
                      status: String(row.statusRaw ?? "Оплачен"),
                      paidAt: String(row.paidAtRaw ?? ""),
                      promoCodeId: String(row.promoCodeIdRaw ?? ""),
                      discountAmountRub: Number(row.discountAmountRubRaw ?? 0),
                    }}
                  />
                </td>
              </tr>
            ))}
            {filteredRows.length === 0 && (
              <tr>
                <td colSpan={headers.length + 1} style={{ textAlign: "center", color: "var(--muted)", padding: "40px" }}>
                  Ничего не найдено
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}
