export type ExpenseType = 
  | 'cartao_credito' 
  | 'emprestimo' 
  | 'conta_fixa' 
  | 'aluguel' 
  | 'escola' 
  | 'outros';

export type PaymentType = 'recorrente' | 'parcelado';

export type PaymentStatus = 'pago' | 'nao_pago';

export type PaymentMethod = 'pix' | 'boleto' | 'debito_automatico' | 'cartao' | 'dinheiro' | 'transferencia';

export interface Expense {
  id: string;
  name: string;
  type: ExpenseType;
  amount: number;
  dueDay: 15 | 20 | 30;
  paymentType: PaymentType;
  paymentMethod?: PaymentMethod;
  currentInstallment?: number;
  totalInstallments?: number;
  endDate?: string;
  status: PaymentStatus;
  totalPaid: number;
  totalRemaining: number;
  createdAt: string;
  profileId: string;
  month: number;
  year: number;
  groupName?: string;
  category?: string; // categoria/tag customizada (nome, ver expenseCategories)
}

export interface ExpenseCategory {
  name: string;
  color: string;
  icon?: string;
}

// Ordem dos dias de pagamento (primeiro pagamento do mês é dia 30)
export const dueDayOrder: (15 | 20 | 30)[] = [30, 15, 20];

export const dueDayLabels: Record<15 | 20 | 30, string> = {
  30: '1º Pagamento (Dia 30)',
  15: '2º Pagamento (Dia 15)',
  20: '3º Pagamento (Dia 20)',
};

export type IncomeType = 'salario' | 'beneficio' | 'freelance' | 'investimento' | 'outros';

export interface Income {
  id: string;
  name: string;
  type: IncomeType;
  amount: number;
  isRecurrent: boolean;
  profileId: string;
  month: number;
  year: number;
  createdAt: string;
}

export interface FamilyProfile {
  id: string;
  name: string;
  type: 'titular' | 'conjuge' | 'filho' | 'outro';
  avatar?: string;
  color: string;
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

export interface FinancialHealth {
  score: number; // 0-100
  status: 'excelente' | 'bom' | 'regular' | 'ruim' | 'critico';
  savingsRate: number;
  debtToIncomeRatio: number;
  emergencyFundMonths: number;
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

export const incomeTypeLabels: Record<IncomeType, string> = {
  salario: 'Salário',
  beneficio: 'Benefício',
  freelance: 'Freelance',
  investimento: 'Investimento',
  outros: 'Outros',
};

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  pix: 'PIX',
  boleto: 'Boleto',
  debito_automatico: 'Débito Automático',
  cartao: 'Cartão',
  dinheiro: 'Dinheiro',
  transferencia: 'Transferência',
};

export const profileTypeLabels: Record<FamilyProfile['type'], string> = {
  titular: 'Titular',
  conjuge: 'Cônjuge',
  filho: 'Filho(a)',
  outro: 'Outro',
};

export const profileColors = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export const months = [
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Março' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' },
  { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' },
  { value: 12, label: 'Dezembro' },
];
