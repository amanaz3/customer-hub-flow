
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(dateObj);
}

export function truncateCustomerName(name: string, maxLength: number = 15): string {
  if (!name) return '';
  
  // If name is already short enough, return as is
  if (name.length <= maxLength) return name;
  
  // Split by spaces to get words
  const words = name.trim().split(/\s+/);
  
  // If multiple words, try first + last word
  if (words.length > 1) {
    const firstWord = words[0];
    const lastWord = words[words.length - 1];
    const combined = `${firstWord} ${lastWord}`;
    
    // If combined is still too long, truncate to maxLength
    if (combined.length > maxLength) {
      return combined.substring(0, maxLength) + '...';
    }
    
    return combined;
  }
  
  // Single word or combined still too long - truncate to maxLength
  return name.substring(0, maxLength) + '...';
}
