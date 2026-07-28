import { Expense, expenseTypeLabels, paymentMethodLabels } from '@/types/finance';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, CreditCard, Home, GraduationCap, Banknote, Receipt, MoreHorizontal, Trash2, Pencil } from 'lucide-react';
import { DueSemaphore } from './DueSemaphore';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface ExpenseCardProps {
  expense: Expense;
  onToggleStatus: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (expense: Expense) => void;
}

const typeIcons = {
  cartao_credito: CreditCard,
  emprestimo: Banknote,
  conta_fixa: Receipt,
  aluguel: Home,
  escola: GraduationCap,
  outros: MoreHorizontal,
};

export function ExpenseCard({ expense, onToggleStatus, onDelete, onEdit }: ExpenseCardProps) {
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
        'group relative rounded-xl border bg-card p-3 sm:p-4 transition-all duration-300 hover:shadow-md animate-fade-in',
        isPaid && 'opacity-75'
      )}
    >
      {/* Mobile Layout */}
      <div className="flex flex-col gap-3 sm:hidden">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors',
              isPaid ? 'bg-success/10 text-success' : 'bg-primary/10 text-primary'
            )}
          >
            <Icon className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <DueSemaphore expense={expense} />
              <h3 className={cn('font-semibold text-sm truncate', isPaid && 'line-through opacity-70')}>
                {expense.name}
              </h3>
              {expense.paymentType === 'parcelado' && expense.currentInstallment && (
                <Badge variant="secondary" className="text-xs shrink-0">
                  {expense.currentInstallment}/{expense.totalInstallments}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {expenseTypeLabels[expense.type]} • Dia {expense.dueDay}
              {expense.category && (
                <>
                  {' • '}
                  <span className="font-medium">{expense.category}</span>
                </>
              )}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className={cn('text-base font-bold', isPaid ? 'text-success' : 'text-foreground')}>
              {formatCurrency(expense.amount)}
            </p>
          </div>
        </div>
        
        <div className="flex items-center justify-between gap-2 pt-2 border-t">
          <Badge
            variant={isPaid ? 'default' : 'secondary'}
            className={cn(
              isPaid
                ? 'bg-success/10 text-success hover:bg-success/20'
                : 'bg-warning/10 text-warning hover:bg-warning/20'
            )}
          >
            {isPaid ? 'Pago' : 'Pendente'}
          </Badge>
          
          <div className="flex items-center gap-1">
            <Button
              variant={isPaid ? 'ghost' : 'default'}
              size="sm"
              className={cn(
                'gap-1.5 h-8 text-xs transition-colors',
                isPaid
                  ? 'text-success hover:bg-success/10'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
              )}
              onClick={() => onToggleStatus(expense.id)}
            >
              {isPaid ? (
                <>
                  <CheckCircle className="h-3.5 w-3.5" />
                  Pago
                </>
              ) : (
                'Pagar'
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary"
              onClick={() => onEdit(expense)}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="max-w-[90vw] sm:max-w-lg">
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir despesa?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja excluir a despesa "{expense.name}"?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(expense.id)}>
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden sm:flex items-center gap-4">
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
            <DueSemaphore expense={expense} />
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
            {expense.paymentMethod && ` • ${paymentMethodLabels[expense.paymentMethod]}`}
            {expense.category && (
              <>
                {' • '}
                <span className="font-medium text-foreground">{expense.category}</span>
              </>
            )}
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
            variant={isPaid ? 'ghost' : 'default'}
            size="sm"
            className={cn(
              'gap-2 transition-colors',
              isPaid
                ? 'text-success hover:bg-success/10'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
            )}
            onClick={() => onToggleStatus(expense.id)}
          >
            {isPaid ? (
              <>
                <CheckCircle className="h-4 w-4" />
                Pago
              </>
            ) : (
              'Pagar'
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-lg text-muted-foreground hover:text-primary"
            onClick={() => onEdit(expense)}
          >
            <Pencil className="h-4 w-4" />
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir despesa?</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir a despesa "{expense.name}"?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(expense.id)}>
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
