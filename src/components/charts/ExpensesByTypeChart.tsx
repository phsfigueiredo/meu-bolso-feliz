import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { ExpenseType, expenseTypeLabels, expenseTypeColors } from '@/types/finance';
import { useIsMobile } from '@/hooks/use-mobile';

interface ExpensesByTypeChartProps {
  data: Record<ExpenseType, number>;
}

export function ExpensesByTypeChart({ data }: ExpensesByTypeChartProps) {
  const isMobile = useIsMobile();
  
  const chartData = Object.entries(data)
    .filter(([_, value]) => value > 0)
    .map(([type, value]) => ({
      name: expenseTypeLabels[type as ExpenseType],
      value,
      color: expenseTypeColors[type as ExpenseType],
    }));

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

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border bg-card px-3 py-2 shadow-lg">
          <p className="font-medium">{payload[0].name}</p>
          <p className="text-sm text-primary">{formatCurrency(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  // Mobile: Lista simplificada com barras de progresso
  if (isMobile) {
    const maxValue = Math.max(...chartData.map(d => d.value), 1);
    
    return (
      <div className="space-y-3">
        {chartData.map((item, index) => (
          <div key={index} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm font-medium truncate">{item.name}</span>
              </div>
              <div className="text-right flex-shrink-0">
                <span className="text-sm font-semibold">{formatCurrency(item.value)}</span>
              </div>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-500"
                style={{ 
                  width: `${(item.value / maxValue) * 100}%`,
                  backgroundColor: item.color
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground text-right">{formatPercent(item.value)}</p>
          </div>
        ))}
        {chartData.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-4">
            Nenhuma despesa registrada
          </p>
        )}
      </div>
    );
  }

  // Desktop: Gráfico de pizza
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={4}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            layout="vertical"
            verticalAlign="middle"
            align="right"
            formatter={(value) => <span className="text-sm text-foreground">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
