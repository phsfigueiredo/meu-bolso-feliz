import { FinancialHealth } from '@/types/finance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Heart, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, XCircle, Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FinancialHealthCardProps {
  health: FinancialHealth;
  totalIncome: number;
  totalExpenses: number;
  balance: number;
}

const statusConfig = {
  excelente: {
    color: 'text-success',
    bgColor: 'bg-success/10',
    icon: CheckCircle,
    label: 'Excelente',
  },
  bom: {
    color: 'text-chart-2',
    bgColor: 'bg-chart-2/10',
    icon: TrendingUp,
    label: 'Bom',
  },
  regular: {
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    icon: AlertTriangle,
    label: 'Regular',
  },
  ruim: {
    color: 'text-chart-4',
    bgColor: 'bg-chart-4/10',
    icon: TrendingDown,
    label: 'Ruim',
  },
  critico: {
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
    icon: XCircle,
    label: 'Crítico',
  },
};

const brl = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function FinancialHealthCard({ health, totalIncome, totalExpenses, balance }: FinancialHealthCardProps) {
  const config = statusConfig[health.status];
  const StatusIcon = config.icon;
  const noData = totalIncome === 0 && totalExpenses === 0;

  return (
    <Card className={cn('border-2', config.bgColor)}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Heart className={cn('h-5 w-5', config.color)} />
            Saúde Financeira
          </span>
          <span className={cn('text-2xl font-bold', config.color)}>
            {health.score}/100
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Score Geral</span>
            <div className={cn('flex items-center gap-1 font-semibold', config.color)}>
              <StatusIcon className="h-4 w-4" />
              {config.label}
            </div>
          </div>
          <Progress value={health.score} className="h-3" />
        </div>

        {noData ? (
          <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 mt-0.5 shrink-0" />
              <div>
                Não há dados suficientes neste período (nem no mês nem nos últimos 6 meses).
                Adicione uma renda e algumas despesas para o score começar a fazer sentido.
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-2">
              <div className="text-center p-2 sm:p-3 rounded-lg bg-background/50">
                <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">Poupança</p>
                <p className={cn(
                  'text-base sm:text-lg font-bold',
                  health.savingsRate >= 10 ? 'text-success' :
                  health.savingsRate >= 0 ? 'text-warning' : 'text-destructive',
                )}>
                  {health.savingsRate.toFixed(1)}%
                </p>
                <p className="text-[9px] sm:text-[10px] text-muted-foreground">meta 20%</p>
              </div>

              <div className="text-center p-2 sm:p-3 rounded-lg bg-background/50">
                <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">Comprometimento</p>
                <p className={cn(
                  'text-base sm:text-lg font-bold',
                  health.debtToIncomeRatio <= 50 ? 'text-success' :
                  health.debtToIncomeRatio <= 70 ? 'text-warning' : 'text-destructive',
                )}>
                  {health.debtToIncomeRatio.toFixed(1)}%
                </p>
                <p className="text-[9px] sm:text-[10px] text-muted-foreground">meta ≤ 50%</p>
              </div>

              <div className="text-center p-2 sm:p-3 rounded-lg bg-background/50">
                <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">Reserva</p>
                <p className={cn(
                  'text-base sm:text-lg font-bold',
                  health.emergencyFundMonths >= 3 ? 'text-success' :
                  health.emergencyFundMonths >= 1 ? 'text-warning' : 'text-destructive',
                )}>
                  {health.emergencyFundMonths.toFixed(1)}x
                </p>
                <p className="text-[9px] sm:text-[10px] text-muted-foreground">meta 3–6x</p>
              </div>
            </div>

            <div className="rounded-md bg-background/30 p-3 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Renda do mês</span>
                <span className="font-medium">{brl(totalIncome)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Gastos do mês</span>
                <span className="font-medium">{brl(totalExpenses)}</span>
              </div>
              <div className="flex justify-between pt-1 border-t">
                <span className="text-muted-foreground">Saldo</span>
                <span className={cn(
                  'font-semibold',
                  balance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive',
                )}>
                  {brl(balance)}
                </span>
              </div>
            </div>

            <div className="text-xs text-muted-foreground pt-2 border-t">
              <p className="mb-1">
                <strong>Dicas para melhorar:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1">
                {health.savingsRate < 5 && (
                  <li>Sua taxa de poupança está baixa (ideal: 10–20%).</li>
                )}
                {health.savingsRate < 0 && (
                  <li>Você está gastando mais do que ganha — atenção urgente.</li>
                )}
                {health.debtToIncomeRatio > 70 && (
                  <li>Comprometimento acima de 70% aperta o orçamento; tenta identificar 1 despesa recorrente pra cortar.</li>
                )}
                {health.debtToIncomeRatio > 100 && (
                  <li>Gastos superam a renda — reveja parcelamentos e cartões.</li>
                )}
                {health.emergencyFundMonths < 3 && health.emergencyFundMonths >= 0 && (
                  <li>Construa uma reserva de 3–6 meses de despesas.</li>
                )}
                {health.score >= 80 && (
                  <li>Parabéns! Você está no caminho certo. Continue assim.</li>
                )}
              </ul>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
