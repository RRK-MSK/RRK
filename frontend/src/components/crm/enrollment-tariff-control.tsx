"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { changeEnrollmentTariff } from "@/app/crm/actions";
import {
  findEventTariffOption,
  formatEnrollmentTariffLabel,
  type EventTariffOption,
} from "@/lib/event-tariffs";

type EnrollmentTariffControlProps = {
  enrollmentId: string;
  options: EventTariffOption[];
  currentNote?: string | null;
  paymentStatus?: string;
  disabled?: boolean;
  compact?: boolean;
  onUpdate?: () => void;
};

function isPaidStatus(value?: string) {
  const normalized = (value ?? "").toLowerCase();
  return normalized.includes("paid") || normalized.includes("оплач");
}

export function EnrollmentTariffControl({
  enrollmentId,
  options,
  currentNote,
  paymentStatus,
  disabled = false,
  compact = false,
  onUpdate,
}: EnrollmentTariffControlProps) {
  const router = useRouter();
  const resolvedCurrentNote = findEventTariffOption(options, currentNote)?.note ?? currentNote ?? "";
  const [selectedNote, setSelectedNote] = useState(resolvedCurrentNote);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setSelectedNote(findEventTariffOption(options, currentNote)?.note ?? currentNote ?? "");
  }, [currentNote, enrollmentId, options]);

  if (options.length === 0) {
    return null;
  }

  const currentLabel = formatEnrollmentTariffLabel(currentNote);
  const hasTariffEvent = options.length >= 2;
  const showCurrentTariff = hasTariffEvent || currentLabel !== "-";

  if (!showCurrentTariff) {
    return null;
  }

  const handleChange = async (nextNote: string) => {
    if (!nextNote || nextNote === resolvedCurrentNote) {
      return;
    }

    const nextTariff = findEventTariffOption(options, nextNote);
    const currentTariff = findEventTariffOption(options, currentNote);
    if (!nextTariff) {
      return;
    }

    let confirmMessage = `Сменить тариф на «${nextTariff.label}»?`;
    if (isPaidStatus(paymentStatus) && currentTariff && nextTariff.priceRub !== currentTariff.priceRub) {
      confirmMessage += `\n\nСумма в оплате: ${currentTariff.priceRub.toLocaleString("ru-RU")} → ${nextTariff.priceRub.toLocaleString("ru-RU")} ₽`;
    } else if (!isPaidStatus(paymentStatus)) {
      confirmMessage += `\n\nСумма к оплате: ${nextTariff.priceRub.toLocaleString("ru-RU")} ₽`;
    }

    if (!confirm(confirmMessage)) {
      setSelectedNote(resolvedCurrentNote);
      return;
    }

    setIsSaving(true);
    try {
      await changeEnrollmentTariff(enrollmentId, nextNote);
      setSelectedNote(nextNote);
      onUpdate?.();
      router.refresh();
    } catch (error) {
      setSelectedNote(resolvedCurrentNote);
      const message = error instanceof Error ? error.message : "Не удалось сменить тариф";
      alert(message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!hasTariffEvent) {
    return (
      <span className="status-badge tone-gray" style={{ fontSize: "11px", minHeight: "24px", padding: "0 8px" }}>
        {currentLabel}
      </span>
    );
  }

  if (compact) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        <span style={{ fontSize: "12px", color: "var(--muted)" }}>
          Тариф: <strong style={{ color: "var(--text)" }}>{currentLabel !== "-" ? currentLabel : "Не указан"}</strong>
        </span>
        {!disabled && (
          <select
            value={selectedNote}
            disabled={isSaving}
            onChange={(event) => {
              const nextNote = event.target.value;
              setSelectedNote(nextNote);
              void handleChange(nextNote);
            }}
            style={{
              width: "100%",
              padding: "6px 8px",
              borderRadius: "6px",
              border: "1px solid var(--line)",
              background: "transparent",
              color: "inherit",
              fontSize: "12px",
            }}
          >
            <option value="" disabled style={{ color: "black" }}>
              Сменить тариф...
            </option>
            {options.map((option) => (
              <option
                key={option.note}
                value={option.note}
                disabled={option.seatsLeft <= 0 && option.note !== resolvedCurrentNote}
                style={{ color: "black" }}
              >
                {option.label} — {option.priceRub.toLocaleString("ru-RU")} ₽
                {option.note === resolvedCurrentNote
                  ? " (текущий)"
                  : option.seatsLeft <= 0
                    ? " (мест нет)"
                    : ` (${option.seatsLeft} мест)`}
              </option>
            ))}
          </select>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px", minWidth: "160px" }}>
      <span style={{ fontSize: "12px", color: "var(--muted)" }}>
        Тариф: <strong style={{ color: "var(--text)" }}>{currentLabel !== "-" ? currentLabel : "Не указан"}</strong>
      </span>
      {!disabled && (
        <select
          value={selectedNote}
          disabled={isSaving}
          onChange={(event) => {
            const nextNote = event.target.value;
            setSelectedNote(nextNote);
            void handleChange(nextNote);
          }}
          style={{
            width: "100%",
            padding: "6px 8px",
            borderRadius: "6px",
            border: "1px solid var(--line)",
            background: "transparent",
            color: "inherit",
            fontSize: "12px",
          }}
        >
          <option value="" disabled style={{ color: "black" }}>
            Сменить тариф...
          </option>
          {options.map((option) => (
            <option
              key={option.note}
              value={option.note}
              disabled={option.seatsLeft <= 0 && option.note !== resolvedCurrentNote}
              style={{ color: "black" }}
            >
              {option.label} — {option.priceRub.toLocaleString("ru-RU")} ₽
              {option.note === resolvedCurrentNote
                ? " (текущий)"
                : option.seatsLeft <= 0
                  ? " (мест нет)"
                  : ` (${option.seatsLeft} мест)`}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
