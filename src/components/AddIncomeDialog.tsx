import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Plus } from 'lucide-react';
import { Income, IncomeType, FamilyProfile, incomeTypeLabels } from '@/types/finance';

interface AddIncomeDialogProps {
  profiles: FamilyProfile[];
  selectedMonth: number;
  selectedYear: number;
  onAdd: (income: Omit<Income, 'id' | 'createdAt'>) => void;
}

export function AddIncomeDialog({ 
  profiles, 
  selectedMonth, 
  selectedYear, 
  onAdd 
}: AddIncomeDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<IncomeType>('salario');
  const [amount, setAmount] = useState('');
  const [isRecurrent, setIsRecurrent] = useState(true);
  const [profileId, setProfileId] = useState(profiles[0]?.id || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const parsedAmount = parseFloat(amount.replace(',', '.'));
    if (!name || isNaN(parsedAmount) || !profileId) return;

    onAdd({
      name,
      type,
      amount: parsedAmount,
      isRecurrent,
      profileId,
      month: selectedMonth,
      year: selectedYear,
    });

    setOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setName('');
    setType('salario');
    setAmount('');
    setIsRecurrent(true);
    setProfileId(profiles[0]?.id || '');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Receita
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Nova Receita</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="income-name">Nome</Label>
            <Input
              id="income-name"
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
              <Label htmlFor="income-amount">Valor (R$)</Label>
              <Input
                id="income-amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0,00"
              />
            </div>
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

          <div className="flex items-center justify-between">
            <Label htmlFor="recurrent">Receita recorrente</Label>
            <Switch
              id="recurrent"
              checked={isRecurrent}
              onCheckedChange={setIsRecurrent}
            />
          </div>

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
