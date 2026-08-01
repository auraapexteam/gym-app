import { cn, formatCurrency, getGrowthColor, getGrowthSign } from '@/utils';
import { type LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: LucideIcon;
  iconColor?: string;
  prefix?: string;
  suffix?: string;
  isCurrency?: boolean;
  loading?: boolean;
  className?: string;
  index?: number;
}

export function StatCard({
  title,
  value,
  change,
  changeLabel = 'vs last month',
  icon: Icon,
  iconColor = 'text-aura-primary',
  prefix,
  suffix,
  isCurrency,
  className,
  index = 0,
}: StatCardProps) {
  const displayValue = isCurrency && typeof value === 'number' ? formatCurrency(value) : value;
  const isPositive = change !== undefined && change >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className={cn(
        'bg-aura-card border border-aura-border rounded-lg p-6 shadow-aura-md',
        'hover:border-aura-primary/30 hover:-translate-y-0.5 hover:shadow-aura-lg',
        'transition-all duration-300',
        className,
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-aura-muted">{title}</p>
        <div className={cn('h-9 w-9 rounded-md bg-aura-bg flex items-center justify-center border border-aura-border', iconColor)}>
          <Icon className="h-4 w-4" />
        </div>
      </div>

      <div className="mb-2">
        <p className="text-2xl font-bold text-aura-text">
          {prefix && <span className="text-aura-muted text-lg">{prefix}</span>}
          {displayValue}
          {suffix && <span className="text-aura-muted text-lg ml-1">{suffix}</span>}
        </p>
      </div>

      {change !== undefined && (
        <div className="flex items-center gap-1.5">
          {isPositive ? (
            <TrendingUp className="h-3.5 w-3.5 text-aura-success" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5 text-aura-danger" />
          )}
          <span className={cn('text-xs font-medium', getGrowthColor(change))}>
            {getGrowthSign(change)}{Math.abs(change)}%
          </span>
          <span className="text-xs text-aura-muted">{changeLabel}</span>
        </div>
      )}
    </motion.div>
  );
}
