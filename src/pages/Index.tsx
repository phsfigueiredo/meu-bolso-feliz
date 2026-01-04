import { useFinances } from '@/hooks/useFinances';
import { Header } from '@/components/Header';
import { Dashboard } from '@/components/Dashboard';
import { ExpenseList } from '@/components/ExpenseList';
import { IncomeList } from '@/components/IncomeList';
import { MonthSelector } from '@/components/MonthSelector';
import { ProfileSelector } from '@/components/ProfileSelector';
import { FinancialHealthCard } from '@/components/FinancialHealthCard';
import { DebtEndingsCard } from '@/components/DebtEndingsCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayoutDashboard, List, TrendingUp, Heart } from 'lucide-react';

const Index = () => {
  const {
    expenses,
    allExpenses,
    incomes,
    profiles,
    selectedProfileId,
    setSelectedProfileId,
    selectedMonth,
    setSelectedMonth,
    selectedYear,
    setSelectedYear,
    totalIncome,
    totalExpenses,
    totalPaid,
    totalPending,
    salaryCommitment,
    balance,
    expensesByDueDay,
    totalByDueDay,
    expensesByType,
    upcomingDebtEndings,
    financialHealth,
    toggleExpenseStatus,
    addExpense,
    deleteExpense,
    addIncome,
    deleteIncome,
    addProfile,
    deleteProfile,
  } = useFinances();

  return (
    <div className="min-h-screen bg-background">
      <Header
        profiles={profiles}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        onAddExpense={addExpense}
        onAddIncome={addIncome}
      />

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Month Selector */}
        <MonthSelector
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onMonthChange={setSelectedMonth}
          onYearChange={setSelectedYear}
        />

        {/* Profile Selector */}
        <ProfileSelector
          profiles={profiles}
          selectedProfileId={selectedProfileId}
          onSelectProfile={setSelectedProfileId}
          onAddProfile={addProfile}
          onDeleteProfile={deleteProfile}
        />

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-4">
            <TabsTrigger value="dashboard" className="gap-2">
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="expenses" className="gap-2">
              <List className="h-4 w-4" />
              <span className="hidden sm:inline">Despesas</span>
            </TabsTrigger>
            <TabsTrigger value="income" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Receitas</span>
            </TabsTrigger>
            <TabsTrigger value="health" className="gap-2">
              <Heart className="h-4 w-4" />
              <span className="hidden sm:inline">Saúde</span>
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

          <TabsContent value="income" className="space-y-6">
            <IncomeList
              incomes={incomes}
              profiles={profiles}
              onDelete={deleteIncome}
            />
          </TabsContent>

          <TabsContent value="health" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <FinancialHealthCard health={financialHealth} />
              <DebtEndingsCard debts={upcomingDebtEndings} profiles={profiles} />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
