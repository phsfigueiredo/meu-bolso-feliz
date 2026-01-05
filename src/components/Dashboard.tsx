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
  totalByDueDay: Record<10 | 15 | 30, number>;
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
    <div className="space-y-8">
      {/* Main Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

      {/* Secondary Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard
          title="Pendente"
          value={formatCurrency(totalPending)}
          subtitle="A pagar este mês"
          icon={AlertCircle}
          variant={totalPending > totalIncome * 0.5 ? 'warning' : 'default'}
        />
        <StatCard
          title="Dia 10"
          value={formatCurrency(totalByDueDay[10])}
          subtitle="Total de gastos"
          icon={TrendingUp}
        />
        <StatCard
          title="Dia 15"
          value={formatCurrency(totalByDueDay[15])}
          subtitle="Total de gastos"
          icon={TrendingUp}
        />
        <StatCard
          title="Dia 30"
          value={formatCurrency(totalByDueDay[30])}
          subtitle="Total de gastos"
          icon={TrendingUp}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="stat-card">
          <h3 className="mb-4 text-lg font-semibold">Gastos por Categoria</h3>
          <ExpensesByTypeChart data={expensesByType} />
        </div>
        <div className="stat-card">
          <h3 className="mb-4 text-lg font-semibold">Gastos por Dia de Vencimento</h3>
          <ExpensesByDueDayChart data={totalByDueDay} />
        </div>
      </div>
    </div>
  );
}
