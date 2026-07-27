import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
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

interface ReplicatePreviousMonthProps {
  hasPreviousMonthData: boolean;
  onReplicate: () => void;
}

export function ReplicatePreviousMonth({
  hasPreviousMonthData,
  onReplicate,
}: ReplicatePreviousMonthProps) {
  if (!hasPreviousMonthData) return null;

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Replicar mês anterior
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Replicar todas as despesas do mês anterior?</AlertDialogTitle>
          <AlertDialogDescription>
            Isso vai adicionar <strong>todas</strong> as despesas do mês anterior neste mês:
            <ul className="mt-2 ml-4 list-disc space-y-1 text-sm">
              <li>Tudo marcado como <strong>NÃO PAGO</strong></li>
              <li>Parcelamentos com o número da parcela <strong>+1</strong></li>
              <li>Parcelamentos já quitados são ignorados</li>
            </ul>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onReplicate}>Replicar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
