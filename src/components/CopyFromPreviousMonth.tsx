import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface CopyFromPreviousMonthProps {
  hasDataInCurrentMonth: boolean;
  hasPreviousMonthData: boolean;
  onCopy: () => void;
}

export function CopyFromPreviousMonth({
  hasDataInCurrentMonth,
  hasPreviousMonthData,
  onCopy,
}: CopyFromPreviousMonthProps) {
  if (hasDataInCurrentMonth || !hasPreviousMonthData) {
    return null;
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Copy className="h-4 w-4" />
          Copiar do Mês Anterior
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Copiar despesas e receitas?</AlertDialogTitle>
          <AlertDialogDescription>
            Este mês não tem dados. Deseja copiar todas as despesas recorrentes e receitas do mês anterior?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onCopy}>
            Copiar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
