create table if not exists public.field_definitions (
  id uuid primary key default gen_random_uuid(),
  key text not null,
  label text,
  scope text not null default 'wholesaler',
  wholesaler_id uuid references public.wholesalers(id) on delete cascade,
  source text not null default 'manual',
  created_at timestamptz not null default now(),
  unique (key, scope, wholesaler_id)
);
