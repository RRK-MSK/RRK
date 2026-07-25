"use client";

import { useMemo, useState } from "react";
import { saveEvent } from "@/app/crm/actions";

type PricingTierFormRow = {
  seatFrom: number;
  seatTo: number | null;
  priceRub: number;
};

export type EventFormInitialData = {
  id?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  category?: string;
  city?: string;
  host?: string;
  startsAt?: string;
  endsAt?: string;
  capacity?: number;
  price?: number;
  isPublished?: boolean;
  status?: string;
  pricingTiers?: PricingTierFormRow[];
};

type EventFormModalProps = {
  triggerLabel: string;
  triggerClassName?: string;
  initialData?: EventFormInitialData;
};

const fieldStyle = {
  width: "100%",
  padding: "8px",
  borderRadius: "6px",
  border: "1px solid var(--line)",
  background: "transparent",
  color: "inherit",
} as const;

export function EventFormModal({ triggerLabel, triggerClassName, initialData }: EventFormModalProps) {
  const isEditMode = Boolean(initialData?.id);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<EventFormInitialData>(() => ({
    id: initialData?.id,
    title: initialData?.title ?? "",
    subtitle: initialData?.subtitle ?? "",
    description: initialData?.description ?? "",
    category: initialData?.category ?? "Обычное",
    city: initialData?.city ?? "Москва",
    host: initialData?.host ?? "",
    startsAt: formatDateTimeLocal(initialData?.startsAt),
    endsAt: formatDateTimeLocal(initialData?.endsAt),
    capacity: initialData?.capacity ?? 10,
    price: initialData?.price ?? 4400,
    isPublished: initialData?.isPublished ?? true,
    status: initialData?.status ?? "Открыто",
    pricingTiers: initialData?.pricingTiers?.length
      ? initialData.pricingTiers
      : [],
  }));

  const pricingRows = useMemo(
    () => formData.pricingTiers ?? [],
    [formData.pricingTiers],
  );

  const updateField = <K extends keyof EventFormInitialData>(key: K, value: EventFormInitialData[K]) => {
    setFormData((current) => ({ ...current, [key]: value }));
  };

  const updatePricingRow = (index: number, patch: Partial<PricingTierFormRow>) => {
    setFormData((current) => {
      const nextRows = [...(current.pricingTiers ?? [])];
      nextRows[index] = { ...nextRows[index], ...patch };
      return { ...current, pricingTiers: nextRows };
    });
  };

  const addPricingRow = () => {
    const nextSeatFrom = pricingRows.length > 0
      ? ((pricingRows[pricingRows.length - 1].seatTo ?? pricingRows[pricingRows.length - 1].seatFrom) + 1)
      : 1;

    setFormData((current) => ({
      ...current,
      pricingTiers: [
        ...(current.pricingTiers ?? []),
        { seatFrom: nextSeatFrom, seatTo: null, priceRub: current.price ?? 0 },
      ],
    }));
  };

  const removePricingRow = (index: number) => {
    setFormData((current) => ({
      ...current,
      pricingTiers: (current.pricingTiers ?? []).filter((_, rowIndex) => rowIndex !== index),
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await saveEvent({
        id: formData.id,
        title: formData.title ?? "",
        subtitle: formData.subtitle ?? "",
        description: formData.description ?? "",
        category: formData.category ?? "",
        city: formData.city ?? "",
        host: formData.host ?? "",
        startsAt: formData.startsAt ?? "",
        endsAt: formData.endsAt ?? "",
        capacity: Number(formData.capacity ?? 10),
        price: Number(formData.price ?? 0),
        isPublished: Boolean(formData.isPublished),
        status: formData.status ?? "Открыто",
        pricingTiers: (formData.pricingTiers ?? []).map((row) => ({
          seatFrom: Number(row.seatFrom),
          seatTo: row.seatTo ? Number(row.seatTo) : null,
          priceRub: Number(row.priceRub),
        })),
      });

      setIsOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Ошибка при сохранении";
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button type="button" className={triggerClassName ?? "primary-button"} onClick={() => setIsOpen(true)}>
        {triggerLabel}
      </button>

      {isOpen ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.78)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "var(--surface-strong)",
              color: "var(--text)",
              padding: "24px",
              borderRadius: "12px",
              width: "100%",
              maxWidth: "760px",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2>{isEditMode ? "Редактирование занятия" : "Новое занятие"}</h2>
              <button type="button" className="ghost-button" onClick={() => setIsOpen(false)}>
                Закрыть
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
                <Field label="Название *">
                  <input value={formData.title ?? ""} onChange={(e) => updateField("title", e.target.value)} required style={fieldStyle} />
                </Field>
                <Field label="Подзаголовок">
                  <input value={formData.subtitle ?? ""} onChange={(e) => updateField("subtitle", e.target.value)} style={fieldStyle} />
                </Field>
                <Field label="Категория">
                  <input value={formData.category ?? ""} onChange={(e) => updateField("category", e.target.value)} style={fieldStyle} />
                </Field>
                <Field label="Город">
                  <input value={formData.city ?? ""} onChange={(e) => updateField("city", e.target.value)} style={fieldStyle} />
                </Field>
                <Field label="Ведущий">
                  <input value={formData.host ?? ""} onChange={(e) => updateField("host", e.target.value)} style={fieldStyle} />
                </Field>
                <Field label="Статус">
                  <select value={formData.status ?? "Открыто"} onChange={(e) => updateField("status", e.target.value)} style={fieldStyle}>
                    <option value="Открыто">Открыто</option>
                    <option value="Почти заполнено">Почти заполнено</option>
                    <option value="SOLD OUT">SOLD OUT</option>
                    <option value="Отменено">Отменено</option>
                  </select>
                </Field>
                <Field label="Дата и время начала *">
                  <input type="datetime-local" value={formData.startsAt ?? ""} onChange={(e) => updateField("startsAt", e.target.value)} required style={fieldStyle} />
                </Field>
                <Field label="Дата и время окончания *">
                  <input type="datetime-local" value={formData.endsAt ?? ""} onChange={(e) => updateField("endsAt", e.target.value)} required style={fieldStyle} />
                </Field>
                <Field label="Вместимость *">
                  <input type="number" min={1} value={formData.capacity ?? 10} onChange={(e) => updateField("capacity", Number(e.target.value))} required style={fieldStyle} />
                </Field>
                <Field label="Базовая цена, Р *">
                  <input type="number" min={0} value={formData.price ?? 0} onChange={(e) => updateField("price", Number(e.target.value))} required style={fieldStyle} />
                </Field>
              </div>

              <Field label="Описание для сайта / CRM">
                <textarea
                  value={formData.description ?? ""}
                  onChange={(e) => updateField("description", e.target.value)}
                  rows={4}
                  style={{ ...fieldStyle, resize: "vertical" }}
                />
              </Field>

              <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" }}>
                <input
                  type="checkbox"
                  checked={Boolean(formData.isPublished)}
                  onChange={(e) => updateField("isPublished", e.target.checked)}
                />
                Публиковать на сайте сразу после сохранения
              </label>

              <div style={{ border: "1px solid var(--line)", borderRadius: "12px", padding: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <div>
                    <strong>Ценовые пороги</strong>
                    <p style={{ marginTop: "4px", color: "var(--muted)", fontSize: "14px" }}>
                      Цена будет меняться автоматически по номеру следующего места: 1-10, 11-50 и так далее.
                    </p>
                  </div>
                  <button type="button" className="ghost-button" onClick={addPricingRow}>
                    Добавить порог
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {pricingRows.length > 0 ? pricingRows.map((row, index) => (
                    <div
                      key={`${row.seatFrom}-${index}`}
                      style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: "8px", alignItems: "end" }}
                    >
                      <Field label="Места с">
                        <input type="number" min={1} value={row.seatFrom} onChange={(e) => updatePricingRow(index, { seatFrom: Number(e.target.value) })} style={fieldStyle} />
                      </Field>
                      <Field label="по">
                        <input
                          type="number"
                          min={row.seatFrom}
                          value={row.seatTo ?? ""}
                          onChange={(e) => updatePricingRow(index, { seatTo: e.target.value ? Number(e.target.value) : null })}
                          placeholder="без лимита"
                          style={fieldStyle}
                        />
                      </Field>
                      <Field label="Цена, Р">
                        <input type="number" min={0} value={row.priceRub} onChange={(e) => updatePricingRow(index, { priceRub: Number(e.target.value) })} style={fieldStyle} />
                      </Field>
                      <button type="button" className="ghost-button" onClick={() => removePricingRow(index)}>
                        Удалить
                      </button>
                    </div>
                  )) : (
                    <div style={{ color: "var(--muted)", fontSize: "14px" }}>
                      Пока действует только базовая цена. Если добавить пороги, сайт и CRM начнут переключать стоимость автоматически.
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                <button type="button" className="ghost-button" style={{ flex: 1 }} onClick={() => setIsOpen(false)}>
                  Отмена
                </button>
                <button type="submit" className="primary-button" style={{ flex: 1 }} disabled={isSubmitting}>
                  {isSubmitting ? "Сохраняю..." : "Сохранить"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "block" }}>
      <span style={{ display: "block", marginBottom: "4px", fontSize: "14px", color: "var(--muted)" }}>{label}</span>
      {children}
    </label>
  );
}

function formatDateTimeLocal(value?: string) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const parts = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Moscow",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const getPart = (type: string) => parts.find((part) => part.type === type)?.value ?? "";

  return `${getPart("year")}-${getPart("month")}-${getPart("day")}T${getPart("hour")}:${getPart("minute")}`;
}
