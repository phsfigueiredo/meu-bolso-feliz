-- =====================================================================
-- Schema inicial do "Meu Bolso Feliz" no Supabase (Postgres)
-- Espelha o schema do SQLite local, com user_id + RLS para isolar
-- os dados por conta autenticada.
--
-- Como aplicar:
--   Supabase Dashboard → SQL Editor → New query → cole tudo → Run
-- =====================================================================

-- ---------------------------------------------------------------------
-- Tabela: profiles (perfis familiares)
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id         text        primary key,
  user_id    uuid        not null default auth.uid() references auth.users(id) on delete cascade,
  name       text        not null,
  type       text        not null check (type in ('titular','conjuge','filho','outro')),
  avatar     text,
  color      text        not null,
  created_at timestamptz not null default now()
);
create index if not exists profiles_user_id_idx on public.profiles(user_id);

-- ---------------------------------------------------------------------
-- Tabela: incomes
-- ---------------------------------------------------------------------
create table if not exists public.incomes (
  id           text        primary key,
  user_id      uuid        not null default auth.uid() references auth.users(id) on delete cascade,
  name         text        not null,
  type         text        not null check (type in ('salario','beneficio','freelance','investimento','outros')),
  amount       numeric     not null check (amount >= 0),
  is_recurrent boolean     not null default false,
  profile_id   text        not null references public.profiles(id) on delete cascade,
  month        int         not null check (month between 1 and 12),
  year         int         not null,
  created_at   timestamptz not null default now()
);
create index if not exists incomes_user_period_idx on public.incomes(user_id, year, month, profile_id);

-- ---------------------------------------------------------------------
-- Tabela: expenses
-- ---------------------------------------------------------------------
create table if not exists public.expenses (
  id                   text        primary key,
  user_id              uuid        not null default auth.uid() references auth.users(id) on delete cascade,
  name                 text        not null,
  type                 text        not null check (type in ('cartao_credito','emprestimo','conta_fixa','aluguel','escola','outros')),
  amount               numeric     not null check (amount >= 0),
  due_day              int         not null check (due_day in (15,20,30)),
  payment_type         text        not null check (payment_type in ('recorrente','parcelado')),
  payment_method       text        check (payment_method in ('pix','boleto','debito_automatico','cartao','dinheiro','transferencia')),
  current_installment  int,
  total_installments   int,
  end_date             date,
  status               text        not null default 'nao_pago' check (status in ('pago','nao_pago')),
  total_paid           numeric     not null default 0,
  total_remaining      numeric     not null default 0,
  profile_id           text        not null references public.profiles(id) on delete cascade,
  month                int         not null check (month between 1 and 12),
  year                 int         not null,
  group_name           text,
  created_at           timestamptz not null default now()
);
create index if not exists expenses_user_period_idx on public.expenses(user_id, year, month, profile_id);
create index if not exists expenses_group_idx       on public.expenses(user_id, group_name);

-- ---------------------------------------------------------------------
-- Tabela: debt_groups
-- ---------------------------------------------------------------------
create table if not exists public.debt_groups (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name    text not null,
  primary key (user_id, name)
);

-- ---------------------------------------------------------------------
-- Row Level Security — cada usuário só vê os próprios dados
-- ---------------------------------------------------------------------
alter table public.profiles    enable row level security;
alter table public.incomes     enable row level security;
alter table public.expenses    enable row level security;
alter table public.debt_groups enable row level security;

-- profiles
drop policy if exists profiles_owner_all on public.profiles;
create policy profiles_owner_all on public.profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- incomes
drop policy if exists incomes_owner_all on public.incomes;
create policy incomes_owner_all on public.incomes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- expenses
drop policy if exists expenses_owner_all on public.expenses;
create policy expenses_owner_all on public.expenses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- debt_groups
drop policy if exists debt_groups_owner_all on public.debt_groups;
create policy debt_groups_owner_all on public.debt_groups
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
