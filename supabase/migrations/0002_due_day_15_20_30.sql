-- =====================================================================
-- Migração: mudança do conjunto de dias de vencimento
--   {10, 15, 30}  →  {15, 20, 30}
--
-- Ordem importa: preciso dropar o CHECK antigo antes de atualizar,
-- senão o UPDATE viola a constraint em vigor.
--
-- Como aplicar:
--   Supabase Dashboard → SQL Editor → New query → cole tudo → Run
-- =====================================================================

-- 1. Descobrir e dropar o CHECK que restringe due_day
alter table public.expenses drop constraint if exists expenses_due_day_check;

-- 2. Migrar dados antigos: 10 → 20
update public.expenses set due_day = 20 where due_day = 10;

-- 3. Adicionar o CHECK novo
alter table public.expenses add constraint expenses_due_day_check
  check (due_day in (15, 20, 30));
