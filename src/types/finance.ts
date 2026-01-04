export type ExpenseType = 
  | 'cartao_credito' 
  | 'emprestimo' 
  | 'conta_fixa' 
  | 'aluguel' 
  | 'escola' 
  | 'outros';

export type PaymentType = 'recorrente' | 'parcelado';

export type PaymentStatus = 'pago' | 'nao_pago';

export interface Expense {
  id: string;
  name: string;
  type: ExpenseType;
  amount: number;
  dueDay: 10 | 15 | 30;
  paymentType: PaymentType;
  currentInstallment?: number;
  totalInstallments?: number;
  endDate?: string;
  status: PaymentStatus;
  totalPaid: number;
  totalRemaining: number;
  createdAt: string;
}

export interface UserProfile {
  salary: number;
  benefits: number;
  name: string;
}

export interface MonthlyData {
  month: string;
  year: number;
  totalExpenses: number;
  totalPaid: number;
  totalPending: number;
}

export const expenseTypeLabels: Record<ExpenseType, string> = {
  cartao_credito: 'Cartão de Crédito',
  emprestimo: 'Empréstimo',
  conta_fixa: 'Conta Fixa',
  aluguel: 'Aluguel',
  escola: 'Escola',
  outros: 'Outros',
};

export const expenseTypeColors: Record<ExpenseType, string> = {
  cartao_credito: 'hsl(var(--chart-1))',
  emprestimo: 'hsl(var(--chart-4))',
  conta_fixa: 'hsl(var(--chart-2))',
  aluguel: 'hsl(var(--chart-3))',
  escola: 'hsl(var(--chart-5))',
  outros: 'hsl(var(--muted-foreground))',
};
