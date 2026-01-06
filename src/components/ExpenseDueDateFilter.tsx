import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarClock, CalendarCheck, CalendarX, Calendar, CalendarDays } from 'lucide-react';

export type DueDateFilter = 'all' | 'today' | 'thisWeek' | 'upcoming' | 'overdue';

interface ExpenseDueDateFilterProps {
  filter: DueDateFilter;
  onFilterChange: (filter: DueDateFilter) => void;
  counts: {
    all: number;
    today: number;
    thisWeek: number;
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
    { key: 'today', label: 'Hoje', icon: CalendarClock, variant: 'secondary' },
    { key: 'thisWeek', label: 'Esta Semana', icon: CalendarDays, variant: 'default' },
    { key: 'upcoming', label: 'A Vencer', icon: CalendarCheck, variant: 'default' },
    { key: 'overdue', label: 'Vencidas', icon: CalendarX, variant: 'destructive' },
  ];

  return (
    <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
      <div className="flex gap-1.5 sm:gap-2 min-w-max sm:flex-wrap">
        {filters.map(({ key, label, icon: Icon, variant }) => (
          <Button
            key={key}
            variant={filter === key ? variant : 'ghost'}
            size="sm"
            onClick={() => onFilterChange(key)}
            className={`gap-1 sm:gap-2 h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm ${filter === key ? '' : 'opacity-70'}`}
          >
            <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">{label}</span>
            <span className="xs:hidden">{label.substring(0, 3)}</span>
            <Badge 
              variant={filter === key ? 'outline' : 'secondary'}
              className="ml-0.5 sm:ml-1 h-4 sm:h-5 px-1 sm:px-1.5 text-[10px] sm:text-xs"
            >
              {counts[key]}
            </Badge>
          </Button>
        ))}
      </div>
    </div>
  );
}
