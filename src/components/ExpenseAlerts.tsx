import { Expense } from '@/types/finance';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Clock, XCircle } from 'lucide-react';

interface ExpenseAlertsProps {
  overdueExpenses: Expense[];
  todayExpenses: Expense[];
}

export function ExpenseAlerts({ overdueExpenses, todayExpenses }: ExpenseAlertsProps) {
  const unpaidOverdue = overdueExpenses.filter(e => e.status === 'nao_pago');
  const unpaidToday = todayExpenses.filter(e => e.status === 'nao_pago');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const totalOverdue = unpaidOverdue.reduce((sum, e) => sum + e.amount, 0);
  const totalToday = unpaidToday.reduce((sum, e) => sum + e.amount, 0);

  if (unpaidOverdue.length === 0 && unpaidToday.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2 sm:space-y-3">
      {unpaidOverdue.length > 0 && (
        <Alert variant="destructive" className="border-destructive/50 bg-destructive/10 py-2.5 sm:py-3">
          <XCircle className="h-4 w-4 sm:h-5 sm:w-5" />
          <AlertTitle className="font-bold text-sm sm:text-base">
            {unpaidOverdue.length} {unpaidOverdue.length === 1 ? 'conta vencida' : 'contas vencidas'}!
          </AlertTitle>
          <AlertDescription className="text-xs sm:text-sm">
            Você tem {formatCurrency(totalOverdue)} em contas vencidas que ainda não foram pagas.
            {unpaidOverdue.length <= 3 && (
              <span className="block mt-1 text-[11px] sm:text-sm opacity-90">
                {unpaidOverdue.map(e => e.name).join(', ')}
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {unpaidToday.length > 0 && (
        <Alert className="border-warning/50 bg-warning/10 text-warning-foreground py-2.5 sm:py-3">
          <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-warning" />
          <AlertTitle className="font-bold text-warning text-sm sm:text-base">
            {unpaidToday.length} {unpaidToday.length === 1 ? 'conta vence hoje' : 'contas vencem hoje'}!
          </AlertTitle>
          <AlertDescription className="text-warning/90 text-xs sm:text-sm">
            Você tem {formatCurrency(totalToday)} para pagar hoje.
            {unpaidToday.length <= 3 && (
              <span className="block mt-1 text-[11px] sm:text-sm">
                {unpaidToday.map(e => e.name).join(', ')}
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
