alter table public.events
  add column if not exists booking_mode text not null default 'payment';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'events_booking_mode_check'
  ) then
    alter table public.events
      add constraint events_booking_mode_check
      check (booking_mode in ('payment', 'signup'));
  end if;
end;
$$;
