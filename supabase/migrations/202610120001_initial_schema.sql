-- Finwise production data model (Supabase / PostgreSQL)
-- Run in Supabase SQL Editor after creating a Supabase project.
create extension if not exists pgcrypto;

create table if not exists public.adviser_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  firm_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  adviser_id uuid not null references auth.users(id) on delete cascade,
  full_name text not null,
  preferred_name text,
  email text,
  phone text,
  date_of_birth date,
  residency_status text,
  occupation text,
  marital_status text,
  dependants_count integer not null default 0 check (dependants_count >= 0),
  annual_income numeric(14,2) not null default 0 check (annual_income >= 0),
  monthly_expenses numeric(14,2) not null default 0 check (monthly_expenses >= 0),
  cash_savings numeric(14,2) not null default 0 check (cash_savings >= 0),
  investments numeric(14,2) not null default 0 check (investments >= 0),
  cpf_oa numeric(14,2) not null default 0 check (cpf_oa >= 0),
  cpf_sa_ma_ra numeric(14,2) not null default 0 check (cpf_sa_ma_ra >= 0),
  property_value numeric(14,2) not null default 0 check (property_value >= 0),
  outstanding_loans numeric(14,2) not null default 0 check (outstanding_loans >= 0),
  monthly_investment numeric(14,2) not null default 0 check (monthly_investment >= 0),
  target_retirement_age integer not null default 65 check (target_retirement_age between 40 and 100),
  target_retirement_income numeric(14,2) not null default 0 check (target_retirement_income >= 0),
  review_status text not null default 'new' check (review_status in ('new','on_track','review_needed','action_needed')),
  review_due_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.clients add column if not exists asset_ledger_initialized boolean not null default false;
create index if not exists clients_adviser_id_idx on public.clients(adviser_id);
create index if not exists clients_review_due_idx on public.clients(adviser_id, review_due_date);

