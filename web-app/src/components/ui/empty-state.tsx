import { cn } from '@/utils';
import { type LucideIcon, SearchX, PackageOpen, BarChart3 } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon = SearchX, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 text-center', className)}>
      <div className="h-16 w-16 rounded-2xl bg-aura-primary/10 flex items-center justify-center mb-4">
        <Icon className="h-8 w-8 text-aura-primary/60" />
      </div>
      <h3 className="text-base font-semibold text-aura-text mb-2">{title}</h3>
      {description && <p className="text-sm text-aura-muted max-w-sm mb-6">{description}</p>}
      {action && <div>{action}</div>}
    </div>
  );
}

export function NoDataState({ message = 'No data available' }: { message?: string }) {
  return (
    <EmptyState icon={BarChart3} title={message} description="Check back later for updates." />
  );
}

export function EmptyListState({ entity = 'items', onAdd }: { entity?: string; onAdd?: () => void }) {
  return (
    <EmptyState
      icon={PackageOpen}
      title={`No ${entity} found`}
      description={`There are no ${entity} yet. Add one to get started.`}
      action={
        onAdd && (
          <button
            onClick={onAdd}
            className="bg-aura-primary text-aura-bg font-medium px-4 py-2 rounded-md hover:bg-aura-primary/90 text-sm transition-colors"
          >
            Add {entity}
          </button>
        )
      }
    />
  );
}
