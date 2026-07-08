create table if not exists public.promo_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  discount_percent integer not null check (discount_percent > 0 and discount_percent <= 100),
  applicable_services text[] default '{"all"}',
  is_single_use boolean not null default true,
  is_active boolean not null default true,
  expires_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.promo_code_usages (
  id uuid primary key default gen_random_uuid(),
  promo_code_id uuid not null references public.promo_codes(id) on delete cascade,
  participant_id uuid references public.participants(id) on delete set null,
  order_id text not null,
  used_at timestamptz not null default timezone('utc', now()),
  unique(promo_code_id, participant_id)
);

alter table public.payments 
  add column if not exists promo_code_id uuid references public.promo_codes(id) on delete set null,
  add column if not exists discount_amount_rub integer default 0;

-- Вставляем промокод КОФЕ со скидкой 20%
insert into public.promo_codes (code, discount_percent, is_single_use)
values ('КОФЕ', 20, true)
on conflict (code) do nothing;
