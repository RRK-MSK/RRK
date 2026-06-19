import Image from "next/image";

import { MerchDoodle } from "@/components/site/merch-doodle";
import { RevealOnView } from "@/components/site/reveal-on-view";
import { VideoHero } from "@/components/site/video-hero";

const programs = [
  {
    type: "Доступно сейчас",
    city: "Москва",
    date: "Разовое посещение",
    title: "4 400 ₽",
    description:
      "Сейчас в РРК доступен формат одного живого посещения: знакомство с клубом, атмосферой, участниками и практикой сильного общения.",
    status: "Можно записаться",
  },
  {
    type: "Скоро",
    city: "Москва",
    date: "Следующий этап",
    title: "Абонементы и форматы",
    description:
      "Позже появятся абонементы, интенсивы и закрытые программы. Сейчас первый вход в среду клуба открыт через разовое посещение.",
    status: "В разработке",
  },
];

const founders = [
  {
    image: "/founder-ramon.jpg",
    name: "RAMON RUZANOV",
    role: "Сооснователь",
    preview: "Окружение и личная позиция",
    description:
      "Работает с темой окружения, личной позиции и культуры сильного общения. Помогает участникам становиться собраннее, заметнее и увереннее в социальных ситуациях.",
  },
  {
    image: "/founder-alexander.jpg",
    name: "Гронский Александр",
    role: "Сооснователь",
    preview: "Живой контакт и ясная речь",
    description:
      "Ведет практики живого контакта, ясной речи и эмоциональной силы. Помогает людям говорить так, чтобы их действительно слышали и чувствовали.",
  },
  {
    image: "/founder-vlas.jpg",
    name: "Влас Ибрагимов",
    role: "Сооснователь",
    preview: "Глубина, влияние и круг людей",
    description:
      "Собирает пространство, где навыки влияния сочетаются с глубиной, человечностью и качественным кругом людей рядом.",
  },
];

const faqs = [
  {
    question: "Для кого подходит Русский Разговорный Клуб?",
    answer:
      "Для людей, которым важно говорить свободнее, глубже чувствовать контакт с другими и расти через сильное окружение. Можно прийти без опыта, если есть интерес к живому общению и внутреннему развитию.",
  },
  {
    question: "Что именно дают занятия кроме навыка речи?",
    answer:
      "РРК дает не только более ясную речь, но и уверенность в общении, ощущение опоры в группе, развитие социального влияния и более качественный круг людей рядом.",
  },
  {
    question: "Нужна ли специальная подготовка перед первой встречей?",
    answer:
      "Нет. Достаточно желания прийти в живую среду и быть внутри процесса. Формат устроен так, чтобы человек мог включиться мягко и естественно.",
  },
  {
    question: "Как устроена запись на разовое посещение?",
    answer:
      "Сейчас базовый формат входа в РРК - разовое посещение за 4 400 ₽. На следующем этапе здесь будет форма записи, оплата и автоматическая связка с CRM и Telegram.",
  },
  {
    question: "Можно ли прийти, если есть зажатость или страх общения?",
    answer:
      "Да. Для многих это и есть причина прийти в клуб. Здесь важно не изображать уверенность, а постепенно наращивать ее через практику, внимание и живой контакт.",
  },
  {
    question: "Когда появятся другие форматы и мерч?",
    answer:
      "Позже на сайте появятся полноценные карточки программ, дропы мерча, размеры, наличие и покупка. Сейчас мы закладываем структуру и визуальную подачу этих направлений.",
  },
];

