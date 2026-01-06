import { Income, FamilyProfile, incomeTypeLabels } from '@/types/finance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, TrendingUp, RefreshCw, Pencil } from 'lucide-react';
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

interface IncomeListProps {
  incomes: Income[];
  profiles: FamilyProfile[];
  onDelete: (id: string) => void;
  onEdit: (income: Income) => void;
}

export function IncomeList({ incomes, profiles, onDelete, onEdit }: IncomeListProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getProfile = (profileId: string) => profiles.find((p) => p.id === profileId);

  const totalIncome = incomes.reduce((sum, inc) => sum + inc.amount, 0);

  if (incomes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-success" />
            Receitas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            Nenhuma receita cadastrada para este período.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between py-3 sm:py-4 px-4 sm:px-6">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-success" />
          Receitas
        </CardTitle>
        <span className="text-base sm:text-lg font-bold text-success">{formatCurrency(totalIncome)}</span>
      </CardHeader>
      <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
        <div className="space-y-2 sm:space-y-3">
          {incomes.map((income) => {
            const profile = getProfile(income.profileId);
            return (
              <div
                key={income.id}
                className="flex items-center justify-between p-2.5 sm:p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors gap-2"
              >
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  {profile && (
                    <div
                      className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full shrink-0"
                      style={{ backgroundColor: profile.color }}
                    />
                  )}
                  <div className="min-w-0">
                    <p className="font-medium text-sm sm:text-base truncate">{income.name}</p>
                    <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-muted-foreground">
                      <span className="truncate">{incomeTypeLabels[income.type]}</span>
                      {income.isRecurrent && (
                        <span className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                          <RefreshCw className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                          <span className="hidden xs:inline">Recorrente</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
                  <span className="font-semibold text-success text-sm sm:text-base">
                    {formatCurrency(income.amount)}
                  </span>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground hover:text-primary"
                    onClick={() => onEdit(income)}
                  >
                    <Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="max-w-[90vw] sm:max-w-lg">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir receita?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir a receita "{income.name}"?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDelete(income.id)}>
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
