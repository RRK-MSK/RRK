"use client";

import { useState } from "react";
import { savePromoCode } from "@/app/crm/actions";

export type PromoCodeInitialData = {
  id?: string;
  code?: string;
  description?: string;
  discountPercent?: number;
  validFrom?: string | null;
  expiresAt?: string | null;
  usageLimit?: number | null;
  isSingleUse?: boolean;
  isActive?: boolean;
  applicableServices?: string[];
};

type PromoCodeModalProps = {
  triggerLabel: string;
  triggerClassName?: string;
  initialData?: PromoCodeInitialData;
};

const fieldStyle = {
  width: "100%",
  padding: "8px",
  borderRadius: "6px",
  border: "1px solid var(--line)",
  background: "transparent",
  color: "inherit",
} as const;

export function PromoCodeModal({ triggerLabel, triggerClassName, initialData }: PromoCodeModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<PromoCodeInitialData>({
    id: initialData?.id,
    code: initialData?.code ?? "",
    description: initialData?.description ?? "",
    discountPercent: initialData?.discountPercent ?? 10,
    validFrom: formatDateTimeLocal(initialData?.validFrom),
    expiresAt: formatDateTimeLocal(initialData?.expiresAt),
    usageLimit: initialData?.usageLimit ?? null,
    isSingleUse: initialData?.isSingleUse ?? true,
    isActive: initialData?.isActive ?? true,
    applicableServices: initialData?.applicableServices ?? ["all"],
  });

  const updateField = <K extends keyof PromoCodeInitialData>(key: K, value: PromoCodeInitialData[K]) => {
    setFormData((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await savePromoCode({
        id: formData.id,
        code: formData.code ?? "",
        description: formData.description ?? "",
        discountPercent: Number(formData.discountPercent ?? 0),
        validFrom: formData.validFrom || null,
        expiresAt: formData.expiresAt || null,
        usageLimit: formData.usageLimit ? Number(formData.usageLimit) : null,
        isSingleUse: Boolean(formData.isSingleUse),
        isActive: Boolean(formData.isActive),
        applicableServices: (formData.applicableServices ?? ["all"]).filter(Boolean),
      });
      setIsOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Ошибка при сохранении промокода";
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
              maxWidth: "560px",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2>{initialData?.id ? "Редактирование промокода" : "Новый промокод"}</h2>
              <button type="button" className="ghost-button" onClick={() => setIsOpen(false)}>
                Закрыть
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <Field label="Код *">
                <input value={formData.code ?? ""} onChange={(e) => updateField("code", e.target.value.toUpperCase())} required style={fieldStyle} />
              </Field>

              <Field label="Описание">
                <textarea value={formData.description ?? ""} onChange={(e) => updateField("description", e.target.value)} rows={3} style={{ ...fieldStyle, resize: "vertical" }} />
              </Field>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
                <Field label="Скидка, % *">
                  <input type="number" min={1} max={100} value={formData.discountPercent ?? 10} onChange={(e) => updateField("discountPercent", Number(e.target.value))} required style={fieldStyle} />
                </Field>
                <Field label="Общий лимит использований">
                  <input type="number" min={1} value={formData.usageLimit ?? ""} onChange={(e) => updateField("usageLimit", e.target.value ? Number(e.target.value) : null)} placeholder="без лимита" style={fieldStyle} />
                </Field>
                <Field label="Активен с">
                  <input type="datetime-local" value={formData.validFrom ?? ""} onChange={(e) => updateField("validFrom", e.target.value)} style={fieldStyle} />
                </Field>
                <Field label="Истекает">
                  <input type="datetime-local" value={formData.expiresAt ?? ""} onChange={(e) => updateField("expiresAt", e.target.value)} style={fieldStyle} />
                </Field>
              </div>

              <Field label="Применяется к услугам">
                <input
                  value={(formData.applicableServices ?? ["all"]).join(", ")}
                  onChange={(e) => updateField("applicableServices", e.target.value.split(",").map((value) => value.trim()).filter(Boolean))}
                  placeholder="all, training, mafia"
                  style={fieldStyle}
                />
              </Field>

              <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <input type="checkbox" checked={Boolean(formData.isSingleUse)} onChange={(e) => updateField("isSingleUse", e.target.checked)} />
                Одноразовый для одного участника
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <input type="checkbox" checked={Boolean(formData.isActive)} onChange={(e) => updateField("isActive", e.target.checked)} />
                Промокод активен
              </label>

              <div style={{ display: "flex", gap: "8px" }}>
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

function formatDateTimeLocal(value?: string | null) {
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
