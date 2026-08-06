import { cn } from '@/utils';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
}

const sizeMap = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-full mx-4',
};

export function Modal({ open, onClose, title, description, children, size = 'md', className }: ModalProps) {
  // Lock body scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/75 backdrop-blur-md"
            onClick={onClose}
          />
          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              'relative w-full bg-[#12151b] border border-aura-border/80 rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)] z-10 max-h-[90vh] flex flex-col my-auto overflow-hidden',
              sizeMap[size],
              className,
            )}
          >
            {(title || description) && (
              <div className="flex items-start justify-between p-5 sm:p-6 border-b border-aura-border/70 bg-white/[0.02] shrink-0">
                <div>
                  {title && <h2 className="text-lg font-bold text-white tracking-tight">{title}</h2>}
                  {description && <p className="mt-1 text-xs sm:text-sm text-aura-muted">{description}</p>}
                </div>
                <button
                  onClick={onClose}
                  className="text-aura-muted hover:text-white transition-colors ml-4 mt-0.5 p-1.5 rounded-lg hover:bg-white/10"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            )}
            <div className={cn('overflow-y-auto flex-1 bg-[#12151b]', !title && !description && 'relative')}>
              {!title && !description && (
                <button
                  onClick={onClose}
                  className="absolute right-4 top-4 z-10 text-aura-muted hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'default';
  loading?: boolean;
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  loading,
}: ConfirmModalProps) {
  const btnClass =
    variant === 'danger'
      ? 'bg-aura-danger text-white hover:bg-aura-danger/90'
      : variant === 'warning'
      ? 'bg-aura-warning text-white hover:bg-aura-warning/90'
      : 'bg-aura-primary text-aura-bg hover:bg-aura-primary/90';

  return (
    <Modal open={open} onClose={onClose} size="sm">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-aura-text mb-2">{title}</h2>
        <p className="text-sm text-aura-muted mb-6">{description}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-aura-muted border border-aura-border rounded-md hover:text-aura-text hover:border-aura-primary/50 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-md transition-colors active:scale-95 disabled:opacity-50',
              btnClass,
            )}
          >
            {loading ? 'Loading...' : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
