import { cn } from '@/lib/utils';
import type { Expense } from '@/types/finance';

interface Props {
  expense: Expense;
  className?: string;
}

/**
 * Indicador visual de urgência do vencimento (bolinha colorida).
 *
 * Regras:
 * - Pago                              → verde translúcido
 * - Mês passado & não pago            → vermelho (atrasado)
 * - Mês futuro                        → verde
 * - Mês atual & já venceu             → vermelho
 * - Mês atual & faltam ≤ 3 dias       → laranja
 * - Mês atual & faltam ≤ 7 dias       → amarelo
 * - Mês atual & mais de 7 dias        → verde
 */
export function DueSemaphore({ expense, className }: Props) {
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();

  let tone: 'green' | 'yellow' | 'orange' | 'red' = 'green';
  let label = 'Em dia';

  if (expense.status === 'pago') {
    tone = 'green';
    label = 'Pago';
  } else {
    const isPast = expense.year < currentYear || (expense.year === currentYear && expense.month < currentMonth);
    const isFuture = expense.year > currentYear || (expense.year === currentYear && expense.month > currentMonth);

    if (isPast) {
      tone = 'red';
      label = 'Atrasado';
    } else if (isFuture) {
      tone = 'green';
      label = 'Futuro';
    } else {
      // Mês corrente
      const daysUntilDue = expense.dueDay - currentDay;
      if (daysUntilDue < 0) {
        tone = 'red';
        label = `Venceu há ${Math.abs(daysUntilDue)} dia(s)`;
      } else if (daysUntilDue === 0) {
        tone = 'red';
        label = 'Vence hoje';
      } else if (daysUntilDue <= 3) {
        tone = 'orange';
        label = `Vence em ${daysUntilDue} dia(s)`;
      } else if (daysUntilDue <= 7) {
        tone = 'yellow';
        label = `Vence em ${daysUntilDue} dia(s)`;
      } else {
        tone = 'green';
        label = `Vence em ${daysUntilDue} dia(s)`;
      }
    }
  }

  const colorClass =
    tone === 'red'    ? 'bg-red-500' :
    tone === 'orange' ? 'bg-orange-500' :
    tone === 'yellow' ? 'bg-yellow-400' :
                        'bg-emerald-500';

  return (
    <span
      title={label}
      aria-label={label}
      className={cn(
        'inline-block h-2.5 w-2.5 rounded-full shrink-0',
        colorClass,
        expense.status === 'pago' && 'opacity-40',
        className,
      )}
    />
  );
}
