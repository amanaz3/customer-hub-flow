import { useEffect } from 'react';

interface NavigationBlockerProps {
  when: boolean;
  message?: string;
}

export const NavigationBlocker = ({ 
  when, 
  message = "You have unsaved changes. Are you sure you want to leave this page?" 
}: NavigationBlockerProps) => {
  // Handle browser back/forward, refresh, and close
  useEffect(() => {
    if (!when) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = message;
      return message;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [when, message]);

  // Handle internal navigation attempts (clicking sidebar links)
  useEffect(() => {
    if (!when) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a[href]');
      
      if (link && link instanceof HTMLAnchorElement) {
        const href = link.getAttribute('href');
        
        // Check if it's an internal navigation link
        if (href && href.startsWith('/') && !href.startsWith('//')) {
          const confirmed = window.confirm(message);
          if (!confirmed) {
            e.preventDefault();
            e.stopPropagation();
          }
        }
      }
    };

    // Capture phase to intercept before React Router
    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [when, message]);

  return null;
};
