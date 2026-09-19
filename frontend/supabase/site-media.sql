create table if not exists public.site_media (
  id uuid primary key default gen_random_uuid(),
  section text not null check (section in ('hero', 'gallery')),
  media_type text not null check (media_type in ('image', 'video')),
  storage_path text not null,
  poster_path text,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists site_media_section_sort_idx
  on public.site_media (section, sort_order, created_at);

drop trigger if exists site_media_set_updated_at on public.site_media;
create trigger site_media_set_updated_at
before update on public.site_media
for each row execute function public.set_updated_at();

alter table public.site_media enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'site_media' and policyname = 'Public can read site media'
  ) then
    create policy "Public can read site media"
    on public.site_media
    for select
    using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'site_media' and policyname = 'Service role full access on site_media'
  ) then
    create policy "Service role full access on site_media"
    on public.site_media
    for all
    using (auth.role() = 'service_role')
    with check (auth.role() = 'service_role');
  end if;
end;
$$;

insert into storage.buckets (id, name, public, file_size_limit)
values ('site-content', 'site-content', true, 41943040)
on conflict (id) do nothing;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'Public read site-content'
  ) then
    create policy "Public read site-content"
    on storage.objects
    for select
    using (bucket_id = 'site-content');
  end if;
end;
$$;
