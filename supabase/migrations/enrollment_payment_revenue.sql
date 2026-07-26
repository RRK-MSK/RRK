create table if not exists public.revenue_audit_log (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid references public.payments(id) on delete set null,
  participant_id uuid references public.participants(id) on delete set null,
  enrollment_id uuid references public.enrollments(id) on delete set null,
  event_id uuid references public.events(id) on delete set null,
  direction text not null check (direction in ('plus', 'minus', 'neutral')),
  operation_type text not null,
  amount_rub integer not null default 0,
  reason text,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.payments
  add column if not exists enrollment_id uuid references public.enrollments(id) on delete set null,
  add column if not exists note text;

create index if not exists payments_participant_event_idx on public.payments(participant_id, event_id);
create index if not exists payments_enrollment_idx on public.payments(enrollment_id);
create index if not exists revenue_audit_log_created_at_idx on public.revenue_audit_log(created_at desc);
create index if not exists revenue_audit_log_payment_idx on public.revenue_audit_log(payment_id);

alter publication supabase_realtime add table public.revenue_audit_log;

alter table public.revenue_audit_log enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'revenue_audit_log'
      and policyname = 'Service role full access on revenue_audit_log'
  ) then
    create policy "Service role full access on revenue_audit_log"
    on public.revenue_audit_log
    for all
    using (auth.role() = 'service_role')
    with check (auth.role() = 'service_role');
  end if;
end;
$$;