create table if not exists public.client_dependants (
  id uuid primary key default gen_random_uuid(),
  adviser_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  full_name text not null,
  relationship text not null,
  date_of_birth date,
  financially_dependent boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists dependants_client_idx on public.client_dependants(client_id);

create table if not exists public.client_assets_liabilities (
  id uuid primary key default gen_random_uuid(),
  adviser_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  item_type text not null check (item_type in ('asset','liability')),
  category text not null,
  description text not null,
  current_value numeric(14,2) not null default 0 check (current_value >= 0),
  interest_rate numeric(6,3),
  monthly_payment numeric(14,2) not null default 0 check (monthly_payment >= 0),
  maturity_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists assets_client_idx on public.client_assets_liabilities(client_id);

create table if not exists public.client_policies (
  id uuid primary key default gen_random_uuid(),
  adviser_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  insurer text,
  policy_name text not null,
  policy_type text not null check (policy_type in ('hospitalisation','life','critical_illness','disability_income','personal_accident','long_term_care','investment_linked','savings','other')),
  policy_number_last4 text,
  sum_assured numeric(14,2) not null default 0 check (sum_assured >= 0),
  annual_premium numeric(14,2) not null default 0 check (annual_premium >= 0),
  start_date date,
  review_date date,
  status text not null default 'active' check (status in ('active','pending','lapsed','surrendered')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists policies_client_idx on public.client_policies(client_id);

create table if not exists public.client_goals (
  id uuid primary key default gen_random_uuid(),
  adviser_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  title text not null,
  goal_type text not null check (goal_type in ('retirement','property','education','protection','legacy','investment','other')),
  target_amount numeric(14,2) not null default 0 check (target_amount >= 0),
  current_amount numeric(14,2) not null default 0 check (current_amount >= 0),
  target_date date,
  priority text not null default 'medium' check (priority in ('low','medium','high')),
  status text not null default 'in_progress' check (status in ('not_started','in_progress','on_track','at_risk','completed')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists goals_client_idx on public.client_goals(client_id);

create table if not exists public.client_reviews (
  id uuid primary key default gen_random_uuid(),
  adviser_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  review_date date not null default current_date,
  next_review_date date,
  cashflow_summary jsonb not null default '{}'::jsonb,
  net_worth_summary jsonb not null default '{}'::jsonb,
  risk_profile text,
  agreed_actions jsonb not null default '[]'::jsonb,
  meeting_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists reviews_client_idx on public.client_reviews(client_id, review_date desc);

create table if not exists public.client_planning_scenarios (
  id uuid primary key default gen_random_uuid(),
  adviser_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  name text not null,
  starting_investable_assets numeric(14,2) not null default 0 check (starting_investable_assets >= 0),
  monthly_contribution numeric(14,2) not null default 0 check (monthly_contribution >= 0),
  retirement_age integer not null default 65 check (retirement_age between 40 and 100),
  target_monthly_income numeric(14,2) not null default 5000 check (target_monthly_income >= 0),
  expected_annual_return_pct numeric(5,2) not null default 5 check (expected_annual_return_pct between 0 and 15),
  inflation_pct numeric(5,2) not null default 2.5 check (inflation_pct between 0 and 10),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists scenarios_client_idx on public.client_planning_scenarios(adviser_id, client_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

do $$
declare t text;
begin
  foreach t in array array['adviser_profiles','clients','client_dependants','client_assets_liabilities','client_policies','client_goals','client_reviews','client_planning_scenarios']
  loop
    execute format('drop trigger if exists set_updated_at on public.%I', t);
    execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()', t);
  end loop;
end $$;

create or replace function public.create_adviser_profile()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.adviser_profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name',''))
  on conflict (id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile after insert on auth.users
for each row execute procedure public.create_adviser_profile();

alter table public.adviser_profiles enable row level security;
alter table public.clients enable row level security;
alter table public.client_dependants enable row level security;
alter table public.client_assets_liabilities enable row level security;
alter table public.client_policies enable row level security;
alter table public.client_goals enable row level security;
alter table public.client_reviews enable row level security;
alter table public.client_planning_scenarios enable row level security;

drop policy if exists "advisers manage own profile" on public.adviser_profiles;
create policy "advisers manage own profile" on public.adviser_profiles
for all to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

drop policy if exists "advisers manage own clients" on public.clients;
create policy "advisers manage own clients" on public.clients
for all to authenticated using (adviser_id = (select auth.uid())) with check (adviser_id = (select auth.uid()));

drop policy if exists "advisers manage own dependants" on public.client_dependants;
create policy "advisers manage own dependants" on public.client_dependants
for all to authenticated using (adviser_id = (select auth.uid()) and exists (select 1 from public.clients c where c.id = client_id and c.adviser_id = (select auth.uid()))) with check (adviser_id = (select auth.uid()) and exists (select 1 from public.clients c where c.id = client_id and c.adviser_id = (select auth.uid())));

drop policy if exists "advisers manage own assets and liabilities" on public.client_assets_liabilities;
create policy "advisers manage own assets and liabilities" on public.client_assets_liabilities
for all to authenticated using (adviser_id = (select auth.uid()) and exists (select 1 from public.clients c where c.id = client_id and c.adviser_id = (select auth.uid()))) with check (adviser_id = (select auth.uid()) and exists (select 1 from public.clients c where c.id = client_id and c.adviser_id = (select auth.uid())));

drop policy if exists "advisers manage own policies" on public.client_policies;
create policy "advisers manage own policies" on public.client_policies
for all to authenticated using (adviser_id = (select auth.uid()) and exists (select 1 from public.clients c where c.id = client_id and c.adviser_id = (select auth.uid()))) with check (adviser_id = (select auth.uid()) and exists (select 1 from public.clients c where c.id = client_id and c.adviser_id = (select auth.uid())));

drop policy if exists "advisers manage own goals" on public.client_goals;
create policy "advisers manage own goals" on public.client_goals
for all to authenticated using (adviser_id = (select auth.uid()) and exists (select 1 from public.clients c where c.id = client_id and c.adviser_id = (select auth.uid()))) with check (adviser_id = (select auth.uid()) and exists (select 1 from public.clients c where c.id = client_id and c.adviser_id = (select auth.uid())));

drop policy if exists "advisers manage own scenarios" on public.client_planning_scenarios;
create policy "advisers manage own scenarios" on public.client_planning_scenarios
for all to authenticated using (adviser_id = (select auth.uid()) and exists (select 1 from public.clients c where c.id = client_id and c.adviser_id = (select auth.uid()))) with check (adviser_id = (select auth.uid()) and exists (select 1 from public.clients c where c.id = client_id and c.adviser_id = (select auth.uid())));

drop policy if exists "advisers manage own reviews" on public.client_reviews;
create policy "advisers manage own reviews" on public.client_reviews
for all to authenticated using (adviser_id = (select auth.uid()) and exists (select 1 from public.clients c where c.id = client_id and c.adviser_id = (select auth.uid()))) with check (adviser_id = (select auth.uid()) and exists (select 1 from public.clients c where c.id = client_id and c.adviser_id = (select auth.uid())));

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.adviser_profiles, public.clients, public.client_dependants, public.client_assets_liabilities, public.client_policies, public.client_goals, public.client_reviews, public.client_planning_scenarios to authenticated;

create table if not exists public.adviser_audit_events (
  id uuid primary key default gen_random_uuid(),
  adviser_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  action text not null check (action in ('create','update','delete','review')),
  entity_type text not null check (entity_type in ('client','goal','policy','review','asset','dependant','scenario')),
  entity_id text,
  changed_fields jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists audit_adviser_created_idx on public.adviser_audit_events(adviser_id, created_at desc);
alter table public.adviser_audit_events enable row level security;
drop policy if exists "advisers read own audit events" on public.adviser_audit_events;
create policy "advisers read own audit events" on public.adviser_audit_events
for select to authenticated using (adviser_id = (select auth.uid()));
drop policy if exists "advisers create own audit events" on public.adviser_audit_events;
create policy "advisers create own audit events" on public.adviser_audit_events
for insert to authenticated with check (adviser_id = (select auth.uid()));
alter table public.adviser_audit_events drop constraint if exists adviser_audit_events_entity_type_check;
alter table public.adviser_audit_events add constraint adviser_audit_events_entity_type_check check (entity_type in ('client','goal','policy','review','asset','dependant','scenario'));
grant select, insert on public.adviser_audit_events to authenticated;

