alter table public.events
  add column if not exists card_color text not null default 'standard';

alter table public.events
  add column if not exists card_animation text not null default 'none';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'events_card_color_check'
  ) then
    alter table public.events
      add constraint events_card_color_check
      check (card_color in ('standard', 'rainbow'));
  end if;

  alter table public.events drop constraint if exists events_card_animation_check;
  alter table public.events
    add constraint events_card_animation_check
    check (card_animation in ('none', 'bubbles', 'beer'));
end;
$$;

update public.events
set card_color = 'rainbow'
where title ilike '%halloween%'
  and title ilike '%больш%';
