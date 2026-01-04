import { Expense, FamilyProfile } from '@/types/finance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarCheck, PartyPopper } from 'lucide-react';
import { format, parseISO, differenceInMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DebtEndingsCardProps {
  debts: Expense[];
  profiles: FamilyProfile[];
}

export function DebtEndingsCard({ debts, profiles }: DebtEndingsCardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getProfile = (profileId: string) => profiles.find((p) => p.id === profileId);

  const getMonthsRemaining = (endDate: string) => {
    const end = parseISO(endDate);
    const now = new Date();
    return Math.max(0, differenceInMonths(end, now));
  };

  if (debts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarCheck className="h-5 w-5 text-success" />
            Fim das Dívidas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <PartyPopper className="h-12 w-12 text-success mb-3" />
            <p className="font-semibold text-success">Parabéns!</p>
            <p className="text-sm text-muted-foreground">
              Você não tem dívidas parceladas em andamento.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <CalendarCheck className="h-5 w-5 text-primary" />
          Próximas Dívidas a Acabar
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {debts.map((debt) => {
            const profile = getProfile(debt.profileId);
            const monthsRemaining = debt.endDate ? getMonthsRemaining(debt.endDate) : 0;
            const endDateFormatted = debt.endDate 
              ? format(parseISO(debt.endDate), "MMMM 'de' yyyy", { locale: ptBR })
              : 'N/A';

            return (
              <div
                key={debt.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
              >
                <div className="flex items-center gap-3">
                  {profile && (
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: profile.color }}
                    />
                  )}
                  <div>
                    <p className="font-medium">{debt.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {debt.currentInstallment}/{debt.totalInstallments} parcelas • 
                      Termina em {endDateFormatted}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-semibold">{formatCurrency(debt.amount)}/mês</p>
                  <p className="text-xs text-muted-foreground">
                    {monthsRemaining} {monthsRemaining === 1 ? 'mês restante' : 'meses restantes'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
