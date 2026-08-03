import { cn } from '@/utils';
import { type VariantProps, cva } from 'class-variance-authority';

const badgeVariants = cva(
  'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-aura-primary/10 text-aura-primary border-aura-primary/20',
        success: 'bg-aura-success/10 text-aura-success border-aura-success/20',
        warning: 'bg-aura-warning/10 text-aura-warning border-aura-warning/20',
        danger: 'bg-aura-danger/10 text-aura-danger border-aura-danger/20',
        info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        muted: 'bg-white/5 text-aura-muted border-aura-border',
        outline: 'border-aura-border text-aura-muted bg-transparent',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
