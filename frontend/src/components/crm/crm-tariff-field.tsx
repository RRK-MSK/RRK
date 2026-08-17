"use client";

import type { EventTariffOption } from "@/lib/event-tariffs";

type CrmTariffFieldProps = {
  options: EventTariffOption[];
  value: string;
  onChange: (ticketNote: string) => void;
};

export function CrmTariffField({ options, value, onChange }: CrmTariffFieldProps) {
  if (options.length === 0) {
    return null;
  }

  return (
    <div>
      <label style={{ display: "block", marginBottom: "4px", fontSize: "14px", color: "var(--muted)" }}>
        Тариф *
      </label>
      <select
        name="ticketNote"
        required
        value={value}
        onChange={(event) => onChange(event.target.value)}
        style={{
          width: "100%",
          padding: "8px",
          borderRadius: "6px",
          border: "1px solid var(--line)",
          background: "transparent",
          color: "inherit",
        }}
      >
        <option value="" disabled style={{ color: "black" }}>
          Выберите тариф...
        </option>
        {options.map((option) => (
          <option
            key={option.note}
            value={option.note}
            disabled={option.seatsLeft <= 0}
            style={{ color: "black" }}
          >
            {option.label} — {option.priceRub.toLocaleString("ru-RU")} ₽
            {option.seatsLeft <= 0 ? " (мест нет)" : ` (${option.seatsLeft} мест)`}
          </option>
        ))}
      </select>
    </div>
  );
}
