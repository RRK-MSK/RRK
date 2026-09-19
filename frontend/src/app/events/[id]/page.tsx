import Link from "next/link";
import { notFound } from "next/navigation";

import { EventRegistrationForm } from "@/components/site/event-registration-form";
import { getSiteEventById } from "@/lib/site-store";

type EventPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ticket?: string }>;
};

export const dynamic = "force-dynamic";
export const revalidate = 10;

export default async function EventPage({ params, searchParams }: EventPageProps) {
  const { id } = await params;
  const { ticket } = await searchParams;
  const event = await getSiteEventById(id);

  if (!event) {
    notFound();
  }

  return (
    <main className="site-page event-page">
      <div className="event-page-bg" aria-hidden="true">
        <img src="/chelovechek.png" alt="" />
      </div>

      <section className="event-page-section">
        <Link href="/#schedule" className="event-page-back">
          ← К афише
        </Link>

        <div className="event-page-grid">
          <div className="event-page-info">
            <h1>{event.title}</h1>
            <div className="event-page-meta">
              <p className="event-page-date">{event.date}</p>
              <p className="event-page-time">{event.time}</p>
            </div>
            <p className="event-page-price">{event.displayPrice ?? event.price}</p>

            {event.description ? <p className="event-page-description">{event.description}</p> : null}
            {event.focus ? <p className="event-page-focus">{event.focus}</p> : null}
            {event.host ? <p className="event-page-host">Ведущий: {event.host}</p> : null}
            {event.venueAddress ? (
              <p className="event-page-address">
                {event.venueMapUrl ? (
                  <a href={event.venueMapUrl} target="_blank" rel="noreferrer">
                    {event.venueAddress}
                  </a>
                ) : (
                  event.venueAddress
                )}
              </p>
            ) : null}

            {event.bookingOptions?.length ? (
              <div className="event-page-tariffs">
                {event.bookingOptions.map((option) => (
                  <div key={option.label} className="event-page-tariff">
                    <strong>{option.label}</strong>
                    <span>{option.price} · {option.seatsLeft} из {option.capacity} мест</span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="event-page-form-wrap">
            <div className="event-page-form-head">
              <h2>Запись и оплата</h2>
              <p className="event-page-form-lead">
                Заполните данные. Можно сразу добавить несколько человек — оплата одной суммой.
                Если вы уже записывались с этого устройства, поля заполнятся сами.
              </p>
            </div>
            <EventRegistrationForm event={event} initialTicketLabel={ticket} />
          </div>
        </div>
      </section>
    </main>
  );
}
