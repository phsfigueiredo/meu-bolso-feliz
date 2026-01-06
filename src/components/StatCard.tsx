import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'destructive';
  className?: string;
}

const variantStyles = {
  default: 'bg-card',
  primary: 'gradient-primary text-primary-foreground',
  success: 'gradient-success text-success-foreground',
  warning: 'gradient-warning text-warning-foreground',
  destructive: 'gradient-destructive text-destructive-foreground',
};

const iconStyles = {
  default: 'bg-primary/10 text-primary',
  primary: 'bg-primary-foreground/20 text-primary-foreground',
  success: 'bg-success-foreground/20 text-success-foreground',
  warning: 'bg-warning-foreground/20 text-warning-foreground',
  destructive: 'bg-destructive-foreground/20 text-destructive-foreground',
};

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'default',
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        'stat-card animate-fade-in',
        variantStyles[variant],
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1 sm:space-y-2 min-w-0">
          <p
            className={cn(
              'text-xs sm:text-sm font-medium truncate',
              variant === 'default' ? 'text-muted-foreground' : 'opacity-90'
            )}
          >
            {title}
          </p>
          <p className="text-lg sm:text-2xl font-bold tracking-tight truncate">{value}</p>
          {subtitle && (
            <p
              className={cn(
                'text-[10px] sm:text-xs truncate',
                variant === 'default' ? 'text-muted-foreground' : 'opacity-75'
              )}
            >
              {subtitle}
            </p>
          )}
        </div>
        <div className={cn('rounded-lg sm:rounded-xl p-2 sm:p-3 shrink-0', iconStyles[variant])}>
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
      </div>
    </div>
  );
}
