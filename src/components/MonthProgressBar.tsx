import { CheckCircle2, Clock, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MonthProgressBarProps {
  totalIncome: number;
  totalExpenses: number;
  totalPaid: number;
  totalPending: number;
}

const brl = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function MonthProgressBar({
  totalIncome,
  totalExpenses,
  totalPaid,
  totalPending,
}: MonthProgressBarProps) {
  const paidPct = totalExpenses > 0 ? (totalPaid / totalExpenses) * 100 : 0;
  const balance = totalIncome - totalExpenses;
  const balancePositive = balance >= 0;

  return (
    <div className="rounded-xl border bg-card p-3 sm:p-4 space-y-2 sm:space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          <span>
            <strong className="text-foreground">{brl(totalPaid)}</strong> pagos de{' '}
            <strong className="text-foreground">{brl(totalExpenses)}</strong>
          </span>
          <span className="tabular-nums text-muted-foreground">({paidPct.toFixed(0)}%)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-amber-500" />
          <span className="text-muted-foreground">
            Falta pagar <strong className="text-foreground">{brl(totalPending)}</strong>
          </span>
        </div>
      </div>

      <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-emerald-500 transition-all duration-500"
          style={{ width: `${Math.min(paidPct, 100)}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-[11px] sm:text-xs">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Wallet className="h-3.5 w-3.5" />
          Renda: <strong className="text-foreground">{brl(totalIncome)}</strong>
        </div>
        <div className={cn('font-medium', balancePositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive')}>
          Saldo: {brl(balance)}
        </div>
      </div>
    </div>
  );
}
