import { useFinances } from '@/hooks/useFinances';
import { Header } from '@/components/Header';
import { Dashboard } from '@/components/Dashboard';
import { ExpenseList } from '@/components/ExpenseList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayoutDashboard, List } from 'lucide-react';

const Index = () => {
  const {
    expenses,
    userProfile,
    totalIncome,
    totalExpenses,
    totalPaid,
    totalPending,
    salaryCommitment,
    balance,
    expensesByDueDay,
    totalByDueDay,
    expensesByType,
    toggleExpenseStatus,
    addExpense,
    deleteExpense,
    updateUserProfile,
  } = useFinances();

  return (
    <div className="min-h-screen bg-background">
      <Header
        userProfile={userProfile}
        onUpdateProfile={updateUserProfile}
        onAddExpense={addExpense}
      />

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="dashboard" className="gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="expenses" className="gap-2">
              <List className="h-4 w-4" />
              Despesas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <Dashboard
              totalIncome={totalIncome}
              totalExpenses={totalExpenses}
              totalPaid={totalPaid}
              totalPending={totalPending}
              salaryCommitment={salaryCommitment}
              balance={balance}
              expensesByType={expensesByType}
              totalByDueDay={totalByDueDay}
            />
          </TabsContent>

          <TabsContent value="expenses" className="space-y-8">
            <ExpenseList
              title="Vencimento Dia 10"
              dueDay={10}
              expenses={expensesByDueDay[10]}
              total={totalByDueDay[10]}
              onToggleStatus={toggleExpenseStatus}
              onDelete={deleteExpense}
            />
            <ExpenseList
              title="Vencimento Dia 15"
              dueDay={15}
              expenses={expensesByDueDay[15]}
              total={totalByDueDay[15]}
              onToggleStatus={toggleExpenseStatus}
              onDelete={deleteExpense}
            />
            <ExpenseList
              title="Vencimento Dia 30"
              dueDay={30}
              expenses={expensesByDueDay[30]}
              total={totalByDueDay[30]}
              onToggleStatus={toggleExpenseStatus}
              onDelete={deleteExpense}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
