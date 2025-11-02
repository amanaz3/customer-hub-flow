import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface NavigationBlockerProps {
  when: boolean;
  message?: string;
}

export const NavigationBlocker = ({ 
  when, 
  message = "You have unsaved changes. Are you sure you want to leave this page?" 
}: NavigationBlockerProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = useRef(location.pathname);
  const isBlocking = useRef(false);

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

  // Handle browser back/forward button
  useEffect(() => {
    if (!when) {
      isBlocking.current = false;
      return;
    }

    isBlocking.current = true;
    currentPath.current = location.pathname;

    const handlePopState = (e: PopStateEvent) => {
      if (isBlocking.current) {
        const confirmed = window.confirm(message);
        if (!confirmed) {
          // User cancelled, push current path back to history
          window.history.pushState(null, '', currentPath.current);
        } else {
          isBlocking.current = false;
        }
      }
    };

    // Push a dummy state to enable popstate detection
    window.history.pushState(null, '', location.pathname);
    
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [when, message, location.pathname]);

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
