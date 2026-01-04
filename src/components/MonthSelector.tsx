import { months } from '@/types/finance';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MonthSelectorProps {
  selectedMonth: number;
  selectedYear: number;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
}

export function MonthSelector({ 
  selectedMonth, 
  selectedYear, 
  onMonthChange, 
  onYearChange 
}: MonthSelectorProps) {
  const handlePrevYear = () => onYearChange(selectedYear - 1);
  const handleNextYear = () => onYearChange(selectedYear + 1);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-center gap-4">
        <Button variant="ghost" size="icon" onClick={handlePrevYear}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-lg font-semibold min-w-[80px] text-center">{selectedYear}</span>
        <Button variant="ghost" size="icon" onClick={handleNextYear}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-1">
        {months.map((month) => (
          <button
            key={month.value}
            onClick={() => onMonthChange(month.value)}
            className={cn(
              'px-2 py-2 text-sm rounded-lg transition-all font-medium',
              selectedMonth === month.value
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground'
            )}
          >
            {month.label.substring(0, 3)}
          </button>
        ))}
      </div>
    </div>
  );
}
