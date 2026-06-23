const { createClient } = require('@supabase/supabase-js');

const posterEvents = [
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
    description: "зарядка для SOFT скиллов",
    price: "Участие бесплатно, регистрация",
    hideCapacity: true,
  },
  {
    tone: "solid",
    date: "12 июля (вс)",
    time: "16:00-20:00",
    title: "BIG ТРЕНИРОВКА В ПИТЕРЕ",
    focus: "Философия РРК, играем сцены, создаем связи и узнаем себя.",
    price: "5000₽",
    capacity: 20,
    city: "Санкт-Петербург"
  },
  {
    tone: "solid",
    date: "16 июля (чт)",
    time: "14:30-18:00",
    title: "Какой я персонаж?",
    focus: "Каждый день мы играем роли. Пора выбрать свою осознанно.",
    host: "Влас Ибрагимов",
    price: "4400₽",
  },
  {
    tone: "soft",
    date: "16 июля (чт)",
    time: "19:00-22:30",
    title: "Какой я персонаж?",
    focus: "Каждый день мы играем роли. Пора выбрать свою осознанно.",
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
    focus: "Что делать, когда разговор идёт не по плану.",
    host: "Александр Гронский",
    price: "4400₽",
  },
  {
    tone: "solid",
    date: "19 июля (вс)",
    time: "19:00-22:30",
    title: "Спокойствие в хаосе",
    focus: "Что делать, когда разговор идёт не по плану.",
    host: "Александр Гронский",
    price: "4400₽",
  },
  {
    tone: "highlight",
    date: "21 июля (вт)",
    time: "12:00-14:00",
    label: "ДК x РРК",
    title: "COFFEE JAM",
    description: "зарядка для SOFT скиллов",
    price: "Участие бесплатно, регистрация",
    hideCapacity: true,
  },
  {
    tone: "solid",
    date: "23 июля (чт)",
    time: "14:30-18:00",
    title: "Жизнь как сцена",
    focus: "Мы уже импровизируем каждый день, просто не замечаем этого.",
    host: "Влас Ибрагимов",
    price: "4400₽",
  },
  {
    tone: "soft",
    date: "23 июля (чт)",
    time: "19:00-22:30",
    title: "Жизнь как сцена",
    focus: "Мы уже импровизируем каждый день, просто не замечаем этого.",
    host: "Влас Ибрагимов",
    price: "4400₽",
  },
  {
    tone: "solid",
    date: "24 июля (пт)",
    time: "18:00-23:00",
    title: "МАФИЯ В ДУХЕ РРК",
    focus: "Играем в мафию и учимся искусству «дискуссии».",
    price: "4400₽",
    capacity: 15,
  },
  {
    tone: "soft",
    date: "26 июля (вс)",
    time: "14:00-22:00",
    title: "БИГ-ТРЕНИРОВКА",
    description: "Интенсив от РРК.",
    focus: "День, который меняет взгляд на жизнь + кофе и диджей.",
    price: "10 000₽",
    capacity: 20,
  },
  {
    tone: "solid",
    date: "28 июля (вт)",
    time: "14:30-18:00",
    title: "Обстоятельства решают всё",
    focus: "Мы не меняем личность — мы меняем обстоятельства.",
    host: "Влас Ибрагимов",
    price: "4400₽",
  },
  {
    tone: "soft",
    date: "28 июля (вт)",
    time: "19:00-22:30",
    title: "Обстоятельства решают всё",
    focus: "Мы не меняем личность — мы меняем обстоятельства.",
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

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Map russian months to numbers
const monthMap = {
  'июля': 6 // 0-indexed for JS Date, July is 6
};

async function seed() {
  const dbEvents = posterEvents.map(ev => {
    // Parse "4 июля (сб)"
    const day = parseInt(ev.date.split(' ')[0]);
    const month = monthMap[ev.date.split(' ')[1]];
    
    // Parse "14:30-18:00"
    const [start, end] = ev.time.split('-');
    const [startH, startM] = start.split(':');
    const [endH, endM] = end ? end.split(':') : [null, null];
    
    // Assume year 2026 based on the context
    const startDate = new Date(Date.UTC(2026, month, day, parseInt(startH) - 3, parseInt(startM))); // UTC -3 for Moscow
    const endDate = end ? new Date(Date.UTC(2026, month, day, parseInt(endH) - 3, parseInt(endM))) : null;

    let price = parseInt(ev.price.replace(/\D/g, ''));
    if (isNaN(price)) price = 0;

    return {
      title: ev.title,
      subtitle: ev.description || null,
      description: ev.focus || null,
      category: ev.label || (ev.tone === 'highlight' ? 'Коллаборация' : (ev.title.includes('BIG') ? 'BIG' : 'Обычное')),
      city: ev.city || "Москва",
      host: ev.host || null,
      starts_at: startDate.toISOString(),
      ends_at: endDate ? endDate.toISOString() : null,
      price_rub: price,
      capacity: ev.hideCapacity ? 10000 : (ev.capacity || 10),
      booked_count: 0,
      is_published: true,
      status: 'Открыта запись'
    };
  });

  const { data, error } = await supabase.from('events').insert(dbEvents).select();
  if (error) {
    console.error("Error inserting:", error);
  } else {
    console.log(`Inserted ${data.length} events!`);
  }
}

seed();