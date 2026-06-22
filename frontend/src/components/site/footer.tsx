import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-noise" aria-hidden="true" />
      <div className="site-footer-inner">
        <div className="site-footer-topline">
          <span>Русский Разговорный Клуб</span>
          <span>Москва</span>
          <span>2026</span>
        </div>
        <div className="site-footer-brand">
          <h2>Соберем живую встречу, после которой внутри что-то остается.</h2>
        </div>
        <div className="site-footer-columns">
          <div>
            <span>Навигация</span>
            <Link href="/#about">О клубе</Link>
            <Link href="/#formats">Программы</Link>
            <Link href="/#founders">Основатели</Link>
            <Link href="/#faq">FAQ</Link>
          </div>
          <div>
            <span>Документы</span>
            <Link href="/offer">Оферта</Link>
            <Link href="/privacy">Политика конфиденциальности</Link>
            <Link href="/consent">Согласие на обработку ПД</Link>
          </div>
          <div>
            <span>Контакты</span>
            <a href="mailto:hello@rrclub.ru">hello@rrclub.ru</a>
            <a href="mailto:club@rrclub.ru">club@rrclub.ru</a>
            <div style={{ marginTop: '12px' }}>
              <a href="https://t.me/rrclubb" target="_blank" rel="noreferrer" style={{ display: 'block', marginBottom: '4px' }}>
                Telegram
              </a>
              <a
                href="https://www.instagram.com/rrclub.msc?igsh=MTA5bWN1eWl0a3k0Mg%3D%3D&utm_source=qr"
                target="_blank"
                rel="noreferrer"
              >
                Instagram
              </a>
            </div>
          </div>
        </div>
        <div className="site-footer-wave" aria-hidden="true" style={{ marginTop: '-40px' }}>
          <img src="/Безымянный-1_Монтажная область 1 копия 15.webp" alt="РРК" style={{ width: '100%', maxWidth: '800px', display: 'block', margin: '0 auto' }} />
        </div>
      </div>
    </footer>
  );
}