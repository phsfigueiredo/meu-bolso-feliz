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
    <div className="space-y-3">
      {unpaidOverdue.length > 0 && (
        <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
          <XCircle className="h-5 w-5" />
          <AlertTitle className="font-bold">
            {unpaidOverdue.length} {unpaidOverdue.length === 1 ? 'conta vencida' : 'contas vencidas'}!
          </AlertTitle>
          <AlertDescription>
            Você tem {formatCurrency(totalOverdue)} em contas vencidas que ainda não foram pagas.
            {unpaidOverdue.length <= 3 && (
              <span className="block mt-1 text-sm opacity-90">
                {unpaidOverdue.map(e => e.name).join(', ')}
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {unpaidToday.length > 0 && (
        <Alert className="border-warning/50 bg-warning/10 text-warning-foreground">
          <Clock className="h-5 w-5 text-warning" />
          <AlertTitle className="font-bold text-warning">
            {unpaidToday.length} {unpaidToday.length === 1 ? 'conta vence hoje' : 'contas vencem hoje'}!
          </AlertTitle>
          <AlertDescription className="text-warning/90">
            Você tem {formatCurrency(totalToday)} para pagar hoje.
            {unpaidToday.length <= 3 && (
              <span className="block mt-1 text-sm">
                {unpaidToday.map(e => e.name).join(', ')}
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
