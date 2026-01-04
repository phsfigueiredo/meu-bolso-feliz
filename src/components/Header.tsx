import { Wallet } from 'lucide-react';
import { UserProfile } from '@/types/finance';
import { SalaryDialog } from './SalaryDialog';
import { AddExpenseDialog } from './AddExpenseDialog';
import { Expense } from '@/types/finance';

interface HeaderProps {
  userProfile: UserProfile;
  onUpdateProfile: (profile: Partial<UserProfile>) => void;
  onAddExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => void;
}

export function Header({ userProfile, onUpdateProfile, onAddExpense }: HeaderProps) {
  const currentMonth = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date());

  return (
    <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold">MeuBolso</h1>
            <p className="text-xs capitalize text-muted-foreground">{currentMonth}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <SalaryDialog userProfile={userProfile} onUpdate={onUpdateProfile} />
          <AddExpenseDialog onAdd={onAddExpense} />
        </div>
      </div>
    </header>
  );
}
