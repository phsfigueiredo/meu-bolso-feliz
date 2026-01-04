import { Expense, expenseTypeLabels } from '@/types/finance';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, X, CreditCard, Home, GraduationCap, Banknote, Receipt, MoreHorizontal, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ExpenseCardProps {
  expense: Expense;
  onToggleStatus: (id: string) => void;
  onDelete: (id: string) => void;
}

const typeIcons = {
  cartao_credito: CreditCard,
  emprestimo: Banknote,
  conta_fixa: Receipt,
  aluguel: Home,
  escola: GraduationCap,
  outros: MoreHorizontal,
};

export function ExpenseCard({ expense, onToggleStatus, onDelete }: ExpenseCardProps) {
  const Icon = typeIcons[expense.type];
  const isPaid = expense.status === 'pago';

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div
      className={cn(
        'group relative rounded-xl border bg-card p-4 transition-all duration-300 hover:shadow-md animate-fade-in',
        isPaid && 'opacity-75'
      )}
    >
      <div className="flex items-center gap-4">
        <div
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-xl transition-colors',
            isPaid ? 'bg-success/10 text-success' : 'bg-primary/10 text-primary'
          )}
        >
          <Icon className="h-5 w-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className={cn('font-semibold truncate', isPaid && 'line-through opacity-70')}>
              {expense.name}
            </h3>
            {expense.paymentType === 'parcelado' && expense.currentInstallment && (
              <Badge variant="secondary" className="text-xs">
                {expense.currentInstallment}/{expense.totalInstallments}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {expenseTypeLabels[expense.type]} • Vence dia {expense.dueDay}
          </p>
        </div>

        <div className="text-right">
          <p className={cn('text-lg font-bold', isPaid ? 'text-success' : 'text-foreground')}>
            {formatCurrency(expense.amount)}
          </p>
          <Badge
            variant={isPaid ? 'default' : 'secondary'}
            className={cn(
              'mt-1',
              isPaid
                ? 'bg-success/10 text-success hover:bg-success/20'
                : 'bg-warning/10 text-warning hover:bg-warning/20'
            )}
          >
            {isPaid ? 'Pago' : 'Pendente'}
          </Badge>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'h-9 w-9 rounded-lg transition-colors',
              isPaid
                ? 'text-success hover:bg-success/10'
                : 'text-muted-foreground hover:bg-primary/10 hover:text-primary'
            )}
            onClick={() => onToggleStatus(expense.id)}
          >
            {isPaid ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => onDelete(expense.id)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
