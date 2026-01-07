import { Expense, dueDayLabels } from '@/types/finance';
import { ExpenseCard } from './ExpenseCard';
import { Calendar, Folder, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface GroupedExpenseListProps {
  title: string;
  dueDay: 10 | 15 | 30;
  expenses: Expense[];
  total: number;
  onToggleStatus: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (expense: Expense) => void;
}

export function GroupedExpenseList({
  title,
  dueDay,
  expenses,
  total,
  onToggleStatus,
  onDelete,
  onEdit,
}: GroupedExpenseListProps) {
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (expenses.length === 0) {
    return null;
  }

  // Agrupar despesas por groupName
  const groupedExpenses = expenses.reduce((acc, expense) => {
    const groupKey = expense.groupName || '_sem_grupo';
    if (!acc[groupKey]) {
      acc[groupKey] = [];
    }
    acc[groupKey].push(expense);
    return acc;
  }, {} as Record<string, Expense[]>);

  // Ordenar grupos: grupos nomeados primeiro (alfabeticamente), depois "sem grupo"
  const sortedGroupKeys = Object.keys(groupedExpenses).sort((a, b) => {
    if (a === '_sem_grupo') return 1;
    if (b === '_sem_grupo') return -1;
    return a.localeCompare(b);
  });

  const toggleGroup = (groupKey: string) => {
    setCollapsedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(groupKey)) {
        newSet.delete(groupKey);
      } else {
        newSet.add(groupKey);
      }
      return newSet;
    });
  };

  const getGroupTotal = (groupExpenses: Expense[]) => {
    return groupExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  };

  const getGroupPaidTotal = (groupExpenses: Expense[]) => {
    return groupExpenses.filter(e => e.status === 'pago').reduce((sum, exp) => sum + exp.amount, 0);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Calendar className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">{dueDayLabels[dueDay]}</h2>
            <p className="text-sm text-muted-foreground">
              {expenses.length} {expenses.length === 1 ? 'despesa' : 'despesas'}
              {Object.keys(groupedExpenses).length > 1 && 
                ` • ${Object.keys(groupedExpenses).filter(k => k !== '_sem_grupo').length} grupos`
              }
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-primary">{formatCurrency(total)}</p>
          <p className="text-sm text-muted-foreground">Vence dia {dueDay}</p>
        </div>
      </div>

      <div className="space-y-4">
        {sortedGroupKeys.map((groupKey) => {
          const groupExpenses = groupedExpenses[groupKey];
          const isCollapsed = collapsedGroups.has(groupKey);
          const groupTotal = getGroupTotal(groupExpenses);
          const groupPaid = getGroupPaidTotal(groupExpenses);
          const isFullyPaid = groupPaid === groupTotal;
          const hasGroup = groupKey !== '_sem_grupo';

          if (!hasGroup) {
            // Renderizar despesas sem grupo diretamente
            return (
              <div key={groupKey} className="space-y-3">
                {groupExpenses.map((expense, index) => (
                  <div key={expense.id} style={{ animationDelay: `${index * 50}ms` }}>
                    <ExpenseCard
                      expense={expense}
                      onToggleStatus={onToggleStatus}
                      onDelete={onDelete}
                      onEdit={onEdit}
                    />
                  </div>
                ))}
              </div>
            );
          }

          // Renderizar grupo com header colapsável
          return (
            <div 
              key={groupKey} 
              className={cn(
                "rounded-xl border-2 overflow-hidden transition-all",
                isFullyPaid ? "border-success/30 bg-success/5" : "border-primary/20 bg-primary/5"
              )}
            >
              <Button
                variant="ghost"
                className="w-full flex items-center justify-between p-4 h-auto hover:bg-transparent"
                onClick={() => toggleGroup(groupKey)}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg",
                    isFullyPaid ? "bg-success/10 text-success" : "bg-primary/10 text-primary"
                  )}>
                    <Folder className="h-4 w-4" />
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{groupKey}</span>
                      <Badge variant="secondary" className="text-xs">
                        {groupExpenses.length} {groupExpenses.length === 1 ? 'item' : 'itens'}
                      </Badge>
                      {isFullyPaid && (
                        <Badge className="bg-success/10 text-success text-xs">
                          Pago
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(groupPaid)} de {formatCurrency(groupTotal)} pago
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn(
                    "text-lg font-bold",
                    isFullyPaid ? "text-success" : "text-primary"
                  )}>
                    {formatCurrency(groupTotal)}
                  </span>
                  {isCollapsed ? (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </Button>
              
              {!isCollapsed && (
                <div className="px-4 pb-4 space-y-3">
                  {groupExpenses.map((expense, index) => (
                    <div key={expense.id} style={{ animationDelay: `${index * 50}ms` }}>
                      <ExpenseCard
                        expense={expense}
                        onToggleStatus={onToggleStatus}
                        onDelete={onDelete}
                        onEdit={onEdit}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}