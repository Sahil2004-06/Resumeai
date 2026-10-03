create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(), user_id uuid not null unique references auth.users(id) on delete cascade,
  full_name text, email text, phone text, location text, linkedin_url text, github_url text, portfolio_url text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.resumes (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  name text not null, data jsonb not null default '{}'::jsonb, template_id text not null default 'clean', current_ats_score integer,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.resume_versions (
  id uuid primary key default gen_random_uuid(), resume_id uuid not null references public.resumes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade, version_name text not null, data jsonb not null default '{}'::jsonb,
  template_id text not null default 'clean', ats_score integer, target_job_title text, target_company text, created_at timestamptz not null default now()
);
create table if not exists public.job_descriptions (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  title text, company text, description text not null, analysis jsonb, created_at timestamptz not null default now()
);
create table if not exists public.ai_suggestions (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  resume_id uuid references public.resumes(id) on delete cascade, job_description_id uuid references public.job_descriptions(id) on delete set null,
  type text not null, original_text text not null, suggested_text text not null, reason text, status text not null default 'pending' check (status in ('pending','accepted','rejected','edited')), created_at timestamptz not null default now()
);
create table if not exists public.job_matches (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  resume_id uuid references public.resumes(id) on delete set null, job_id text not null, job_data jsonb not null default '{}'::jsonb,
  match_score integer, matched_skills jsonb not null default '[]'::jsonb, missing_skills jsonb not null default '[]'::jsonb, created_at timestamptz not null default now()
);
create table if not exists public.saved_jobs (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  job_id text not null, job_data jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), unique(user_id, job_id)
);
create table if not exists public.user_settings (
  id uuid primary key default gen_random_uuid(), user_id uuid not null unique references auth.users(id) on delete cascade,
  default_template text not null default 'clean', default_resume_id uuid references public.resumes(id) on delete set null,
  preferences jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

do $$ declare table_name text; begin
  foreach table_name in array array['profiles','resumes','resume_versions','job_descriptions','ai_suggestions','job_matches','saved_jobs','user_settings'] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('create policy "Users manage own %I" on public.%I for all using (auth.uid() = user_id) with check (auth.uid() = user_id)', table_name, table_name);
  end loop;
end $$;

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin insert into public.profiles (user_id, full_name, email) values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), new.email); return new; end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();