"use client";

import { useState, useMemo } from "react";
import { FilterRow, SectionCard, StatusBadge } from "@/components/crm/ui";
import type { TableRow } from "@/lib/crm-data";

export function PaymentsTable({ initialRows }: { initialRows: TableRow[] }) {
  const [activeFilter, setActiveFilter] = useState("Все");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredRows = useMemo(() => {
    let result = initialRows;

    if (activeFilter === "Оплачено") {
      result = result.filter(r => r.status?.toString().toLowerCase().includes("оплач") || r.status?.toString().toLowerCase().includes("paid"));
    } else if (activeFilter === "Ждут") {
      result = result.filter(r => r.status?.toString().toLowerCase().includes("ожида") || r.status?.toString().toLowerCase().includes("wait"));
    } else if (activeFilter === "4400 ₽") {
      result = result.filter(r => r.amount?.toString().includes("4400"));
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
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(r => 
        Object.values(r).some(val => val?.toString().toLowerCase().includes(q))
      );
    }

    return result;
  }, [initialRows, activeFilter, searchQuery]);

  const headers = initialRows.length > 0 ? Object.keys(initialRows[0] ?? {}) : [];

  function formatHeader(value: string) {
    return value
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (char) => char.toUpperCase())
      .trim();
  }

  return (
    <SectionCard title="Реестр оплат" description="Основная таблица для учета платежей и сверки чеков." rightLabel={`${filteredRows.length} записей`}>
      <FilterRow
        filters={["Все", "Оплачено", "Ждут", "4400 ₽", "Бесплатные", "Перевод", "Т-Банк", "Mini App", "Сайт"]}
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
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row, index) => (
              <tr key={index}>
                {headers.map((header) => {
                  const value = row[header];
                  const normalizedHeader = header.toLowerCase();
                  const isStatus =
                    normalizedHeader.includes("status") ||
                    normalizedHeader.includes("payment") ||
                    normalizedHeader.includes("confirmation");
                  const isAction = header === "action";

                  return (
                    <td key={header}>
                      {isStatus ? (
                        <StatusBadge value={value?.toString() || ""} />
                      ) : isAction ? (
                        <button className="ghost-button">{value?.toString()}</button>
                      ) : (
                        value?.toString()
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
            {filteredRows.length === 0 && (
              <tr>
                <td colSpan={headers.length} style={{ textAlign: "center", color: "var(--muted)", padding: "40px" }}>
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