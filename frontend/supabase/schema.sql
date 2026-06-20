create extension if not exists "pgcrypto";

create table if not exists public.participants (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  full_name text not null,
  telegram text,
  phone text,
  email text,
  source text,
  status text default 'Новый',
  tags text[] not null default '{}',
  visits_count integer not null default 0,
  total_paid_rub integer not null default 0,
  unpaid_rub integer not null default 0,
  next_event_title text,
  next_event_at timestamptz,
  first_contact_at timestamptz,
  note text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  description text,
  category text,
  city text default 'Москва',
  host text,
  status text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  price_rub integer not null default 0,
  capacity integer not null default 10,
  booked_count integer not null default 0,
  paid_count integer not null default 0,
  pending_count integer not null default 0,
  waitlist_count integer not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.participants(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  source text,
  status text not null default 'Активна',
  payment_status text not null default 'Ждет оплату',
  confirmation_status text not null default 'Ожидает',
  note text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (participant_id, event_id)
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid references public.participants(id) on delete set null,
  event_id uuid references public.events(id) on delete set null,
  amount_rub integer not null default 0,
  method text,
  status text not null default 'Ждет',
  paid_at timestamptz default timezone('utc', now()),
  external_payment_id text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  spent_at timestamptz default timezone('utc', now()),
  category text not null,
  description text,
  amount_rub integer not null default 0,
  period_label text,
  status text not null default 'План',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid references public.participants(id) on delete set null,
  author_name text,
  source text,
  text text not null,
  rating integer check (rating between 1 and 5),
  status text not null default 'Новый',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.sync_event_counters(target_event_id uuid)
returns void
language plpgsql
as $$
begin
  update public.events
  set
    booked_count = (
      select count(*)
      from public.enrollments en
      where en.event_id = target_event_id
        and lower(coalesce(en.status, '')) not like '%wait%'
        and lower(coalesce(en.status, '')) not like '%ожидани%'
        and lower(coalesce(en.status, '')) not like '%cancel%'
        and lower(coalesce(en.status, '')) not like '%отмен%'
    ),
    paid_count = (
      select count(*)
      from public.enrollments en
      where en.event_id = target_event_id
        and lower(coalesce(en.status, '')) not like '%wait%'
        and lower(coalesce(en.status, '')) not like '%ожидани%'
        and lower(coalesce(en.status, '')) not like '%cancel%'
        and lower(coalesce(en.status, '')) not like '%отмен%'
        and (
          lower(coalesce(en.payment_status, '')) like '%paid%'
          or lower(coalesce(en.payment_status, '')) like '%оплач%'
        )
    ),
    pending_count = (
      select count(*)
      from public.enrollments en
      where en.event_id = target_event_id
        and lower(coalesce(en.status, '')) not like '%wait%'
        and lower(coalesce(en.status, '')) not like '%ожидани%'
        and lower(coalesce(en.status, '')) not like '%cancel%'
        and lower(coalesce(en.status, '')) not like '%отмен%'
        and lower(coalesce(en.payment_status, '')) in (
          'pending',
          'waiting_payment',
          'unpaid',
          'manual_check',
          'ждет',
          'ждет оплату',
          'ожидает'
        )
    ),
    waitlist_count = (
      select count(*)
      from public.enrollments en
      where en.event_id = target_event_id
        and (
          lower(coalesce(en.status, '')) like '%wait%'
          or lower(coalesce(en.status, '')) like '%ожидани%'
        )
    )
  where id = target_event_id;
end;
$$;

create or replace function public.handle_enrollment_event_counters()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'DELETE' then
    perform public.sync_event_counters(old.event_id);
    return old;
  end if;

  perform public.sync_event_counters(new.event_id);

  if tg_op = 'UPDATE' and old.event_id is distinct from new.event_id then
    perform public.sync_event_counters(old.event_id);
  end if;

  return new;
end;
$$;

drop trigger if exists participants_set_updated_at on public.participants;
create trigger participants_set_updated_at
before update on public.participants
for each row execute function public.set_updated_at();

drop trigger if exists events_set_updated_at on public.events;
create trigger events_set_updated_at
before update on public.events
for each row execute function public.set_updated_at();

drop trigger if exists enrollments_set_updated_at on public.enrollments;
create trigger enrollments_set_updated_at
before update on public.enrollments
for each row execute function public.set_updated_at();

drop trigger if exists enrollments_sync_event_counters on public.enrollments;
create trigger enrollments_sync_event_counters
after insert or update or delete on public.enrollments
for each row execute function public.handle_enrollment_event_counters();

drop trigger if exists payments_set_updated_at on public.payments;
create trigger payments_set_updated_at
before update on public.payments
for each row execute function public.set_updated_at();

drop trigger if exists expenses_set_updated_at on public.expenses;
create trigger expenses_set_updated_at
before update on public.expenses
for each row execute function public.set_updated_at();

drop trigger if exists reviews_set_updated_at on public.reviews;
create trigger reviews_set_updated_at
before update on public.reviews
for each row execute function public.set_updated_at();

alter publication supabase_realtime add table public.participants;
alter publication supabase_realtime add table public.events;
alter publication supabase_realtime add table public.enrollments;
alter publication supabase_realtime add table public.payments;
alter publication supabase_realtime add table public.expenses;
alter publication supabase_realtime add table public.reviews;

alter table public.participants enable row level security;
alter table public.events enable row level security;
alter table public.enrollments enable row level security;
alter table public.payments enable row level security;
alter table public.expenses enable row level security;
alter table public.reviews enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'events' and policyname = 'Public can read published events'
  ) then
    create policy "Public can read published events"
    on public.events
    for select
    using (is_published = true);
  end if;
end;
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array['participants', 'events', 'enrollments', 'payments', 'expenses', 'reviews']
  loop
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename = table_name
        and policyname = 'Service role full access on ' || table_name
    ) then
      execute format(
        'create policy %I on public.%I for all using (auth.role() = ''service_role'') with check (auth.role() = ''service_role'')',
        'Service role full access on ' || table_name,
        table_name
      );
    end if;
  end loop;
end;
$$;
