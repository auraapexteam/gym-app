import { cn, getInitials } from '@/utils';

interface AvatarProps {
  src?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  status?: 'online' | 'offline' | 'away';
}

const sizeMap = {
  xs: 'h-6 w-6 text-xs',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
};

const statusColors = {
  online: 'bg-aura-success',
  offline: 'bg-aura-muted',
  away: 'bg-aura-warning',
};

export function Avatar({ src, name, size = 'md', className, status }: AvatarProps) {
  return (
    <div className={cn('relative inline-flex items-center justify-center shrink-0 rounded-full', sizeMap[size], className)}>
      {src ? (
        <img
          src={src}
          alt={name}
          className="h-full w-full rounded-full object-cover"
        />
      ) : (
        <div
          className="h-full w-full rounded-full bg-aura-primary/10 text-aura-primary font-bold flex items-center justify-center border border-aura-primary/20"
        >
          {name ? getInitials(name) : '?'}
        </div>
      )}
      {status && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full border-2 border-aura-bg',
            statusColors[status],
            size === 'xs' || size === 'sm' ? 'h-2 w-2' : 'h-2.5 w-2.5',
          )}
        />
      )}
    </div>
  );
}
