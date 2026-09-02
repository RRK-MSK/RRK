"use client";

import { useState, useMemo } from "react";
import { FilterRow, SectionCard } from "@/components/crm/ui";
import { deleteEvent, toggleEventVisibility, updateEventStatus } from "@/app/crm/actions";
import { EventFormModal, buildEventFormInitialFromRow } from "@/components/crm/event-form-modal";
import type { TableRow } from "@/lib/crm-data";

export function ClassesTable({ initialRows }: { initialRows: TableRow[] }) {
  const [activeFilter, setActiveFilter] = useState("Все");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleDelete = async (eventId: string) => {
    if (!confirm("Уверены, что хотите удалить это занятие? Оно исчезнет и из CRM, и с сайта.")) return;
    
    setIsDeleting(eventId);
    try {
      await deleteEvent(eventId);
    } catch (err: any) {
      alert(err.message || "Ошибка при удалении");
    } finally {
      setIsDeleting(null);
    }
  };

  const handleCancelEvent = async (eventId: string, currentStatus: string) => {
    const newStatus = currentStatus === "Отменено" ? "Открыто" : "Отменено";
    if (!confirm(`Изменить статус занятия на "${newStatus}"?`)) return;
    
    setIsDeleting(eventId);
    try {
      await updateEventStatus(eventId, newStatus);
    } catch (err: any) {
      alert(err.message || "Ошибка при обновлении статуса");
    } finally {
      setIsDeleting(null);
    }
  };

  const filteredRows = useMemo(() => {
    let result = initialRows;

    if (activeFilter === "Все") {
      result = result.filter(r => !r.status?.toString().toLowerCase().includes("прошл"));
    } else if (activeFilter === "Открыто") {
      result = result.filter(r => r.status?.toString().toLowerCase().includes("открыт") || r.status?.toString().toLowerCase().includes("open"));
    } else if (activeFilter === "Почти заполнено") {
      result = result.filter(r => r.status?.toString().toLowerCase().includes("почти"));
    } else if (activeFilter === "SOLD OUT") {
      result = result.filter(r => r.status?.toString().toLowerCase().includes("sold") || r.status?.toString().toLowerCase().includes("нет мест"));
    } else if (activeFilter === "Архив") {
      result = result.filter(r => r.status?.toString().toLowerCase().includes("прошл"));
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
    "subtitleRaw",
    "descriptionRaw",
    "categoryRaw",
    "cityRaw",
    "hostRaw",
    "startsAtRaw",
    "endsAtRaw",
    "priceRubRaw",
    "capacityRaw",
    "isPublishedRaw",
    "pricingTiersRaw",
  ]);
  const headers = initialRows.length > 0 ? Object.keys(initialRows[0] ?? {}).filter((key) => !hiddenKeys.has(key)) : [];

  return (
    <SectionCard
      title="Таблица занятий"
      description="Для быстрой сверки чисел по каждому занятию в одном месте."
      rightLabel={`${filteredRows.length} строк`}
    >
      <FilterRow
        filters={["Все", "Открыто", "Почти заполнено", "SOLD OUT", "Архив"]}
        searchPlaceholder="Поиск по названию, ведущему, формату или дате"
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
                <th key={header}>{header}</th>
              ))}
              <th>Действие</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row, index) => (
              <tr key={row.id || index}>
                {headers.map((header) => {
                  const value = row[header];
                  const normalizedHeader = header.toLowerCase();
                  const isStatus =
                    normalizedHeader === "status" ||
                    normalizedHeader === "payment" ||
                    normalizedHeader === "confirmation";
                  const isAction = header === "action";

                  if (isAction) return null;

                  return (
                    <td key={header}>
                      {isStatus ? (
                        <span className={`status-badge tone-gray`}>{value}</span>
                      ) : (
                        value
                      )}
                    </td>
                  );
                })}
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <EventFormModal
                      triggerLabel="Редактировать"
                      triggerClassName="ghost-button"
                      initialData={{
                        ...buildEventFormInitialFromRow(row as Record<string, unknown>),
                        pricingTiers: parsePricingTiers(row.pricingTiersRaw),
                      }}
                    />
                    <button
                      onClick={() => toggleEventVisibility(row.id as string, row.isPublishedRaw !== "true")}
                      className="ghost-button"
                      style={{ opacity: isDeleting === row.id ? 0.5 : 1, padding: '4px 8px', fontSize: '13px', minHeight: 'auto' }}
                      disabled={isDeleting === row.id || !row.id}
                    >
                      {row.isPublishedRaw === "true" ? "Скрыть с сайта" : "Опубликовать"}
                    </button>
                    <button 
                      onClick={() => handleCancelEvent(row.id as string, row.status as string)}
                      className="ghost-button" 
                      style={{ color: row.status === 'Отменено' ? 'var(--green)' : 'var(--muted)', opacity: isDeleting === row.id ? 0.5 : 1, padding: '4px 8px', fontSize: '13px', minHeight: 'auto' }}
                      disabled={isDeleting === row.id || !row.id}
                    >
                      {row.status === 'Отменено' ? 'Восстановить' : 'Отменить'}
                    </button>
                    <button 
                      onClick={() => handleDelete(row.id as string)}
                      className="ghost-button" 
                      style={{ color: 'var(--brand)', opacity: isDeleting === row.id ? 0.5 : 1, padding: '4px 8px', fontSize: '13px', minHeight: 'auto' }}
                      disabled={isDeleting === row.id || !row.id}
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

function parsePricingTiers(value: unknown) {
  if (typeof value !== "string" || !value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as Array<{ seat_from: number; seat_to: number | null; price_rub: number }>;
    return parsed.map((tier) => ({
      seatFrom: tier.seat_from,
      seatTo: tier.seat_to,
      priceRub: tier.price_rub,
    }));
  } catch {
    return [];
  }
}
