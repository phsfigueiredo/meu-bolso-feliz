import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { Expense, ExpenseType, PaymentType, PaymentMethod, FamilyProfile, expenseTypeLabels, paymentMethodLabels } from '@/types/finance';

interface AddExpenseDialogProps {
  profiles: FamilyProfile[];
  selectedMonth: number;
  selectedYear: number;
  onAdd: (expense: Omit<Expense, 'id' | 'createdAt'>) => void;
}

export function AddExpenseDialog({ profiles, selectedMonth, selectedYear, onAdd }: AddExpenseDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<ExpenseType>('outros');
  const [amount, setAmount] = useState('');
  const [dueDay, setDueDay] = useState<'10' | '15' | '30'>('10');
  const [paymentType, setPaymentType] = useState<PaymentType>('recorrente');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [totalInstallments, setTotalInstallments] = useState('');
  const [profileId, setProfileId] = useState(profiles[0]?.id || '');
  const [endDate, setEndDate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const parsedAmount = parseFloat(amount.replace(',', '.'));

    if (!name || isNaN(parsedAmount) || !profileId) return;

    const expense: Omit<Expense, 'id' | 'createdAt'> = {
      name,
      type,
      amount: parsedAmount,
      dueDay: parseInt(dueDay) as 10 | 15 | 30,
      paymentType,
      paymentMethod,
      status: 'nao_pago',
      totalPaid: 0,
      totalRemaining: parsedAmount,
      profileId,
      month: selectedMonth,
      year: selectedYear,
      ...(paymentType === 'parcelado' && {
        currentInstallment: 1,
        totalInstallments: parseInt(totalInstallments) || 12,
        endDate: endDate || undefined,
      }),
    };

    onAdd(expense);
    setOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setName('');
    setType('outros');
    setAmount('');
    setDueDay('10');
    setPaymentType('recorrente');
    setPaymentMethod('pix');
    setTotalInstallments('');
    setProfileId(profiles[0]?.id || '');
    setEndDate('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Despesa
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Nova Despesa</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Despesa</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Nubank, Aluguel..."
            />
          </div>

          <div className="space-y-2">
            <Label>Perfil</Label>
            <Select value={profileId} onValueChange={setProfileId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um perfil" />
              </SelectTrigger>
              <SelectContent>
                {profiles.map((profile) => (
                  <SelectItem key={profile.id} value={profile.id}>
                    {profile.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={type} onValueChange={(v) => setType(v as ExpenseType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(expenseTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Valor (R$)</Label>
              <Input
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0,00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Dia de Vencimento</Label>
              <Select value={dueDay} onValueChange={(v) => setDueDay(v as '10' | '15' | '30')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">Dia 10</SelectItem>
                  <SelectItem value="15">Dia 15</SelectItem>
                  <SelectItem value="30">Dia 30</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Forma de Pagamento</Label>
              <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(paymentMethodLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tipo de Pagamento</Label>
            <Select value={paymentType} onValueChange={(v) => setPaymentType(v as PaymentType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recorrente">Recorrente</SelectItem>
                <SelectItem value="parcelado">Parcelado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {paymentType === 'parcelado' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="installments">Total de Parcelas</Label>
                <Input
                  id="installments"
                  type="number"
                  value={totalInstallments}
                  onChange={(e) => setTotalInstallments(e.target.value)}
                  placeholder="Ex: 12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Data Final (opcional)</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">Adicionar</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
