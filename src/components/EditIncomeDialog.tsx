import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Income, IncomeType, FamilyProfile, incomeTypeLabels } from '@/types/finance';

interface EditIncomeDialogProps {
  income: Income | null;
  profiles: FamilyProfile[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (income: Income) => void;
}

export function EditIncomeDialog({ 
  income, 
  profiles, 
  open, 
  onOpenChange, 
  onSave 
}: EditIncomeDialogProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<IncomeType>('salario');
  const [amount, setAmount] = useState('');
  const [isRecurrent, setIsRecurrent] = useState(true);
  const [profileId, setProfileId] = useState('');

  useEffect(() => {
    if (income) {
      setName(income.name);
      setType(income.type);
      setAmount(income.amount.toString());
      setIsRecurrent(income.isRecurrent);
      setProfileId(income.profileId);
    }
  }, [income]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!income) return;

    const parsedAmount = parseFloat(amount.replace(',', '.'));
    if (!name || isNaN(parsedAmount) || !profileId) return;

    const updatedIncome: Income = {
      ...income,
      name,
      type,
      amount: parsedAmount,
      isRecurrent,
      profileId,
    };

    onSave(updatedIncome);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Receita</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-income-name">Nome</Label>
            <Input
              id="edit-income-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Salário, Freelance..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={type} onValueChange={(v) => setType(v as IncomeType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(incomeTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-income-amount">Valor (R$)</Label>
              <Input
                id="edit-income-amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0,00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Perfil</Label>
            <Select value={profileId || undefined} onValueChange={setProfileId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um perfil" />
              </SelectTrigger>
              <SelectContent>
                {profiles.filter(p => p.id).map((profile) => (
                  <SelectItem key={profile.id} value={profile.id}>
                    {profile.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="edit-recurrent">Receita recorrente</Label>
            <Switch
              id="edit-recurrent"
              checked={isRecurrent}
              onCheckedChange={setIsRecurrent}
            />
          </div>

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
