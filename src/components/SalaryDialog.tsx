import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings } from 'lucide-react';
import { UserProfile } from '@/types/finance';

interface SalaryDialogProps {
  userProfile: UserProfile;
  onUpdate: (profile: Partial<UserProfile>) => void;
}

export function SalaryDialog({ userProfile, onUpdate }: SalaryDialogProps) {
  const [open, setOpen] = useState(false);
  const [salary, setSalary] = useState(userProfile.salary.toString());
  const [benefits, setBenefits] = useState(userProfile.benefits.toString());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const parsedSalary = parseFloat(salary.replace(',', '.'));
    const parsedBenefits = parseFloat(benefits.replace(',', '.'));

    if (!isNaN(parsedSalary) && !isNaN(parsedBenefits)) {
      onUpdate({
        salary: parsedSalary,
        benefits: parsedBenefits,
      });
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="h-9 w-9">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Configurar Renda</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="salary">Salário Mensal (R$)</Label>
            <Input
              id="salary"
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
              placeholder="0,00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="benefits">Benefícios (R$)</Label>
            <Input
              id="benefits"
              value={benefits}
              onChange={(e) => setBenefits(e.target.value)}
              placeholder="0,00"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">Salvar</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
