import { SiteFooter } from "@/components/site/footer";
import { GalleryScroller } from "@/components/site/gallery-scroller";
import { PosterCalendar } from "@/components/site/poster-calendar";
import { FoundersCarousel } from "@/components/site/founders-carousel";
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
    role: "СООСНОВАТЕЛЬ РРК",
    preview: "Выстраивает медиа РРК и наш голос",
    description:
      "Выстраивает медиа РРК и наш голос во внешнем мире.",
  },
  {
    image: "/IMG_2733.jpeg",
    name: "АЛЕКСАНДР ГРОНСКИЙ",
    role: "СООСНОВАТЕЛЬ РРК",
    preview: "Продюсер РРК. Коллаборации и партнёрства",
    description:
      "CEO. Отвечает за рост и развитие РРК.",
  },
  {
    image: "/IMG_2751.jpeg",
    name: "ВЛАС ИБРАГИМОВ",
    role: "СООСНОВАТЕЛЬ РРК",
    preview: "Ведущий тренингов по актёскому мастерству и методу РРК.",
    description:
      "Ведущий тренингов по актёскому мастерству и методу РРК.",
  },
  {
    image: "/polina.jpg",
    name: "ПОЛИНА МЕРКУЛОВА",
    role: "АДМИН",
    preview: "Знает ответы на все вопросы. Твой проводник в мир РРК.",
    description:
      "Знает ответы на все вопросы. Твой проводник в мир РРК.",
  },
  {
    image: "/nikita.jpg",
    name: "НИКИТА ТЕЛЕКАЕВ",
    role: "Технический директор",
    preview: "Создал этот сайт и miniApp. Ищу работу, писать Полине(пожалуйста).",
    description:
      "Создал этот сайт и miniApp. Ищу работу, писать Полине(пожалуйста).",
  },
  {
    image: "/masha.jpg",
    name: "МАРИЯ НИКОНОВА",
    role: "МЕНЕДЖЕР ПО ПАРТНЕРСТВАМ",
    preview: "",
    description:
      "Находит точки соприкосновения между РРК, городскими пространствами и интересными людьми.",
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
    question: "Нужен опыт?",
    answer: "Нет. Прийти можно без подготовки — достаточно желания включиться.",
  },
  {
    question: "Какой возраст участников?",
    answer: "Средний возраст участников 25-35 лет.",
  },
  {
    question: "Где проходят встречи?",
    answer: "Москва. Конкретный адрес указан в карточке каждого события.",
  },
  {
    question: "Можно ли прийти, если есть зажатость или страх общения?",
    answer:
      "Да, для многих это и является причиной знакомства с РРК. Через метод РРК, мы развиваем нейропластичность мозга, уверенность и свободу самовыражения.",
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
          <span>КРИНЖА НЕ СУЩЕСТВУЕТ</span>
          <span>КРИНЖА НЕ СУЩЕСТВУЕТ</span>
          <span>КРИНЖА НЕ СУЩЕСТВУЕТ</span>
          <span>КРИНЖА НЕ СУЩЕСТВУЕТ</span>
          <span>КРИНЖА НЕ СУЩЕСТВУЕТ</span>
          <span>КРИНЖА НЕ СУЩЕСТВУЕТ</span>
          <span>КРИНЖА НЕ СУЩЕСТВУЕТ</span>
          <span>КРИНЖА НЕ СУЩЕСТВУЕТ</span>
        </div>
      </section>

      <section id="schedule" className="site-section poster-section">
        <div className="section-heading">
          <h2>Мероприятия РРК</h2>
        </div>
        <PosterCalendar events={activeLiveEvents} />
      </section>

      {/* <section id="about" className="site-section site-section-light about-section">
        <div className="section-heading">
          <h2>
            Философия РРК
          </h2>
        </div>
        <RevealOnView className="about-layout">
          <div className="about-manifesto">
            <span>Философия РРК</span>
            <h3>Эти три правила работают в жизни, в Русском Разговорном Клубе и на планете Земля.</h3>
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
      </section> */}

      <section id="gallery" className="site-section gallery-section">
        <div className="section-heading">
          <h2>РРК И РРКашники</h2>
        </div>
        <GalleryScroller photos={galleryPhotos} />
      </section>

      <section id="founders" className="site-section founders-section">
        <div className="section-heading">
          <h2>Команда, которая формирует культуру, среду и энергию РРК</h2>
        </div>
        <FoundersCarousel founders={founders} />
      </section>

      <section id="faq" className="site-section faq-section">
        <div className="section-heading">
          <h2>Как устроен клуб</h2>
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
