import { Wallet, Users } from 'lucide-react';
import { FamilyProfile, Expense, Income } from '@/types/finance';
import { AddExpenseDialog } from './AddExpenseDialog';
import { AddIncomeDialog } from './AddIncomeDialog';
import { months } from '@/types/finance';

interface HeaderProps {
  profiles: FamilyProfile[];
  selectedMonth: number;
  selectedYear: number;
  onAddExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => void;
  onAddIncome: (income: Omit<Income, 'id' | 'createdAt'>) => void;
}

export function Header({ 
  profiles, 
  selectedMonth, 
  selectedYear, 
  onAddExpense, 
  onAddIncome 
}: HeaderProps) {
  const monthName = months.find(m => m.value === selectedMonth)?.label || '';

  return (
    <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold">MeuBolso</h1>
            <p className="text-xs capitalize text-muted-foreground">
              {monthName} de {selectedYear}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <AddIncomeDialog 
            profiles={profiles}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            onAdd={onAddIncome}
          />
          <AddExpenseDialog 
            profiles={profiles}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            onAdd={onAddExpense}
          />
        </div>
      </div>
    </header>
  );
}
