import Image from "next/image";

import { MerchDoodle } from "@/components/site/merch-doodle";
import { PosterCalendar } from "@/components/site/poster-calendar";
import { RevealOnView } from "@/components/site/reveal-on-view";
import { VideoHero } from "@/components/site/video-hero";
import { getSitePosterEvents } from "@/lib/site-store";

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

const posterEvents = [
  {
    tone: "solid",
    date: "2 июля (чт)",
    time: "19:00-22:30",
    title: "Логика абсурда",
    description: "Жизнь не обязана быть логичной.",
    focus: "Развиваем гибкость мышления и способность принимать неожиданное.",
    host: "Влас Ибрагимов",
    price: "4400₽",
  },
  {
    tone: "soft",
    date: "4 июля (сб)",
    time: "14:30-18:00",
    title: "Ошибки как топливо",
    focus: "Учимся превращать ошибки в материал для роста.",
    host: "Влас Ибрагимов",
    price: "4400₽",
  },
  {
    tone: "soft",
    date: "4 июля (сб)",
    time: "19:00-22:30",
    title: "Ошибки как топливо",
    focus: "Учимся превращать ошибки в материал для роста.",
    host: "Влас Ибрагимов",
    price: "4400₽",
  },
  {
    tone: "solid",
    date: "5 июля (вс)",
    time: "14:30-18:00",
    title: "Тело говорит раньше слов",
    focus: "Работа с пластикой, походкой, пространством и внутренним состоянием.",
    host: "Влас Ибрагимов",
    price: "4400₽",
  },
  {
    tone: "soft",
    date: "5 июля (вс)",
    time: "19:00-22:30",
    title: "Тело говорит раньше слов",
    focus: "Работа с пластикой, походкой, пространством и внутренним состоянием.",
    host: "Влас Ибрагимов",
    price: "4400₽",
  },
  {
    tone: "highlight",
    date: "7 июля (вт)",
    time: "12:00-14:00",
    label: "ДК x РРК",
    title: "COFFEE JAM",
    description: "Зарядка для soft skills",
    price: "Регистрация",
  },
  {
    tone: "soft",
    date: "7 июля (вт)",
    time: "19:00-22:30",
    title: "Почему в голове все звучит лучше?",
    focus: "Как научиться говорить так же уверенно вслух.",
    host: "Александр Гронский",
    price: "4400₽",
  },
  {
    tone: "solid",
    date: "9 июля (чт)",
    time: "14:30-18:00",
    title: "Какой я персонаж?",
    focus: "Каждый день мы играем роли. Пора выбрать свою осознанно.",
    host: "Влас Ибрагимов",
    price: "4400₽",
  },
  {
    tone: "soft",
    date: "9 июля (чт)",
    time: "19:00-22:30",
    title: "Какой я персонаж?",
    focus: "Каждый день мы играем роли. Пора выбрать свою осознанно.",
    host: "Влас Ибрагимов",
    price: "4400₽",
  },
  {
    tone: "solid",
    date: "12 июля (вс)",
    time: "16:00-20:00",
    title: "BIG ТРЕНИРОВКА В ПИТЕРЕ",
    focus: "Философия РРК, играем сцены, создаем связи и узнаем себя.",
    price: "5000₽",
  },
  {
    tone: "solid",
    date: "16 июля (чт)",
    time: "14:30-18:00",
    title: "Искусство делать других ярче",
    focus: "Харизма рождается там, где есть внимание к партнеру.",
    host: "Влас Ибрагимов",
    price: "4400₽",
  },
  {
    tone: "soft",
    date: "16 июля (чт)",
    time: "19:00-22:30",
    title: "Искусство делать других ярче",
    focus: "Харизма рождается там, где есть внимание к партнеру.",
    host: "Влас Ибрагимов",
    price: "4400₽",
  },
  {
    tone: "soft",
    date: "18 июля (сб)",
    time: "14:30-18:00",
    title: "Страх тишины",
    focus: "Почему пауза делает речь сильнее.",
    host: "Влас Ибрагимов",
    price: "4400₽",
  },
  {
    tone: "solid",
    date: "18 июля (сб)",
    time: "19:00-22:30",
    title: "Страх тишины",
    focus: "Почему пауза делает речь сильнее.",
    host: "Влас Ибрагимов",
    price: "4400₽",
  },
  {
    tone: "soft",
    date: "19 июля (вс)",
    time: "14:30-18:00",
    title: "Спокойствие в хаосе",
    focus: "Что делать, когда разговор идет не по плану.",
    host: "Александр Гронский",
    price: "4400₽",
  },
  {
    tone: "solid",
    date: "19 июля (вс)",
    time: "19:00-22:30",
    title: "Спокойствие в хаосе",
    focus: "Что делать, когда разговор идет не по плану.",
    host: "Александр Гронский",
    price: "4400₽",
  },
  {
    tone: "highlight",
    date: "21 июля (вт)",
    time: "12:00-14:00",
    label: "ДК x РРК",
    title: "COFFEE JAM",
    description: "Зарядка для soft skills",
    price: "Регистрация",
  },
  {
    tone: "soft",
    date: "21 июля (вт)",
    time: "19:00-22:30",
    title: "Жизнь как сцена",
    focus: "Мы уже импровизируем каждый день, просто не замечаем этого.",
    host: "Влас Ибрагимов",
    price: "4400₽",
  },
  {
    tone: "solid",
    date: "23 июля (чт)",
    time: "14:30-18:00",
    title: "Конфликт - двигатель общения",
    focus: "Самые интересные разговоры начинаются там, где появляются разные интересы.",
    host: "Влас Ибрагимов",
    price: "4400₽",
  },
  {
    tone: "soft",
    date: "23 июля (чт)",
    time: "19:00-22:30",
    title: "Свобода начинается с ошибки",
    focus: "Почему страх выглядеть глупо мешает жить.",
    host: "Александр Гронский",
    price: "4400₽",
  },
  {
    tone: "solid",
    date: "24 июля (пт)",
    time: "18:00-23:00",
    title: "МАФИЯ В ДУХЕ РРК",
    price: "4400₽",
  },
  {
    tone: "soft",
    date: "26 июля (вс)",
    time: "14:00-22:00",
    title: "БИГ-ТРЕНИРОВКА",
    description: "Интенсив от РРК.",
    focus: "День, который меняет взгляд на жизнь + кофе и диджей.",
    price: "10 000₽",
  },
  {
    tone: "solid",
    date: "28 июля (вт)",
    time: "14:30-18:00",
    title: "Обстоятельства решают все",
    focus: "Мы не меняем личность - мы меняем обстоятельства.",
    host: "Влас Ибрагимов",
    price: "4400₽",
  },
  {
    tone: "soft",
    date: "28 июля (вт)",
    time: "19:00-22:30",
    title: "Обстоятельства решают все",
    focus: "Мы не меняем личность - мы меняем обстоятельства.",
    host: "Влас Ибрагимов",
    price: "4400₽",
  },
  {
    tone: "solid",
    date: "30 июля (чт)",
    time: "14:30-18:00",
    title: "Речь без воды",
    focus: "Как говорить просто, понятно и по делу.",
    host: "Гронский Александр",
    price: "4400₽",
  },
  {
    tone: "soft",
    date: "30 июля (чт)",
    time: "19:00-22:30",
    title: "Речь без воды",
    focus: "Как говорить просто, понятно и по делу.",
    host: "Гронский Александр",
    price: "4400₽",
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

export default async function HomePage() {
  const livePosterEvents = await getSitePosterEvents();
  const calendarEvents = livePosterEvents.length > 0 ? livePosterEvents : posterEvents;

  return (
    <main className="site-page">
      <VideoHero />

      <section className="site-runner" aria-label="Бегущая строка">
        <div className="site-runner-track">
          <span>МЫ ВСЕ ДРУГ ДРУГУ УЧИТЕЛЯ И УЧЕНИКИ</span>
          <span>КРИНЖА НЕ СУЩЕСТВУЕТ</span>
          <span>СЛЫШАТЬ И СЛУШАТЬ</span>
          <span>МЫ ВСЕ ДРУГ ДРУГУ УЧИТЕЛЯ И УЧЕНИКИ</span>
          <span>КРИНЖА НЕ СУЩЕСТВУЕТ</span>
          <span>СЛЫШАТЬ И СЛУШАТЬ</span>
          <span>МЫ ВСЕ ДРУГ ДРУГУ УЧИТЕЛЯ И УЧЕНИКИ</span>
          <span>КРИНЖА НЕ СУЩЕСТВУЕТ</span>
          <span>СЛЫШАТЬ И СЛУШАТЬ</span>
          <span>МЫ ВСЕ ДРУГ ДРУГУ УЧИТЕЛЯ И УЧЕНИКИ</span>
        </div>
      </section>

      <section id="about" className="site-section site-section-light about-section">
        <MerchDoodle />
        <div className="section-heading">
          <span>О клубе</span>
          <h2>
            РУССКИЙ РАЗГОВОРНЫЙ КЛУБ
            <br />
            БЕЗОПАСНОЕ ПРОСТРАНСТВО ДЛЯ ТРЕНИРОВКИ НАВЫКОВ ПРОЯВЛЕНИЯ СЕБЯ В МИР
          </h2>
        </div>
        <div className="about-layout">
          <RevealOnView className="feature-grid">
            <article className="feature-card">
              <span>01.</span>
              <h3>Безопасно ошибаться</h3>
              <p>У нас кринжа не существует. Поэтому здесь легко начать.</p>
            </article>
            <article className="feature-card accent">
              <span>02.</span>
              <h3>Учимся через практику</h3>
              <p>
                Никакой теории - только живые упражнения и постоянное взаимодействие с
                людьми.
              </p>
            </article>
            <article className="feature-card">
              <span>03.</span>
              <h3>Переносим в реальную жизнь</h3>
              <p>
                Знакомства, свидания, работа, переговоры, выступления, дружба - все
                становится проще, когда ты перестаешь бояться проявляться.
              </p>
            </article>
          </RevealOnView>
          <aside className="about-manifesto">
            <span>Философия РРК</span>
            <h3>Эти три правила работают в жизни, в Русском Разговорном и на планете Земля.</h3>
            <div className="about-manifesto-rules">
              <div className="about-manifesto-rule">
                <strong>1. Мы все друг другу ученики и учителя</strong>
                <p>
                  В РРК неважно, кем ты работаешь и сколько зарабатываешь. Здесь нет
                  статусов и регалий, каждый приходит учиться и каждый может чему-то
                  научить другого.
                </p>
              </div>
              <div className="about-manifesto-rule">
                <strong>2. Кринжа не существует</strong>
                <p>
                  Ошибки - это топливо, а не повод для стыда. Самый быстрый способ
                  вырасти.
                </p>
                <p>Чем больше пробуешь, тем быстрее становишься свободнее и увереннее.</p>
              </div>
              <div className="about-manifesto-rule">
                <strong>3. Слышать и слушать</strong>
                <p>
                  Большинство людей думают о том, что ответить, еще до того, как
                  дослушают собеседника.
                </p>
                <p>
                  В РРК мы учимся быть в моменте, замечать партнера и строить общение не
                  вокруг себя, а вместе с другим человеком.
                </p>
              </div>
            </div>
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

      <section id="schedule" className="site-section poster-section">
        <div className="section-heading">
          <span>Афиша РРК</span>
          <h2>Ближайшие тренировки, коллаборации и большие встречи клуба</h2>
        </div>
        <PosterCalendar events={calendarEvents} />
        <div className="poster-footer">
          <a
            href="https://t.me/rrclubadmin"
            className="site-button primary"
            target="_blank"
            rel="noreferrer"
          >
            Записаться
          </a>
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
