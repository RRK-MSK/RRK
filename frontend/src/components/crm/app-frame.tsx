"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";

import { crmNavItems } from "@/lib/crm-data";

export function AppFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isCrmRoute = pathname === "/crm" || pathname.startsWith("/crm/");

  if (!isCrmRoute || pathname === "/crm/login") {
    return <>{children}</>;
  }

  return (
    <div className="crm-shell">
      <div className="crm-mobile-header">
        <div className="brand-block-mini">
          <span>РРК</span>
          <strong>CRM</strong>
        </div>
        <button 
          className="crm-mobile-menu-btn" 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? "Закрыть" : "Меню"}
        </button>
      </div>

      <aside className={`sidebar ${isMobileMenuOpen ? "is-open" : ""}`}>
        <div>
          <div className="brand-block desktop-only">
            <span>русский</span>
            <strong>Разговорный Клуб</strong>
          </div>
          <nav className="sidebar-nav">
            {crmNavItems.map((item) => {
              const isActive = pathname.startsWith(item.href);

              return (
                <Link 
                  key={item.href} 
                  href={item.href} 
                  className={isActive ? "nav-link active" : "nav-link"}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="sidebar-footer">
          <p className="desktop-only">Внутренняя панель для записей, оплат и афиши РРК.</p>
          <Link href="/crm/logout" className="logout-link">
            Выйти
          </Link>
        </div>
      </aside>
      <main className="content-area">{children}</main>
    </div>
  );
}
