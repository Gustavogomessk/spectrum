-- =============================================================================
-- MIGRATION: Sync admin_institutions to schools table
-- Execute no Supabase: SQL Editor → New query → Run
-- =============================================================================

-- If admin_institutions exists and schools is empty, copy data over
insert into public.schools (id, name, slug, is_public)
select 
  gen_random_uuid() as id,
  name,
  slugify(name) as slug,
  true as is_public
from public.admin_institutions
where not exists (select 1 from public.schools)
on conflict do nothing;

-- Helper function to slugify text
create or replace function slugify(text) returns text as $$
  select lower(
    regexp_replace(
      regexp_replace(
        $1,
        '[^a-zA-Z0-9\s-]', '', 'g'
      ),
      '\s+', '-', 'g'
    )
  )
$$ language sql immutable;

-- Create mapping table to track correspondence between admin_institutions and schools
create table if not exists public.institution_school_mapping (
  institution_id uuid primary key references public.admin_institutions (id) on delete cascade,
  school_id uuid not null references public.schools (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Populate the mapping for existing records
insert into public.institution_school_mapping (institution_id, school_id)
select ai.id, s.id
from public.admin_institutions ai
join public.schools s on slugify(ai.name) = s.slug
where not exists (
  select 1 from public.institution_school_mapping ism 
  where ism.institution_id = ai.id
)
on conflict do nothing;

-- Trigger to auto-create school when institution is created
create or replace function public.create_school_for_institution()
returns trigger as $$
declare
  new_school_id uuid;
begin
  -- Create new school
  insert into public.schools (name, slug, is_public)
  values (
    new.name,
    slugify(new.name) || '-' || substr(gen_random_uuid()::text, 1, 8),
    true
  )
  returning id into new_school_id;
  
  -- Map the institution to the school
  insert into public.institution_school_mapping (institution_id, school_id)
  values (new.id, new_school_id);
  
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_create_school_on_institution on public.admin_institutions;
create trigger trg_create_school_on_institution
after insert on public.admin_institutions
for each row execute function public.create_school_for_institution();
