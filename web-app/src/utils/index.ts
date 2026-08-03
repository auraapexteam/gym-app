import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, isAfter, isBefore, addDays } from 'date-fns';

// ============================================================
// TAILWIND UTILITY
// ============================================================
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================================
// DATE UTILITIES
// ============================================================
export const safeNewDate = (date: string | Date | undefined | null): Date => {
  if (!date) return new Date();
  if (date instanceof Date) return date;
  
  let dateStr = String(date).trim();
  if (dateStr.includes(' ')) {
    dateStr = dateStr.replace(' ', 'T');
  }
  
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) {
    return new Date();
  }
  return d;
};

export const formatDate = (date: string | Date, fmt = 'MMM dd, yyyy') => {
  return format(safeNewDate(date), fmt);
};

export const formatDateTime = (date: string | Date) => {
  return format(safeNewDate(date), 'MMM dd, yyyy HH:mm');
};

export const formatRelativeTime = (date: string | Date) => {
  return formatDistanceToNow(safeNewDate(date), { addSuffix: true });
};

export const isExpiringSoon = (date: string | Date, days = 7) => {
  const expiry = safeNewDate(date);
  const soon = addDays(safeNewDate(new Date()), days);
  return isAfter(soon, expiry) && isAfter(expiry, safeNewDate(new Date()));
};

export const isExpired = (date: string | Date) => {
  return isBefore(safeNewDate(date), safeNewDate(new Date()));
};

// ============================================================
// CURRENCY UTILITIES
// ============================================================
export const formatCurrency = (amount: number, currency = 'INR') => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatNumber = (num: number) => {
  return new Intl.NumberFormat('en-IN').format(num);
};

// ============================================================
// STRING UTILITIES
// ============================================================
export const truncate = (str: string, length = 40) => {
  if (str.length <= length) return str;
  return `${str.slice(0, length)}...`;
};

export const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const capitalize = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const slugify = (str: string) => {
  return str.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
};

// ============================================================
// VALIDATION UTILITIES
// ============================================================
export const isValidEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const isValidPhone = (phone: string) => {
  return /^[6-9]\d{9}$/.test(phone.replace(/\D/g, ''));
};

// ============================================================
// STORAGE UTILITIES
// ============================================================
export const storage = {
  get: (key: string) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },
  set: (key: string, value: unknown) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // silently fail
    }
  },
  remove: (key: string) => {
    localStorage.removeItem(key);
  },
  clear: () => {
    localStorage.clear();
  },
};

// ============================================================
// DOWNLOAD UTILITIES
// ============================================================
export const downloadCSV = (data: Record<string, unknown>[], filename: string) => {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const rows = data.map((row) => headers.map((h) => String(row[h] ?? '')).join(','));
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

// ============================================================
// PERCENTAGE UTILITY
// ============================================================
export const calcPercentage = (value: number, total: number): number => {
  if (!total) return 0;
  return Math.round((value / total) * 100);
};

// ============================================================
// COLOR UTILITIES
// ============================================================
export const getGrowthColor = (value: number) => {
  if (value > 0) return 'text-aura-success';
  if (value < 0) return 'text-aura-danger';
  return 'text-aura-muted';
};

export const getGrowthSign = (value: number) => {
  if (value > 0) return '+';
  return '';
};
