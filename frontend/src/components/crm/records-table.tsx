"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { FilterRow, SectionCard } from "@/components/crm/ui";
import type { TableRow } from "@/lib/crm-data";

export function RecordsTable({ initialRows }: { initialRows: TableRow[] }) {
  const [activeFilter, setActiveFilter] = useState("Все");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredRows = useMemo(() => {
    let result = initialRows;

    if (activeFilter === "Ждут оплату") {
      result = result.filter(r => r.payment?.toString().toLowerCase().includes("жд") || r.payment?.toString().toLowerCase().includes("ожид"));
    } else if (activeFilter === "Подтверждено") {
      result = result.filter(r => r.confirmation?.toString().toLowerCase().includes("подтвержд"));
    } else if (activeFilter === "Депозит") {
      result = result.filter(r => r.deposit === "true");
    } else if (activeFilter === "Waitlist") {
      result = result.filter(r => r.payment?.toString().toLowerCase().includes("waitlist"));
    } else if (activeFilter === "Отмены") {
      result = result.filter(r => r.status?.toString().toLowerCase().includes("отмен"));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(r => 
        Object.values(r).some(val => val?.toString().toLowerCase().includes(q))
      );
    }

    return result;
  }, [initialRows, activeFilter, searchQuery]);

  const headers = initialRows.length > 0 ? Object.keys(initialRows[0] ?? {}).filter(k => k !== "slug" && k !== "deposit") : [];

  return (
    <SectionCard title="Все записи" description="Операционная таблица заявок, оплат, посещений и переносов." rightLabel={`${filteredRows.length} записей`}>
      <FilterRow
        filters={["Все", "Ждут оплату", "Подтверждено", "Депозит", "Waitlist", "Отмены"]}
        searchPlaceholder="Поиск по участнику, занятию, источнику или контакту"
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
                <th key={header}>{header === 'className' ? 'Занятие' : header === 'participant' ? 'Участник' : header === 'payment' ? 'Оплата' : header === 'confirmation' ? 'Подтверждение' : header === 'contact' ? 'Контакт' : header === 'source' ? 'Источник' : header === 'status' ? 'Статус' : header === 'action' ? 'Действие' : header}</th>
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
                    normalizedHeader === "status" ||
                    normalizedHeader === "payment" ||
                    normalizedHeader === "confirmation";
                  const isAction = header === "action";

                  return (
                    <td key={header}>
                      {isStatus ? (
                        <span className={`status-badge ${value?.toString().includes("Оплачен") || value?.toString().includes("Подтвержд") ? 'tone-green' : value?.toString().includes("Ждет") || value?.toString().includes("Ожида") ? 'tone-sand' : 'tone-gray'}`}>{value}</span>
                      ) : isAction ? (
                        row.slug ? (
                          <Link href={`/crm/participants/${row.slug}`} className="ghost-button link-button">
                            {value}
                          </Link>
                        ) : (
                          <button className="ghost-button">{value}</button>
                        )
                      ) : (
                        value
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}
