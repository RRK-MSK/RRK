"use client";

import { useMemo, useState } from "react";
import { saveEvent } from "@/app/crm/actions";
import {
  EVENT_CATEGORY_COFFEE_JAM,
  EVENT_CATEGORY_KVARTIRNIK,
  EVENT_CATEGORY_OPTIONS,
  resolveEventCategoryForForm,
} from "@/lib/event-categories";
import { isUnlimitedCapacity, UNLIMITED_EVENT_CAPACITY } from "@/lib/event-capacity";
import { formatDateTimeLocalMoscow } from "@/lib/moscow-datetime";
import { formatEventPaymentForForm, parseEventPaymentInput } from "@/lib/event-payment";

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
  venueAddress?: string;
  venueMapUrl?: string;
  startsAt?: string;
  endsAt?: string;
  capacity?: number;
  unlimitedCapacity?: boolean;
  paymentInput?: string;
  price?: number;
  priceLabel?: string;
  isPublished?: boolean;
  status?: string;
  pricingTiers?: PricingTierFormRow[];
};

export function buildEventFormInitialFromRow(row: Record<string, unknown>): EventFormInitialData {
  const capacity = Number(row.capacityRaw ?? 10);
  const priceLabel = String(row.priceLabelRaw ?? "").trim() || undefined;

  return {
    id: row.id ? String(row.id) : undefined,
    title: String(row.title ?? ""),
    subtitle: String(row.subtitleRaw ?? ""),
    description: String(row.descriptionRaw ?? ""),
    category: String(row.categoryRaw ?? ""),
    city: String(row.cityRaw ?? "Москва"),
    host: String(row.hostRaw ?? ""),
    venueAddress: String(row.venueAddressRaw ?? ""),
    venueMapUrl: String(row.venueMapUrlRaw ?? ""),
    startsAt: String(row.startsAtRaw ?? ""),
    endsAt: String(row.endsAtRaw ?? ""),
    capacity: isUnlimitedCapacity(capacity) ? 10 : capacity,
    unlimitedCapacity: row.unlimitedCapacityRaw === "true" || isUnlimitedCapacity(capacity),
    paymentInput: formatEventPaymentForForm(Number(row.priceRubRaw ?? 0), priceLabel),
    price: Number(row.priceRubRaw ?? 0),
    priceLabel,
    isPublished: row.isPublishedRaw === "true",
    status: String(row.status ?? "Открыто"),
    pricingTiers: [],
  };
}

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

function buildInitialFormData(initialData?: EventFormInitialData): EventFormInitialData {
  const unlimitedCapacity = initialData?.unlimitedCapacity ?? isUnlimitedCapacity(initialData?.capacity);
  const paymentInput = initialData?.paymentInput
    ?? (initialData?.priceLabel?.trim()
      ? initialData.priceLabel.trim()
      : initialData?.price && initialData.price > 0
        ? String(initialData.price)
        : "");

  return {
    id: initialData?.id,
    title: initialData?.title ?? "",
    subtitle: initialData?.subtitle ?? "",
    description: initialData?.description ?? "",
    category: resolveEventCategoryForForm(initialData?.category, initialData?.title),
    city: initialData?.city ?? "Москва",
    host: initialData?.host ?? "",
    venueAddress: initialData?.venueAddress ?? "",
    venueMapUrl: initialData?.venueMapUrl ?? "",
    startsAt: formatDateTimeLocalMoscow(initialData?.startsAt),
    endsAt: formatDateTimeLocalMoscow(initialData?.endsAt),
    capacity: unlimitedCapacity ? 10 : (initialData?.capacity ?? 10),
    unlimitedCapacity,
    paymentInput,
    isPublished: initialData?.isPublished ?? true,
    status: initialData?.status ?? "Открыто",
    pricingTiers: initialData?.pricingTiers?.length ? initialData.pricingTiers : [],
  };
}

