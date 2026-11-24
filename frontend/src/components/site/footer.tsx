import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-noise" aria-hidden="true" />
      <div className="site-footer-inner">
        <div className="site-footer-brand">
          <h2>HOMO SAPIENS 2.0</h2>
        </div>
        <div className="site-footer-columns">
          <div>
            <span>Навигация</span>
            <Link href="/#schedule">Афиша</Link>
            {/* <Link href="/#about">Философия</Link> */}
            <Link href="/#founders">Команда</Link>
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
            <div style={{ marginTop: '12px' }}>
              <a href="https://t.me/rrcnns" target="_blank" rel="noreferrer" style={{ display: 'block', marginBottom: '4px' }}>
                Telegram
              </a>
              <a
                href="https://www.instagram.com/rrclub.nns?igsh=MTA5bWN1eWl0a3k0Mg%3D%3D&utm_source=qr"
                target="_blank"
                rel="noreferrer"
              >
                Inst
              </a>
            </div>
          </div>
        </div>
        <div aria-hidden="true" style={{ gridColumn: '1 / -1', width: '100%', display: 'flex', justifyContent: 'center', overflow: 'hidden' }}>
          <img
            src="/IMG_2377.PNG"
            alt="РРК"
            style={{
              width: '100%',
              maxWidth: '800px',
              height: 'auto',
              display: 'block',
              mixBlendMode: 'lighten',
            }}
          />
        </div>
      </div>
    </footer>
  );
}