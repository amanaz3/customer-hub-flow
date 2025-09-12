import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const CorsCheckBanner: React.FC = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [currentOrigin, setCurrentOrigin] = useState('');

  useEffect(() => {
    const checkCorsAccess = async () => {
      try {
        setCurrentOrigin(window.location.origin);
        
        // Try a simple auth check to detect CORS issues
        const { error } = await supabase.auth.getSession();
        
        if (error && (error.name === 'TypeError' || error.message?.includes('fetch'))) {
          setShowBanner(true);
        }
      } catch (error: any) {
        // Network errors usually indicate CORS issues
        if (error.name === 'TypeError' || error.message?.includes('fetch') || error.message?.includes('network')) {
          setShowBanner(true);
        }
      }
    };

    checkCorsAccess();
  }, []);

  if (!showBanner) return null;

  return (
    <Alert className="border-orange-200 bg-orange-50 text-orange-800 mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <div>
          <strong>CORS Configuration Required:</strong> The origin <code>{currentOrigin}</code> needs to be whitelisted in your Supabase project settings.
          <div className="mt-2">
            Go to: <strong>Authentication → URL Configuration</strong> and add this origin to <strong>Site URL</strong> and <strong>Additional Redirect URLs</strong>.
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowBanner(false)}
          className="ml-4 hover:bg-orange-100"
        >
          <X className="h-4 w-4" />
        </Button>
      </AlertDescription>
    </Alert>
  );
};

export default CorsCheckBanner;