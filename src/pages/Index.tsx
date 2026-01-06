import { useState } from 'react';
import { useFinances } from '@/hooks/useFinances';
import { Header } from '@/components/Header';
import { Dashboard } from '@/components/Dashboard';
import { ExpenseList } from '@/components/ExpenseList';
import { IncomeList } from '@/components/IncomeList';
import { MonthSelector } from '@/components/MonthSelector';
import { ProfileSelector } from '@/components/ProfileSelector';
import { FinancialHealthCard } from '@/components/FinancialHealthCard';
import { DebtEndingsCard } from '@/components/DebtEndingsCard';
import { ExpenseDueDateFilter, DueDateFilter } from '@/components/ExpenseDueDateFilter';
import { ExpenseAlerts } from '@/components/ExpenseAlerts';
import { CopyFromPreviousMonth } from '@/components/CopyFromPreviousMonth';
import { EditExpenseDialog } from '@/components/EditExpenseDialog';
import { EditIncomeDialog } from '@/components/EditIncomeDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayoutDashboard, List, TrendingUp, Heart } from 'lucide-react';
import { Expense, Income } from '@/types/finance';

const Index = () => {
  const [dueDateFilter, setDueDateFilter] = useState<DueDateFilter>('all');
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const [editExpenseOpen, setEditExpenseOpen] = useState(false);
  const [editIncomeOpen, setEditIncomeOpen] = useState(false);
  
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
    expensesByDueDateStatus,
    totalByDueDay,
    expensesByType,
    upcomingDebtEndings,
    financialHealth,
    toggleExpenseStatus,
    addExpense,
    deleteExpense,
    updateExpense,
    addIncome,
    deleteIncome,
    updateIncome,
    addProfile,
    deleteProfile,
    hasDataInCurrentMonth,
    hasPreviousMonthData,
    copyFromPreviousMonth,
  } = useFinances();

  const filteredExpensesByDueDay = {
    10: expensesByDueDateStatus[dueDateFilter].filter((exp) => exp.dueDay === 10),
    15: expensesByDueDateStatus[dueDateFilter].filter((exp) => exp.dueDay === 15),
    30: expensesByDueDateStatus[dueDateFilter].filter((exp) => exp.dueDay === 30),
  };

  const filteredTotalByDueDay = {
    10: filteredExpensesByDueDay[10].reduce((sum, exp) => sum + exp.amount, 0),
    15: filteredExpensesByDueDay[15].reduce((sum, exp) => sum + exp.amount, 0),
    30: filteredExpensesByDueDay[30].reduce((sum, exp) => sum + exp.amount, 0),
  };

  const dueDateCounts = {
    all: expensesByDueDateStatus.all.length,
    today: expensesByDueDateStatus.today.length,
    thisWeek: expensesByDueDateStatus.thisWeek.length,
    upcoming: expensesByDueDateStatus.upcoming.length,
    overdue: expensesByDueDateStatus.overdue.length,
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setEditExpenseOpen(true);
  };

  const handleSaveExpense = (expense: Expense) => {
    updateExpense(expense);
  };

  const handleEditIncome = (income: Income) => {
    setEditingIncome(income);
    setEditIncomeOpen(true);
  };

  const handleSaveIncome = (income: Income) => {
    updateIncome(income);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header
        profiles={profiles}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        onAddExpense={addExpense}
        onAddIncome={addIncome}
      />

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
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

        {/* Copy from previous month button */}
        <CopyFromPreviousMonth
          hasDataInCurrentMonth={hasDataInCurrentMonth}
          hasPreviousMonthData={hasPreviousMonthData}
          onCopy={copyFromPreviousMonth}
        />

        {/* Alerts for overdue and today expenses */}
        <ExpenseAlerts
          overdueExpenses={expensesByDueDateStatus.overdue}
          todayExpenses={expensesByDueDateStatus.today}
        />

        <Tabs defaultValue="dashboard" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-4 h-10 sm:h-11">
            <TabsTrigger value="dashboard" className="gap-1.5 sm:gap-2 text-xs sm:text-sm">
              <LayoutDashboard className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="expenses" className="gap-1.5 sm:gap-2 text-xs sm:text-sm">
              <List className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Despesas</span>
            </TabsTrigger>
            <TabsTrigger value="income" className="gap-1.5 sm:gap-2 text-xs sm:text-sm">
              <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Receitas</span>
            </TabsTrigger>
            <TabsTrigger value="health" className="gap-1.5 sm:gap-2 text-xs sm:text-sm">
              <Heart className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
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

          <TabsContent value="expenses" className="space-y-6">
            <ExpenseDueDateFilter
              filter={dueDateFilter}
              onFilterChange={setDueDateFilter}
              counts={dueDateCounts}
            />
            
            <div className="space-y-8">
              <ExpenseList
                title="Vencimento Dia 10"
                dueDay={10}
                expenses={filteredExpensesByDueDay[10]}
                total={filteredTotalByDueDay[10]}
                onToggleStatus={toggleExpenseStatus}
                onDelete={deleteExpense}
                onEdit={handleEditExpense}
              />
              <ExpenseList
                title="Vencimento Dia 15"
                dueDay={15}
                expenses={filteredExpensesByDueDay[15]}
                total={filteredTotalByDueDay[15]}
                onToggleStatus={toggleExpenseStatus}
                onDelete={deleteExpense}
                onEdit={handleEditExpense}
              />
              <ExpenseList
                title="Vencimento Dia 30"
                dueDay={30}
                expenses={filteredExpensesByDueDay[30]}
                total={filteredTotalByDueDay[30]}
                onToggleStatus={toggleExpenseStatus}
                onDelete={deleteExpense}
                onEdit={handleEditExpense}
              />
            </div>
          </TabsContent>

          <TabsContent value="income" className="space-y-6">
            <IncomeList
              incomes={incomes}
              profiles={profiles}
              onDelete={deleteIncome}
              onEdit={handleEditIncome}
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

      {/* Edit Dialogs */}
      <EditExpenseDialog
        expense={editingExpense}
        profiles={profiles}
        open={editExpenseOpen}
        onOpenChange={setEditExpenseOpen}
        onSave={handleSaveExpense}
      />
      <EditIncomeDialog
        income={editingIncome}
        profiles={profiles}
        open={editIncomeOpen}
        onOpenChange={setEditIncomeOpen}
        onSave={handleSaveIncome}
      />
    </div>
  );
};

export default Index;
