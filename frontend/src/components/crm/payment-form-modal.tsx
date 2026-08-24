"use client";

import { useState, type ReactNode } from "react";

import { savePayment } from "@/app/crm/actions";
import { formatDateTimeLocalMoscow } from "@/lib/moscow-datetime";

export type PaymentFormOption = {
  id: string;
  label: string;
};

export type PaymentFormInitialData = {
  id?: string;
  participantId?: string;
  eventId?: string;
  amountRub?: number;
  method?: string;
  status?: string;
  paidAt?: string;
  promoCodeId?: string;
  discountAmountRub?: number;
};

type PaymentFormModalProps = {
  triggerLabel: string;
  triggerClassName?: string;
  participants: PaymentFormOption[];
  events: PaymentFormOption[];
  promoCodes: PaymentFormOption[];
  initialData?: PaymentFormInitialData;
};

const fieldStyle = {
  width: "100%",
  padding: "8px",
  borderRadius: "6px",
  border: "1px solid var(--line)",
  background: "transparent",
  color: "inherit",
} as const;

export function PaymentFormModal({
  triggerLabel,
  triggerClassName,
  participants,
  events,
  promoCodes,
  initialData,
}: PaymentFormModalProps) {
  const isEditMode = Boolean(initialData?.id);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<PaymentFormInitialData>({
    id: initialData?.id,
    participantId: initialData?.participantId ?? "",
    eventId: initialData?.eventId ?? "",
    amountRub: initialData?.amountRub ?? 0,
    method: initialData?.method ?? "Наличные / Перевод",
    status: initialData?.status ?? "Оплачен",
    paidAt: formatDateTimeLocalMoscow(initialData?.paidAt),
    promoCodeId: initialData?.promoCodeId ?? "",
    discountAmountRub: initialData?.discountAmountRub ?? 0,
  });

  const updateField = <K extends keyof PaymentFormInitialData>(key: K, value: PaymentFormInitialData[K]) => {
    setFormData((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await savePayment({
        id: formData.id,
        participantId: formData.participantId ?? "",
        eventId: formData.eventId || null,
        amountRub: Number(formData.amountRub ?? 0),
        method: formData.method ?? "",
        status: formData.status ?? "Оплачен",
        paidAt: formData.paidAt ?? "",
        promoCodeId: formData.promoCodeId || null,
        discountAmountRub: Number(formData.discountAmountRub ?? 0),
      });

      setIsOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Ошибка при сохранении оплаты";
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
              maxWidth: "720px",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2>{isEditMode ? "Редактирование оплаты" : "Новая оплата"}</h2>
              <button type="button" className="ghost-button" onClick={() => setIsOpen(false)}>
                Закрыть
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
                <Field label="Участник *">
                  <select
                    value={formData.participantId ?? ""}
                    onChange={(e) => updateField("participantId", e.target.value)}
                    required
                    style={fieldStyle}
                  >
                    <option value="">Выберите участника</option>
                    {participants.map((participant) => (
                      <option key={participant.id} value={participant.id}>
                        {participant.label}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Занятие">
                  <select
                    value={formData.eventId ?? ""}
                    onChange={(e) => updateField("eventId", e.target.value)}
                    style={fieldStyle}
                  >
                    <option value="">Без привязки к занятию</option>
                    {events.map((eventOption) => (
                      <option key={eventOption.id} value={eventOption.id}>
                        {eventOption.label}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Сумма, Р *">
                  <input
                    type="number"
                    min={0}
                    value={formData.amountRub ?? 0}
                    onChange={(e) => updateField("amountRub", Number(e.target.value))}
                    required
                    style={fieldStyle}
                  />
                </Field>

                <Field label="Скидка, Р">
                  <input
                    type="number"
                    min={0}
                    value={formData.discountAmountRub ?? 0}
                    onChange={(e) => updateField("discountAmountRub", Number(e.target.value))}
                    style={fieldStyle}
                  />
                </Field>

                <Field label="Способ оплаты">
                  <select
                    value={formData.method ?? "Наличные / Перевод"}
                    onChange={(e) => updateField("method", e.target.value)}
                    style={fieldStyle}
                  >
                    <option value="Наличные / Перевод">Наличные / Перевод</option>
                    <option value="Т-Банк">Т-Банк</option>
                    <option value="СБП">СБП</option>
                    <option value="Бесплатно">Бесплатно</option>
                  </select>
                </Field>

                <Field label="Статус">
                  <select
                    value={formData.status ?? "Оплачен"}
                    onChange={(e) => updateField("status", e.target.value)}
                    style={fieldStyle}
                  >
                    <option value="Оплачен">Оплачен</option>
                    <option value="Ожидает">Ожидает</option>
                    <option value="Возврат">Возврат</option>
                  </select>
                </Field>

                <Field label="Дата и время оплаты">
                  <input
                    type="datetime-local"
                    value={formData.paidAt ?? ""}
                    onChange={(e) => updateField("paidAt", e.target.value)}
                    style={fieldStyle}
                  />
                </Field>

                <Field label="Промокод">
                  <select
                    value={formData.promoCodeId ?? ""}
                    onChange={(e) => updateField("promoCodeId", e.target.value)}
                    style={fieldStyle}
                  >
                    <option value="">Без промокода</option>
                    {promoCodes.map((promoCode) => (
                      <option key={promoCode.id} value={promoCode.id}>
                        {promoCode.label}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <button type="submit" className="primary-button" disabled={isSubmitting}>
                {isSubmitting ? "Сохраняю..." : isEditMode ? "Сохранить оплату" : "Добавить оплату"}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "14px" }}>
      <span>{label}</span>
      {children}
    </label>
  );
}

