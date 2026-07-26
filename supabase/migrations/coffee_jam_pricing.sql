update public.events
set price_rub = 770
where lower(coalesce(title, '')) like '%coffee jam%'
   or lower(coalesce(title, '')) like '%кофе джем%'
   or lower(coalesce(category, '')) like '%coffee jam%'
   or lower(coalesce(category, '')) like '%кофе джем%';

delete from public.event_price_tiers
where event_id in (
  select id
  from public.events
  where lower(coalesce(title, '')) like '%coffee jam%'
     or lower(coalesce(title, '')) like '%кофе джем%'
     or lower(coalesce(category, '')) like '%coffee jam%'
     or lower(coalesce(category, '')) like '%кофе джем%'
);

insert into public.event_price_tiers (event_id, seat_from, seat_to, price_rub)
select event_id, seat_from, seat_to, price_rub
from (
  select id as event_id, 1 as seat_from, 10 as seat_to, 770 as price_rub
  from public.events
  where lower(coalesce(title, '')) like '%coffee jam%'
     or lower(coalesce(title, '')) like '%кофе джем%'
     or lower(coalesce(category, '')) like '%coffee jam%'
     or lower(coalesce(category, '')) like '%кофе джем%'

  union all

  select id as event_id, 11 as seat_from, 50 as seat_to, 990 as price_rub
  from public.events
  where lower(coalesce(title, '')) like '%coffee jam%'
     or lower(coalesce(title, '')) like '%кофе джем%'
     or lower(coalesce(category, '')) like '%coffee jam%'
     or lower(coalesce(category, '')) like '%кофе джем%'

  union all

  select id as event_id, 51 as seat_from, null::integer as seat_to, 1500 as price_rub
  from public.events
  where lower(coalesce(title, '')) like '%coffee jam%'
     or lower(coalesce(title, '')) like '%кофе джем%'
     or lower(coalesce(category, '')) like '%coffee jam%'
     or lower(coalesce(category, '')) like '%кофе джем%'
) as tiers;
