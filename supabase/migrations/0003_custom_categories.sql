-- =====================================================================
-- Migração: categorias/tags customizadas
--   - Nova tabela expense_categories (nome + cor por usuário)
--   - Nova coluna expenses.category (nome da categoria custom, opcional)
--
-- Como aplicar:
--   Supabase Dashboard → SQL Editor → New query → cole tudo → Run
-- =====================================================================

create table if not exists public.expense_categories (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name    text not null,
  color   text not null default 'hsl(var(--muted-foreground))',
  icon    text,
  primary key (user_id, name)
);

alter table public.expense_categories enable row level security;
drop policy if exists expense_categories_owner_all on public.expense_categories;
create policy expense_categories_owner_all on public.expense_categories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Coluna opcional em expenses; se preenchida, sobrescreve o type na exibição
alter table public.expenses add column if not exists category text;
create index if not exists expenses_category_idx on public.expenses(user_id, category);
