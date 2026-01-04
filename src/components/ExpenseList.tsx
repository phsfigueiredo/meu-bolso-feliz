import { Expense } from '@/types/finance';
import { ExpenseCard } from './ExpenseCard';
import { Calendar } from 'lucide-react';

interface ExpenseListProps {
  title: string;
  dueDay: number;
  expenses: Expense[];
  total: number;
  onToggleStatus: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ExpenseList({
  title,
  dueDay,
  expenses,
  total,
  onToggleStatus,
  onDelete,
}: ExpenseListProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (expenses.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Calendar className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="text-sm text-muted-foreground">
              {expenses.length} {expenses.length === 1 ? 'despesa' : 'despesas'}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-primary">{formatCurrency(total)}</p>
          <p className="text-sm text-muted-foreground">Total do dia {dueDay}</p>
        </div>
      </div>

      <div className="space-y-3">
        {expenses.map((expense, index) => (
          <div key={expense.id} style={{ animationDelay: `${index * 50}ms` }}>
            <ExpenseCard
              expense={expense}
              onToggleStatus={onToggleStatus}
              onDelete={onDelete}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
