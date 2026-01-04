import { FinancialHealth } from '@/types/finance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Heart, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FinancialHealthCardProps {
  health: FinancialHealth;
}

const statusConfig = {
  excelente: {
    color: 'text-success',
    bgColor: 'bg-success/10',
    progressColor: 'bg-success',
    icon: CheckCircle,
    label: 'Excelente',
  },
  bom: {
    color: 'text-chart-2',
    bgColor: 'bg-chart-2/10',
    progressColor: 'bg-chart-2',
    icon: TrendingUp,
    label: 'Bom',
  },
  regular: {
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    progressColor: 'bg-warning',
    icon: AlertTriangle,
    label: 'Regular',
  },
  ruim: {
    color: 'text-chart-4',
    bgColor: 'bg-chart-4/10',
    progressColor: 'bg-chart-4',
    icon: TrendingDown,
    label: 'Ruim',
  },
  critico: {
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
    progressColor: 'bg-destructive',
    icon: XCircle,
    label: 'Crítico',
  },
};

export function FinancialHealthCard({ health }: FinancialHealthCardProps) {
  const config = statusConfig[health.status];
  const StatusIcon = config.icon;

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

        <div className="grid grid-cols-3 gap-4 pt-2">
          <div className="text-center p-3 rounded-lg bg-background/50">
            <p className="text-xs text-muted-foreground mb-1">Taxa de Poupança</p>
            <p className={cn(
              'text-lg font-bold',
              health.savingsRate >= 10 ? 'text-success' : 
              health.savingsRate >= 0 ? 'text-warning' : 'text-destructive'
            )}>
              {health.savingsRate.toFixed(1)}%
            </p>
          </div>

          <div className="text-center p-3 rounded-lg bg-background/50">
            <p className="text-xs text-muted-foreground mb-1">Comprometimento</p>
            <p className={cn(
              'text-lg font-bold',
              health.debtToIncomeRatio <= 50 ? 'text-success' : 
              health.debtToIncomeRatio <= 70 ? 'text-warning' : 'text-destructive'
            )}>
              {health.debtToIncomeRatio.toFixed(1)}%
            </p>
          </div>

          <div className="text-center p-3 rounded-lg bg-background/50">
            <p className="text-xs text-muted-foreground mb-1">Reserva</p>
            <p className={cn(
              'text-lg font-bold',
              health.emergencyFundMonths >= 3 ? 'text-success' : 
              health.emergencyFundMonths >= 1 ? 'text-warning' : 'text-destructive'
            )}>
              {health.emergencyFundMonths.toFixed(1)}x
            </p>
          </div>
        </div>

        <div className="text-xs text-muted-foreground pt-2 border-t">
          <p className="mb-1">
            <strong>Dicas para melhorar:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1">
            {health.savingsRate < 20 && (
              <li>Tente poupar pelo menos 20% da renda</li>
            )}
            {health.debtToIncomeRatio > 50 && (
              <li>Reduza gastos para liberar mais da sua renda</li>
            )}
            {health.emergencyFundMonths < 3 && (
              <li>Construa uma reserva de 3-6 meses de despesas</li>
            )}
            {health.score >= 80 && (
              <li>Parabéns! Você está no caminho certo. Continue assim!</li>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
