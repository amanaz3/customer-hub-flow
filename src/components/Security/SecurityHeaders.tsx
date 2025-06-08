
import { useEffect } from 'react';

const SecurityHeaders = () => {
  useEffect(() => {
    // Add security headers via meta tags where possible
    const addMetaTag = (name: string, content: string) => {
      const existingTag = document.querySelector(`meta[name="${name}"]`);
      if (!existingTag) {
        const meta = document.createElement('meta');
        meta.name = name;
        meta.content = content;
        document.head.appendChild(meta);
      }
    };

    // Add Content Security Policy
    addMetaTag('Content-Security-Policy', 
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
      "font-src 'self' https://fonts.gstatic.com; " +
      "img-src 'self' data: https:; " +
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co;"
    );

    // Add X-Frame-Options
    addMetaTag('X-Frame-Options', 'DENY');

    // Add X-Content-Type-Options
    addMetaTag('X-Content-Type-Options', 'nosniff');

    // Add Referrer Policy
    addMetaTag('referrer', 'strict-origin-when-cross-origin');
  }, []);

  return null;
};

export default SecurityHeaders;
