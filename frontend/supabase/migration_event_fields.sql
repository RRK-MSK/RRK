-- Run in Supabase SQL editor before deploying CRM calendar updates.
alter table public.events
  add column if not exists price_label text,
  add column if not exists venue_address text,
  add column if not exists venue_map_url text;
