import { useState } from 'react';
import { useFinances } from '@/hooks/useFinances';
import PasswordGate from '@/components/PasswordGate';
import SupabaseAuthGate from '@/components/SupabaseAuthGate';
import { isSupabaseConfigured } from '@/lib/supabase';
import { Header } from '@/components/Header';
import { Dashboard } from '@/components/Dashboard';
import { GroupedExpenseList } from '@/components/GroupedExpenseList';
import { IncomeList } from '@/components/IncomeList';
import { MonthSelector } from '@/components/MonthSelector';
import { ProfileSelector } from '@/components/ProfileSelector';
import { FinancialHealthCard } from '@/components/FinancialHealthCard';
import { DebtEndingsCard } from '@/components/DebtEndingsCard';
import { ExpenseDueDateFilter, DueDateFilter } from '@/components/ExpenseDueDateFilter';
import { ExpenseAlerts } from '@/components/ExpenseAlerts';
import { CopyFromPreviousMonth } from '@/components/CopyFromPreviousMonth';
import { ReplicatePreviousMonth } from '@/components/ReplicatePreviousMonth';
import { MonthProgressBar } from '@/components/MonthProgressBar';
import { EditExpenseDialog } from '@/components/EditExpenseDialog';
import { EditIncomeDialog } from '@/components/EditIncomeDialog';
import { DebtGroupManager } from '@/components/DebtGroupManager';
import { CategoryManager } from '@/components/CategoryManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayoutDashboard, List, TrendingUp, Heart } from 'lucide-react';
import { Expense, Income, dueDayOrder } from '@/types/finance';

const Index = () =>
  isSupabaseConfigured ? (
    <SupabaseAuthGate>
      <IndexContent />
    </SupabaseAuthGate>
  ) : (
    <PasswordGate>
      <IndexContent />
    </PasswordGate>
  );

// Todo o conteúdo com useFinances fica aqui — só monta DEPOIS do unlock,
// para que o seed criptografado tenha sido descriptografado e escrito no
// IndexedDB antes do primeiro fetch de dados.
const IndexContent = () => {
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
    moveExpenseDueDay,
    addIncome,
    deleteIncome,
    updateIncome,
    addProfile,
    deleteProfile,
    countsByProfile,
    hasDataInCurrentMonth,
    hasPreviousMonthData,
    copyFromPreviousMonth,
    replicateFromPreviousMonth,
    debtGroups,
    addDebtGroup,
    editDebtGroup,
    deleteDebtGroup,
    expenseCountByGroup,
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    saveData,
    isSaving,
    lastSaved,
    hasUnsavedChanges,
    isLoading,
    apiError,
  } = useFinances();

  const filteredExpensesByDueDay = {
    15: expensesByDueDateStatus[dueDateFilter].filter((exp) => exp.dueDay === 15),
    20: expensesByDueDateStatus[dueDateFilter].filter((exp) => exp.dueDay === 20),
    30: expensesByDueDateStatus[dueDateFilter].filter((exp) => exp.dueDay === 30),
  };

  const filteredTotalByDueDay = {
    15: filteredExpensesByDueDay[15].reduce((sum, exp) => sum + exp.amount, 0),
    20: filteredExpensesByDueDay[20].reduce((sum, exp) => sum + exp.amount, 0),
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

  // Loading inicial: quando ainda não temos dados na tela E o hook ainda
  // está buscando. Depois que a primeira carga completa, o loading não
  // bloqueia mais (evita piscar toda vez que o usuário troca de mês).
  if (isLoading && profiles.length === 0 && !apiError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Carregando seus dados...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header
        profiles={profiles}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        debtGroups={debtGroups}
        categories={categories}
        onAddExpense={addExpense}
        onAddIncome={addIncome}
        onSave={saveData}
        isSaving={isSaving}
        lastSaved={lastSaved}
        hasUnsavedChanges={hasUnsavedChanges}
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
          countsByProfile={countsByProfile}
        />

        {/* Ações do mês anterior */}
        <div className="flex flex-wrap items-center gap-2">
          <CopyFromPreviousMonth
            hasDataInCurrentMonth={hasDataInCurrentMonth}
            hasPreviousMonthData={hasPreviousMonthData}
            onCopy={copyFromPreviousMonth}
          />
          <ReplicatePreviousMonth
            hasPreviousMonthData={hasPreviousMonthData}
            onReplicate={replicateFromPreviousMonth}
          />
        </div>

        {/* Progresso mensal */}
        <MonthProgressBar
          totalIncome={totalIncome}
          totalExpenses={totalExpenses}
          totalPaid={totalPaid}
          totalPending={totalPending}
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <ExpenseDueDateFilter
                filter={dueDateFilter}
                onFilterChange={setDueDateFilter}
                counts={dueDateCounts}
              />
              <div className="flex items-center gap-2">
                <CategoryManager
                  categories={categories}
                  onAdd={addCategory}
                  onUpdate={updateCategory}
                  onDelete={deleteCategory}
                />
                <DebtGroupManager
                  groups={debtGroups}
                  onAddGroup={addDebtGroup}
                  onEditGroup={editDebtGroup}
                  onDeleteGroup={deleteDebtGroup}
                  expenseCountByGroup={expenseCountByGroup}
                />
              </div>
            </div>
            
            <div className="space-y-8">
              {dueDayOrder.map((day) => (
                <GroupedExpenseList
                  key={day}
                  title={`Vencimento Dia ${day}`}
                  dueDay={day}
                  expenses={filteredExpensesByDueDay[day]}
                  total={filteredTotalByDueDay[day]}
                  onToggleStatus={toggleExpenseStatus}
                  onDelete={deleteExpense}
                  onEdit={handleEditExpense}
                  onMoveToDueDay={moveExpenseDueDay}
                />
              ))}
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
              <FinancialHealthCard
                health={financialHealth}
                totalIncome={totalIncome}
                totalExpenses={totalExpenses}
                balance={balance}
              />
              <DebtEndingsCard debts={upcomingDebtEndings} profiles={profiles} />
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Edit Dialogs */}
      <EditExpenseDialog
        expense={editingExpense}
        profiles={profiles}
        debtGroups={debtGroups}
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
