"use client";

import { useState, useMemo } from "react";
import { FilterRow, SectionCard, SimpleTable } from "@/components/crm/ui";
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

  return (
    <SectionCard title="Все записи" description="Операционная таблица заявок, оплат, посещений и переносов." rightLabel={`${filteredRows.length} записей`}>
      <FilterRow
        filters={["Все", "Ждут оплату", "Подтверждено", "Waitlist", "Отмены"]}
        searchPlaceholder="Поиск по участнику, занятию, источнику или контакту"
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      <SimpleTable rows={filteredRows} />
    </SectionCard>
  );
}