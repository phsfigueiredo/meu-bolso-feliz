import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarClock, CalendarCheck, CalendarX, Calendar } from 'lucide-react';

export type DueDateFilter = 'all' | 'today' | 'upcoming' | 'overdue';

interface ExpenseDueDateFilterProps {
  filter: DueDateFilter;
  onFilterChange: (filter: DueDateFilter) => void;
  counts: {
    all: number;
    today: number;
    upcoming: number;
    overdue: number;
  };
}

export function ExpenseDueDateFilter({
  filter,
  onFilterChange,
  counts,
}: ExpenseDueDateFilterProps) {
  const filters: { key: DueDateFilter; label: string; icon: React.ElementType; variant: 'default' | 'destructive' | 'secondary' | 'outline' }[] = [
    { key: 'all', label: 'Todas', icon: Calendar, variant: 'outline' },
    { key: 'today', label: 'Vence Hoje', icon: CalendarClock, variant: 'secondary' },
    { key: 'upcoming', label: 'A Vencer', icon: CalendarCheck, variant: 'default' },
    { key: 'overdue', label: 'Vencidas', icon: CalendarX, variant: 'destructive' },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {filters.map(({ key, label, icon: Icon, variant }) => (
        <Button
          key={key}
          variant={filter === key ? variant : 'ghost'}
          size="sm"
          onClick={() => onFilterChange(key)}
          className={`gap-2 ${filter === key ? '' : 'opacity-70'}`}
        >
          <Icon className="h-4 w-4" />
          {label}
          <Badge 
            variant={filter === key ? 'outline' : 'secondary'}
            className="ml-1 h-5 px-1.5 text-xs"
          >
            {counts[key]}
          </Badge>
        </Button>
      ))}
    </div>
  );
}
