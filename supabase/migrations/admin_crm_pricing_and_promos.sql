alter table public.promo_codes
  add column if not exists description text,
  add column if not exists usage_limit integer,
  add column if not exists valid_from timestamptz,
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

create table if not exists public.event_price_tiers (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  seat_from integer not null check (seat_from > 0),
  seat_to integer check (seat_to is null or seat_to >= seat_from),
  price_rub integer not null check (price_rub >= 0),
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

drop trigger if exists promo_codes_set_updated_at on public.promo_codes;
create trigger promo_codes_set_updated_at
before update on public.promo_codes
for each row execute function public.set_updated_at();

drop trigger if exists event_price_tiers_set_updated_at on public.event_price_tiers;
create trigger event_price_tiers_set_updated_at
before update on public.event_price_tiers
for each row execute function public.set_updated_at();

alter publication supabase_realtime add table public.promo_codes;
alter publication supabase_realtime add table public.promo_code_usages;
alter publication supabase_realtime add table public.event_price_tiers;

alter table public.promo_codes enable row level security;
alter table public.promo_code_usages enable row level security;
alter table public.event_price_tiers enable row level security;

do $$
declare
  table_name text;
begin
  foreach table_name in array array['promo_codes', 'promo_code_usages', 'event_price_tiers']
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
