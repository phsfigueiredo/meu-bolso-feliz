import { StatCard } from './StatCard';
import { ExpensesByTypeChart } from './charts/ExpensesByTypeChart';
import { ExpensesByDueDayChart } from './charts/ExpensesByDueDayChart';
import { ExpenseType } from '@/types/finance';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  PiggyBank,
} from 'lucide-react';

interface DashboardProps {
  totalIncome: number;
  totalExpenses: number;
  totalPaid: number;
  totalPending: number;
  salaryCommitment: number;
  balance: number;
  expensesByType: Record<ExpenseType, number>;
  totalByDueDay: Record<15 | 20 | 30, number>;
}

export function Dashboard({
  totalIncome,
  totalExpenses,
  totalPaid,
  totalPending,
  salaryCommitment,
  balance,
  expensesByType,
  totalByDueDay,
}: DashboardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      {/* Main Stats */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4">
        <StatCard
          title="Renda Total"
          value={formatCurrency(totalIncome)}
          subtitle="Salário + Benefícios"
          icon={Wallet}
          variant="primary"
        />
        <StatCard
          title="Total de Gastos"
          value={formatCurrency(totalExpenses)}
          subtitle={`${formatPercent(salaryCommitment)} da renda`}
          icon={TrendingDown}
          variant={salaryCommitment > 80 ? 'destructive' : 'default'}
        />
        <StatCard
          title="Pago no Mês"
          value={formatCurrency(totalPaid)}
          icon={CheckCircle}
          variant="success"
        />
        <StatCard
          title="Saldo Disponível"
          value={formatCurrency(balance)}
          subtitle={balance < 0 ? 'Déficit' : 'Sobra'}
          icon={balance < 0 ? AlertCircle : PiggyBank}
          variant={balance < 0 ? 'destructive' : 'success'}
        />
      </div>

      {/* Secondary Stats - Ordem: 30, 15, 20 */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4 sm:grid-cols-4">
        <StatCard
          title="Pendente"
          value={formatCurrency(totalPending)}
          subtitle="A pagar este mês"
          icon={AlertCircle}
          variant={totalPending > totalIncome * 0.5 ? 'warning' : 'default'}
        />
        <StatCard
          title="1º Pag. (Dia 30)"
          value={formatCurrency(totalByDueDay[30])}
          subtitle="Total de gastos"
          icon={TrendingUp}
        />
        <StatCard
          title="2º Pag. (Dia 15)"
          value={formatCurrency(totalByDueDay[15])}
          subtitle="Total de gastos"
          icon={TrendingUp}
        />
        <StatCard
          title="3º Pag. (Dia 20)"
          value={formatCurrency(totalByDueDay[20])}
          subtitle="Total de gastos"
          icon={TrendingUp}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <div className="stat-card">
          <h3 className="mb-3 sm:mb-4 text-base sm:text-lg font-semibold">Gastos por Categoria</h3>
          <ExpensesByTypeChart data={expensesByType} />
        </div>
        <div className="stat-card">
          <h3 className="mb-3 sm:mb-4 text-base sm:text-lg font-semibold">Gastos por Dia de Vencimento</h3>
          <ExpensesByDueDayChart data={totalByDueDay} />
        </div>
      </div>
    </div>
  );
}
