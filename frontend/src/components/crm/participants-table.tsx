"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { FilterRow, SectionCard, StatusBadge } from "@/components/crm/ui";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ParticipantsTable({ initialRows }: { initialRows: any[] }) {
  const [activeFilter, setActiveFilter] = useState("Все");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredRows = useMemo(() => {
    let result = initialRows;

    if (activeFilter === "Новые") {
      result = result.filter(r => r.status?.toLowerCase() === "новый");
    } else if (activeFilter === "Повторные") {
      result = result.filter(r => r.isRepeat);
    } else if (activeFilter === "Постоянные") {
      result = result.filter(r => r.visits > 3 || r.status?.toLowerCase().includes("постоян"));
    } else if (activeFilter === "В листе ожидания") {
      result = result.filter(r => r.tags?.some((t: string) => t.toLowerCase().includes("wait")));
    } else if (activeFilter === "Есть неоплаченные записи") {
      result = result.filter(r => r.debt && r.debt !== "0 ₽");
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(r => 
        r.name?.toLowerCase().includes(q) || 
        r.telegram?.toLowerCase().includes(q) || 
        r.phone?.toLowerCase().includes(q) || 
        r.email?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [initialRows, activeFilter, searchQuery]);

  return (
    <SectionCard
      title="Все участники"
      description="Компактная база для ежедневной работы с людьми, касаниями и оплатами."
      rightLabel={`${filteredRows.length} участников`}
    >
      <FilterRow
        filters={["Все", "Новые", "Повторные", "Постоянные", "В листе ожидания", "Есть неоплаченные записи"]}
        searchPlaceholder="Поиск по имени, Telegram, телефону, email"
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Участник</th>
              <th>Telegram</th>
              <th>Статус</th>
              <th>Посещений</th>
              <th>Сумма оплат</th>
              <th>Неоплачено</th>
              <th>Ближайшая запись</th>
              <th>Теги</th>
              <th>Действие</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((participant) => (
              <tr key={participant.slug}>
                <td>
                  <div className="name-cell">
                    <strong>{participant.name}</strong>
                    <span>Профиль участника</span>
                    {participant.isRepeat && (
                      <div style={{ fontSize: '11px', color: 'var(--primary)', marginTop: '4px' }}>
                        🔄 Повторный визит
                        <br />
                        <span style={{ color: 'var(--muted)' }}>Был: {participant.lastVisitDate || 'Ранее'}</span>
                      </div>
                    )}
                  </div>
                </td>
                <td>{participant.telegram}</td>
                <td>
                  <StatusBadge value={participant.status} />
                </td>
                <td>{participant.visits}</td>
                <td>{participant.paid}</td>
                <td>{participant.debt}</td>
                <td>{participant.nextClass}</td>
                <td>
                  <div className="tag-row">
                    {participant.tags.map((tag: string) => (
                      <StatusBadge key={tag} value={tag} />
                    ))}
                  </div>
                </td>
                <td>
                  <Link href={`/crm/participants/${participant.slug}`} className="ghost-button link-button">
                    Открыть
                  </Link>
                </td>
              </tr>
            ))}
            {filteredRows.length === 0 && (
              <tr>
                <td colSpan={9} style={{ textAlign: "center", color: "var(--muted)", padding: "40px" }}>
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