export default function HomePage() {
  return (
    <main className="site-page">
      <VideoHero />

      <section className="site-runner" aria-label="Бегущая строка">
        <div className="site-runner-track">
          <span>СИЛЬНОЕ ОКРУЖЕНИЕ</span>
          <span>СОЦИАЛЬНОЕ ВЛИЯНИЕ</span>
          <span>ЖИВАЯ РЕЧЬ</span>
          <span>ХАРИЗМА</span>
          <span>ЛИДЕРСТВО</span>
          <span>СМЕЛОСТЬ БЫТЬ ЗАМЕТНЫМ</span>
          <span>СИЛЬНОЕ ОКРУЖЕНИЕ</span>
          <span>СОЦИАЛЬНОЕ ВЛИЯНИЕ</span>
          <span>ЖИВАЯ РЕЧЬ</span>
          <span>ХАРИЗМА</span>
        </div>
      </section>

      <section id="about" className="site-section site-section-light">
        <div className="section-heading">
          <span>О клубе</span>
          <h2>Русский Разговорный Клуб повышает качество жизни через сильное окружение</h2>
        </div>
        <div className="about-layout">
          <RevealOnView className="feature-grid">
            <article className="feature-card">
              <span>01</span>
              <h3>Сильное окружение</h3>
              <p>
                В РРК человек попадает в круг людей, которые растут, говорят яснее, держат
                слово и усиливают друг друга не шумом, а качеством присутствия.
              </p>
            </article>
            <article className="feature-card accent">
              <span>02</span>
              <h3>Социальное влияние</h3>
              <p>
                Мы развиваем навыки речи, статуса, подачи и уверенного контакта, чтобы
                участники могли влиять на реальность сильно, мягко и естественно.
              </p>
            </article>
            <article className="feature-card">
              <span>03</span>
              <h3>Качество жизни</h3>
              <p>
                Сильнее диалоги, яснее позиция, лучше отношения, заметнее энергия и больше
                внутренней опоры для жизни, работы и окружения.
              </p>
            </article>
          </RevealOnView>
          <aside className="about-manifesto">
            <span>Манифест РРК</span>
            <h3>Мы не учим просто красиво говорить.</h3>
            <p>
              Мы создаем среду, где человек учится быть услышанным, видеть динамику общения,
              занимать свое место в группе и строить вокруг себя более сильную жизнь.
            </p>
            <p>
              РРК объединяет практику речи, социальную смелость, влияние и культуру сильного
              человеческого окружения.
            </p>
          </aside>
        </div>
      </section>

      <section id="formats" className="site-section programs-section">
        <div className="section-heading">
          <span>Формат участия</span>
          <h2>Сейчас в РРК открыт вход через разовое посещение</h2>
        </div>
        <div className="programs-grid">
          {programs.map((program) => (
            <article key={program.title} className="program-card">
              <div className="program-meta">
                <span>{program.type}</span>
                <span>{program.city}</span>
              </div>
              <div className="program-status">{program.status}</div>
              <p className="program-date">{program.date}</p>
              <h3>{program.title}</h3>
              <p>{program.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="merch" className="site-section merch-section">
        <div className="section-heading">
          <span>Мерч РРК</span>
          <h2>Кремово-бежевый мерч клуба как продолжение его атмосферы</h2>
        </div>
        <div className="merch-layout">
          <div className="merch-visual">
            <MerchDoodle />
            <div className="merch-image-card">
              <Image
                src="/merch-photo.jpg"
                alt="Мерч Русского Разговорного Клуба"
                width={1200}
                height={900}
                className="merch-image"
              />
            </div>
          </div>
          <div className="merch-copy">
            <span>Носимая эстетика клуба</span>
            <h3>Минималистичный мерч в теплой палитре РРК</h3>
            <p>
              Мерч РРК продолжает язык клуба: мягкие натуральные оттенки, простая графика,
              ирония, человечность и спокойная уверенность без визуального шума.
            </p>
            <p>
              Пока на сайте можно заложить механику покупки и заявку на мерч. На следующем
              этапе сюда добавим реальные карточки товаров, размеры, наличие и оплату.
            </p>
            <div className="merch-points">
              <div className="merch-point">
                <span>Цвета</span>
                <strong>Кремовый, бордовый, черный</strong>
              </div>
              <div className="merch-point">
                <span>Формат</span>
                <strong>Футболки и клубные дропы</strong>
              </div>
            </div>
            <div className="hero-actions">
              <a href="#visit" className="site-button primary">
                Оставить заявку на мерч
              </a>
              <a href="#faq" className="site-button secondary">
                Узнать подробнее
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="founders" className="site-section founders-section">
        <div className="section-heading">
          <span>Основатели</span>
          <h2>Три сооснователя, которые формируют культуру, среду и энергию РРК</h2>
        </div>
        <RevealOnView className="founders-grid">
          {founders.map((founder) => (
            <article key={founder.name} className="founder-card">
              <div className="founder-image-wrap">
                <Image
                  src={founder.image}
                  alt={founder.name}
                  width={720}
                  height={900}
                  className="founder-image"
                />
              </div>
              <div className="founder-copy">
                <span>{founder.role}</span>
                <h3>{founder.name}</h3>
                <details className="founder-details">
                  <summary>{founder.preview}</summary>
                  <p>{founder.description}</p>
                </details>
              </div>
            </article>
          ))}
        </RevealOnView>
      </section>

      <section id="faq" className="site-section faq-section">
        <div className="section-heading">
          <span>Частые вопросы</span>
          <h2>Коротко о том, как устроен клуб и зачем люди в него приходят</h2>
        </div>
        <div className="faq-list">
          {faqs.map((faq) => (
            <details key={faq.question} className="faq-item">
              <summary>
                <span>{faq.question}</span>
                <span className="faq-icon" aria-hidden="true">
                  +
                </span>
              </summary>
              <div className="faq-answer">
                <p>{faq.answer}</p>
              </div>
            </details>
          ))}
        </div>
      </section>

      <section id="visit" className="site-section visit-section">
        <div className="visit-copy">
          <span>Как прийти</span>
          <h2>Сейчас можно начать с одного посещения и сразу почувствовать среду клуба</h2>
          <p>
            На текущем этапе у РРК открыт вход через разовое посещение. Позже сюда добавим
            живую афишу, оплату через ЮKassa и полную связку с Telegram Mini App.
          </p>
        </div>
        <div className="visit-panel">
          <div className="visit-line">
            <span>Текущий формат</span>
            <strong>Разовое посещение</strong>
          </div>
          <div className="visit-line">
            <span>Стоимость</span>
            <strong>4 400 ₽</strong>
          </div>
          <div className="visit-line">
            <span>Запись</span>
            <strong>Сайт + Telegram + CRM</strong>
          </div>
          <a href="/crm/login" className="site-button primary site-button-visit full">
            Записаться на посещение
          </a>
        </div>
      </section>

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
              <a href="#about">О клубе</a>
              <a href="#formats">Программы</a>
              <a href="#merch">Мерч</a>
              <a href="#founders">Основатели</a>
              <a href="#faq">FAQ</a>
            </div>
            <div>
              <span>Контакты</span>
              <a href="mailto:hello@rrclub.ru">hello@rrclub.ru</a>
              <a href="mailto:club@rrclub.ru">club@rrclub.ru</a>
            </div>
            <div>
              <span>Соцсети</span>
              <a href="https://t.me/rrclubb" target="_blank" rel="noreferrer">
                Telegram
              </a>
              <a
                href="https://www.instagram.com/rrclub.msc?igsh=MTA5bWN1eWl0a3k0Mg%3D%3D&utm_source=qr"
                target="_blank"
                rel="noreferrer"
              >
                Instagram
              </a>
              <p>Основан в 2026</p>
            </div>
          </div>
          <div className="site-footer-wave" aria-hidden="true">
            <span>РРК</span>
            <span>РРК</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