export function EventFormModal({ triggerLabel, triggerClassName, initialData }: EventFormModalProps) {
  const isEditMode = Boolean(initialData?.id);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<EventFormInitialData>(() => buildInitialFormData(initialData));

  const pricingRows = useMemo(
    () => formData.pricingTiers ?? [],
    [formData.pricingTiers],
  );
  const isCoffeeJam = formData.category === EVENT_CATEGORY_COFFEE_JAM;

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
    const basePrice = parseEventPaymentInput(formData.paymentInput ?? "").priceRub;

    setFormData((current) => ({
      ...current,
      pricingTiers: [
        ...(current.pricingTiers ?? []),
        { seatFrom: nextSeatFrom, seatTo: null, priceRub: basePrice },
      ],
    }));
  };

  const removePricingRow = (index: number) => {
    setFormData((current) => ({
      ...current,
      pricingTiers: (current.pricingTiers ?? []).filter((_, rowIndex) => rowIndex !== index),
    }));
  };

  const openModal = () => {
    setFormData(buildInitialFormData(initialData));
    setIsOpen(true);
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
        category: formData.category ?? EVENT_CATEGORY_KVARTIRNIK,
        city: formData.city ?? "",
        host: formData.host ?? "",
        venueAddress: formData.venueAddress ?? "",
        venueMapUrl: formData.venueMapUrl ?? "",
        startsAt: formData.startsAt ?? "",
        endsAt: formData.endsAt ?? "",
        capacity: formData.unlimitedCapacity ? UNLIMITED_EVENT_CAPACITY : Number(formData.capacity ?? 10),
        unlimitedCapacity: Boolean(formData.unlimitedCapacity),
        paymentInput: formData.paymentInput ?? "",
        isPublished: Boolean(formData.isPublished),
        status: formData.status ?? "Открыто",
        pricingTiers: isCoffeeJam
          ? (formData.pricingTiers ?? []).map((row) => ({
              seatFrom: Number(row.seatFrom),
              seatTo: row.seatTo ? Number(row.seatTo) : null,
              priceRub: Number(row.priceRub),
            }))
          : [],
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
      <button type="button" className={triggerClassName ?? "primary-button"} onClick={openModal}>
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
                <Field label="Тип мероприятия">
                  <select
                    value={formData.category ?? EVENT_CATEGORY_KVARTIRNIK}
                    onChange={(e) => updateField("category", e.target.value)}
                    style={fieldStyle}
                  >
                    {EVENT_CATEGORY_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
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
                  <input
                    type="number"
                    min={1}
                    value={formData.capacity ?? 10}
                    onChange={(e) => updateField("capacity", Number(e.target.value))}
                    required={!formData.unlimitedCapacity}
                    disabled={Boolean(formData.unlimitedCapacity)}
                    style={fieldStyle}
                  />
                </Field>
                <Field label="Оплата *">
                  <input
                    value={formData.paymentInput ?? ""}
                    onChange={(e) => updateField("paymentInput", e.target.value)}
                    placeholder="1500 или донат"
                    required
                    style={fieldStyle}
                  />
                  <span style={{ display: "block", marginTop: "4px", fontSize: "12px", color: "var(--muted)" }}>
                    Можно указать сумму (1500) или текст (донат)
                  </span>
                </Field>
              </div>

              <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" }}>
                <input
                  type="checkbox"
                  checked={Boolean(formData.unlimitedCapacity)}
                  onChange={(e) => updateField("unlimitedCapacity", e.target.checked)}
                />
                Без ограничения мест (на сайте счётчик мест не показывается)
              </label>

              <Field label="Описание для сайта">
                <textarea
                  value={formData.description ?? ""}
                  onChange={(e) => updateField("description", e.target.value)}
                  rows={5}
                  placeholder="Каждая новая строка будет отображаться отдельно на сайте"
                  style={{ ...fieldStyle, resize: "vertical", whiteSpace: "pre-wrap" }}
                />
              </Field>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
                <Field label="Адрес">
                  <input
                    value={formData.venueAddress ?? ""}
                    onChange={(e) => updateField("venueAddress", e.target.value)}
                    placeholder="ул. Примерная, 1"
                    style={fieldStyle}
                  />
                </Field>
                <Field label="Ссылка на карту">
                  <input
                    value={formData.venueMapUrl ?? ""}
                    onChange={(e) => updateField("venueMapUrl", e.target.value)}
                    placeholder="https://yandex.ru/maps/..."
                    style={fieldStyle}
                  />
                </Field>
              </div>

              <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" }}>
                <input
                  type="checkbox"
                  checked={Boolean(formData.isPublished)}
                  onChange={(e) => updateField("isPublished", e.target.checked)}
                />
                Публиковать на сайте сразу после сохранения
              </label>

              {isCoffeeJam ? (
                <div style={{ border: "1px solid var(--line)", borderRadius: "12px", padding: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <div>
                      <strong>Ценовые пороги</strong>
                      <p style={{ marginTop: "4px", color: "var(--muted)", fontSize: "14px" }}>
                        Опционально для КофеДжема: 1-10, 11-50 и так далее.
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
                        Пока действует только указанная оплата. Добавьте пороги, если цена должна расти по заполненности.
                      </div>
                    )}
                  </div>
                </div>
              ) : null}

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
