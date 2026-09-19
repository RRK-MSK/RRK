import Image from "next/image";

import { SiteFooter } from "@/components/site/footer";
import { GalleryScroller } from "@/components/site/gallery-scroller";
import { PosterCalendar } from "@/components/site/poster-calendar";
import { RevealOnView } from "@/components/site/reveal-on-view";
import { VideoHero } from "@/components/site/video-hero";
import { getNearestSiteEvent, getSiteGalleryPhotos, getSiteHeroSlides, getSitePosterEvents } from "@/lib/site-store";

export const dynamic = "force-dynamic";
export const revalidate = 10; // Кэшируем страницу на 10 секунд для ускорения загрузки

const founders = [
  {
    image: "/IMG_2728.jpeg",
    imageClassName: "founder-image-ramon",
    name: "РАМОН РУЗАНОВ",
    role: "МЕДИА И КОММУНИКАЦИИ",
    preview: "Выстраивает медиа РРК и наш голос",
    description:
      "Выстраивает медиа РРК и наш голос во внешнем мире. Создает контент и смыслы, которые объединяют людей и формируют сильное сообщество. Через медиа помогает доносить ценности клуба, усиливать его влияние и строить красивую, честную коммуникацию с аудиторией.",
  },
  {
    image: "/IMG_2733.jpeg",
    name: "ГРОНСКИЙ АЛЕКСАНДР",
    role: "ПРОДЮСИРОВАНИЕ И РАЗВИТИЕ",
    preview: "Продюсер РРК. Коллаборации и партнёрства",
    description:
      "Продюсер РРК. Договаривается о коллаборациях и партнёрствах, расширяет клуб в офлайне и открывает новые возможности для сообщества. Выступает спикером по скорости реакции, речи и юмора — учит говорить быстро, остро и уверенно.",
  },
  {
    image: "/IMG_2751.jpeg",
    name: "ВЛАС ИБРАГИМОВ",
    role: "ФИЛОСОФИЯ И ПРОДУКТ",
    preview: "Душа РРК и ментор нашей философии",
    description:
      "Душа РРК и ментор нашей философии. Отвечает за продукт, атмосферу и внутреннюю суть клуба. Выступает спикером по актёрскому мастерству, сцене, партнёрскому состоянию, телу и присутствию — помогает раскрыть себя, быть в моменте и чувствовать живой контакт с людьми.",
  },
];

const faqs = [
  {
    question: "Можно прийти одному?",
    answer: "Да. Большинство людей именно так и знакомится с РРК.",
  },
  {
    question: "Я никого не знаю. Мне будет комфортно?",
    answer:
      "Да. Форматы специально устроены так, чтобы люди постепенно знакомились друг с другом.",
  },
  {
    question: "Что выбрать в первый раз?",
    answer: [
      "Хочешь познакомиться и провести время — Coffee Jam или неформальная встреча.",
      "Хочешь больше практики и развития — тренинг.",
    ],
  },
  {
    question: "Нужен опыт?",
    answer: "Нет. Прийти можно без подготовки — достаточно желания включиться.",
  },
  {
    question: "Какой возраст участников?",
    answer: "От 18 лет. Чаще всего участникам от 20 до 40.",
  },
  {
    question: "Где проходят встречи?",
    answer: "Москва. Конкретный адрес указан в карточке каждого события.",
  },
  {
    question: "Можно ли прийти, если есть зажатость или страх общения?",
    answer:
      "Да. Для многих это и есть причина прийти. Здесь важно не изображать уверенность, а постепенно наращивать её через практику и живой контакт.",
  },
];

export default async function HomePage() {
  const [livePosterEvents, heroSlides, galleryPhotos] = await Promise.all([
    getSitePosterEvents(),
    getSiteHeroSlides(),
    getSiteGalleryPhotos(),
  ]);
  const activeLiveEvents = livePosterEvents.filter((event) => event.status !== "Отменено");
  const nearestEvent = getNearestSiteEvent(activeLiveEvents);

  return (
    <main className="site-page">
      <VideoHero nearestEvent={nearestEvent} slides={heroSlides} />

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

      <section id="schedule" className="site-section poster-section">
        <div className="section-heading">
          <span>Афиша РРК</span>
          <h2>Мероприятия РРК</h2>
        </div>
        <PosterCalendar events={activeLiveEvents} />
      </section>

      <section id="about" className="site-section site-section-light about-section">
        <div className="section-heading">
          <span>О клубе</span>
          <h2>
            Философия РРК
          </h2>
        </div>
        <RevealOnView className="about-layout">
          <div className="about-manifesto">
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
          </div>
        </RevealOnView>
      </section>

      <section id="gallery" className="site-section gallery-section">
        <div className="section-heading">
          <span>Атмосфера</span>
          <h2>Как проходят встречи РРК</h2>
        </div>
        <GalleryScroller photos={galleryPhotos} />
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
                  className={`founder-image ${founder.imageClassName ?? ""}`.trim()}
                />
              </div>
              <div className="founder-copy">
                <span>{founder.role}</span>
                <h3>{founder.name}</h3>
                <details className="founder-details" open>
                  <summary style={{ display: 'none' }}>{founder.preview}</summary>
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
                {Array.isArray(faq.answer) ? (
                  faq.answer.map((paragraph) => <p key={paragraph}>{paragraph}</p>)
                ) : (
                  <p>{faq.answer}</p>
                )}
              </div>
            </details>
          ))}
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
