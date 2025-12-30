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

create table if not exists public.field_values (
  id uuid primary key default gen_random_uuid(),
  field_definition_id uuid not null references public.field_definitions(id) on delete cascade,
  value text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists field_values_unique
  on public.field_values (field_definition_id);

create or replace function public.touch_field_values_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists field_values_updated_at on public.field_values;
create trigger field_values_updated_at
before update on public.field_values
for each row execute function public.touch_field_values_updated_at();
