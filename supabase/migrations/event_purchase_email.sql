alter table public.events
  add column if not exists purchase_email_message text;
