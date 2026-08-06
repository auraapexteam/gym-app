import { cn } from '@/utils';
import { ChevronDown } from 'lucide-react';
import { forwardRef } from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  placeholder?: string;
  options: { value: string; label: string }[];
  containerClassName?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, containerClassName, label, error, placeholder, options, id, ...props }, ref) => {
    return (
      <div className={cn('w-full', containerClassName)}>
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-aura-text mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={id}
            className={cn(
              'w-full bg-aura-bg border border-aura-border rounded-md px-3 py-2 text-sm text-aura-text appearance-none',
              'focus:outline-none focus:border-aura-primary focus:ring-1 focus:ring-aura-primary/30',
              'transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed',
              error && 'border-aura-danger',
              className,
            )}
            {...props}
          >
            {placeholder && (
              <option value="" className="bg-aura-card">
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-aura-card">
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-aura-muted pointer-events-none" />
        </div>
        {error && <p className="mt-1 text-xs text-aura-danger">{error}</p>}
      </div>
    );
  },
);

Select.displayName = 'Select';
