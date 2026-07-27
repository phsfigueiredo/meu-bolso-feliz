import { Wallet, Users } from 'lucide-react';
import { FamilyProfile, Expense, Income } from '@/types/finance';
import { AddExpenseDialog } from './AddExpenseDialog';
import { AddIncomeDialog } from './AddIncomeDialog';
import { SaveButton } from './SaveButton';
import { months } from '@/types/finance';

interface HeaderProps {
  profiles: FamilyProfile[];
  selectedMonth: number;
  selectedYear: number;
  debtGroups?: string[];
  onAddExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => void;
  onAddIncome: (income: Omit<Income, 'id' | 'createdAt'>) => void;
  onSave: () => boolean;
  isSaving: boolean;
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
}

export function Header({ 
  profiles, 
  selectedMonth, 
  selectedYear,
  debtGroups = [],
  onAddExpense, 
  onAddIncome,
  onSave,
  isSaving,
  lastSaved,
  hasUnsavedChanges,
}: HeaderProps) {
  const monthName = months.find(m => m.value === selectedMonth)?.label || '';

  return (
    <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-14 sm:h-16 items-center justify-between px-3 sm:px-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg sm:rounded-xl bg-primary text-primary-foreground">
            <Wallet className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold">MeuBolso</h1>
            <p className="text-[10px] sm:text-xs capitalize text-muted-foreground">
              {monthName} de {selectedYear}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <SaveButton
            onSave={onSave}
            isSaving={isSaving}
            lastSaved={lastSaved}
            hasUnsavedChanges={hasUnsavedChanges}
          />
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
            debtGroups={debtGroups}
            onAdd={onAddExpense}
          />
        </div>
      </div>
    </header>
  );
}
