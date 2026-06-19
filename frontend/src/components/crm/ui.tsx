import Link from "next/link";
import type { ReactNode } from "react";

import type { Metric, TableRow } from "@/lib/crm-data";

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <header className="page-header">
      <div>
        {eyebrow ? <div className="eyebrow">{eyebrow}</div> : null}
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action ? <div className="page-header-action">{action}</div> : null}
    </header>
  );
}

export function PrimaryButton({ href, children }: { href?: string; children: ReactNode }) {
  const className = "primary-button";

  if (href) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }

  return <button className={className}>{children}</button>;
}

export function MetricGrid({ items }: { items: Metric[] }) {
  return (
    <div className="metric-grid">
      {items.map((item) => (
        <article key={item.label} className="metric-card">
          <span>{item.label}</span>
          <strong>{item.value}</strong>
          <small>{item.hint}</small>
        </article>
      ))}
    </div>
  );
}

export function SectionCard({
  title,
  description,
  rightLabel,
  children,
}: {
  title: string;
  description: string;
  rightLabel?: string;
  children: ReactNode;
}) {
  return (
    <section className="section-block">
      <div className="section-header-row">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        {rightLabel ? <span className="section-counter">{rightLabel}</span> : null}
      </div>
      {children}
    </section>
  );
}

export function StatusBadge({ value }: { value: string }) {
  const tone = getTone(value);
  return <span className={`status-badge ${tone}`}>{value}</span>;
}

export function FilterRow({
  filters,
  searchPlaceholder,
}: {
  filters: string[];
  searchPlaceholder: string;
}) {
  return (
    <div className="toolbar-row">
      <div className="chip-row">
        {filters.map((filter, index) => (
          <button key={filter} className={index === 0 ? "chip active" : "chip"}>
            {filter}
          </button>
        ))}
      </div>
      <input className="search-input" placeholder={searchPlaceholder} />
    </div>
  );
}

export function SimpleTable({ rows }: { rows: TableRow[] }) {
  const headers = Object.keys(rows[0] ?? {});

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header}>{formatHeader(header)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              {headers.map((header) => {
                const value = row[header];
                const normalizedHeader = header.toLowerCase();
                const isStatus =
                  normalizedHeader.includes("status") ||
                  normalizedHeader.includes("payment") ||
                  normalizedHeader.includes("confirmation");
                const isAction = header === "action";

                return (
                  <td key={header}>
                    {isStatus ? (
                      <StatusBadge value={value} />
                    ) : isAction ? (
                      <button className="ghost-button">{value}</button>
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
  );
}

function formatHeader(value: string) {
  return value
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (char) => char.toUpperCase())
    .trim();
}

function getTone(value: string) {
  const normalized = value.toLowerCase();

  if (
    normalized.includes("sold") ||
    normalized.includes("оплач") ||
    normalized.includes("постоян") ||
    normalized.includes("подтверж")
  ) {
    return "tone-burgundy";
  }

  if (
    normalized.includes("ждет") ||
    normalized.includes("wait") ||
    normalized.includes("почти")
  ) {
    return "tone-sand";
  }

  if (
    normalized.includes("нов") ||
    normalized.includes("откры") ||
    normalized.includes("актив") ||
    normalized.includes("посетил")
  ) {
    return "tone-green";
  }

  return "tone-gray";
}
