import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Folder } from 'lucide-react';
import { Expense, ExpenseType, PaymentType, PaymentMethod, FamilyProfile, expenseTypeLabels, paymentMethodLabels, dueDayOrder, dueDayLabels } from '@/types/finance';

interface EditExpenseDialogProps {
  expense: Expense | null;
  profiles: FamilyProfile[];
  debtGroups?: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (expense: Expense) => void;
}

export function EditExpenseDialog({ expense, profiles, debtGroups = [], open, onOpenChange, onSave }: EditExpenseDialogProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<ExpenseType>('outros');
  const [amount, setAmount] = useState('');
  const [dueDay, setDueDay] = useState<'15' | '20' | '30'>('30');
  const [paymentType, setPaymentType] = useState<PaymentType>('recorrente');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [totalInstallments, setTotalInstallments] = useState('');
  const [currentInstallment, setCurrentInstallment] = useState('');
  const [profileId, setProfileId] = useState('');
  const [endDate, setEndDate] = useState('');
  const [groupName, setGroupName] = useState('');

  useEffect(() => {
    if (expense) {
      setName(expense.name);
      setType(expense.type);
      setAmount(expense.amount.toString());
      setDueDay(expense.dueDay.toString() as '15' | '20' | '30');
      setPaymentType(expense.paymentType);
      setPaymentMethod(expense.paymentMethod || 'pix');
      setTotalInstallments(expense.totalInstallments?.toString() || '');
      setCurrentInstallment(expense.currentInstallment?.toString() || '');
      setProfileId(expense.profileId);
      setEndDate(expense.endDate || '');
      setGroupName(expense.groupName || '');
    }
  }, [expense]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!expense) return;

    const parsedAmount = parseFloat(amount.replace(',', '.'));
    if (!name || isNaN(parsedAmount) || !profileId) return;

    const updatedExpense: Expense = {
      ...expense,
      name,
      type,
      amount: parsedAmount,
      dueDay: parseInt(dueDay) as 15 | 20 | 30,
      paymentType,
      paymentMethod,
      profileId,
      groupName: groupName || undefined,
      ...(paymentType === 'parcelado' && {
        currentInstallment: parseInt(currentInstallment) || 1,
        totalInstallments: parseInt(totalInstallments) || 12,
        endDate: endDate || undefined,
      }),
    };

    onSave(updatedExpense);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Despesa</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Nome da Despesa</Label>
            <Input
              id="edit-name"
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
              <Label htmlFor="edit-amount">Valor (R$)</Label>
              <Input
                id="edit-amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0,00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Dia de Vencimento</Label>
              <Select value={dueDay} onValueChange={(v) => setDueDay(v as '15' | '20' | '30')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {dueDayOrder.map((day) => (
                    <SelectItem key={day} value={day.toString()}>
                      {dueDayLabels[day]}
                    </SelectItem>
                  ))}
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
            <Label className="flex items-center gap-2">
              <Folder className="h-4 w-4" />
              Grupo de Dívida (opcional)
            </Label>
            <Select value={groupName || "__none__"} onValueChange={(v) => setGroupName(v === "__none__" ? "" : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione ou deixe vazio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Sem grupo</SelectItem>
                {debtGroups.map((group) => (
                  <SelectItem key={group} value={group}>
                    {group}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-current-installment">Parcela Atual</Label>
                  <Input
                    id="edit-current-installment"
                    type="number"
                    value={currentInstallment}
                    onChange={(e) => setCurrentInstallment(e.target.value)}
                    placeholder="Ex: 22"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-installments">Total de Parcelas</Label>
                  <Input
                    id="edit-installments"
                    type="number"
                    value={totalInstallments}
                    onChange={(e) => setTotalInstallments(e.target.value)}
                    placeholder="Ex: 24"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-endDate">Data Final (opcional)</Label>
                <Input
                  id="edit-endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Salvar</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
