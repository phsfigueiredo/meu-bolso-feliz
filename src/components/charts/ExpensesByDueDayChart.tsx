import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { useIsMobile } from '@/hooks/use-mobile';

interface ExpensesByDueDayChartProps {
  data: Record<15 | 20 | 30, number>;
}

export function ExpensesByDueDayChart({ data }: ExpensesByDueDayChartProps) {
  const isMobile = useIsMobile();
  
  // Ordem: 30, 15, 20 (1º, 2º, 3º pagamento do mês)
  const chartData = [
    { name: '1º Pag. (Dia 30)', value: data[30], fill: 'hsl(var(--chart-1))' },
    { name: '2º Pag. (Dia 10)', value: data[10], fill: 'hsl(var(--chart-2))' },
    { name: '3º Pag. (Dia 15)', value: data[15], fill: 'hsl(var(--chart-3))' },
  ];

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatPercent = (value: number) => {
    if (total === 0) return '0%';
    return `${((value / total) * 100).toFixed(1)}%`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border bg-card px-3 py-2 shadow-lg">
          <p className="font-medium">{label}</p>
          <p className="text-sm text-primary">{formatCurrency(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  // Mobile: Cards com barras de progresso
  if (isMobile) {
    const maxValue = Math.max(...chartData.map(d => d.value), 1);
    
    return (
      <div className="space-y-3">
        {chartData.map((item, index) => (
          <div key={index} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{item.name}</span>
              <div className="text-right">
                <span className="text-sm font-semibold">{formatCurrency(item.value)}</span>
                <span className="text-xs text-muted-foreground ml-2">({formatPercent(item.value)})</span>
              </div>
            </div>
            <div className="h-2.5 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-500"
                style={{ 
                  width: `${(item.value / maxValue) * 100}%`,
                  backgroundColor: item.fill
                }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Desktop: Gráfico de barras
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis
            dataKey="name"
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
            axisLine={{ stroke: 'hsl(var(--border))' }}
          />
          <YAxis
            tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
            axisLine={{ stroke: 'hsl(var(--border))' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="value" radius={[8, 8, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
