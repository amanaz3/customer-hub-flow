
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/SecureAuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield } from 'lucide-react';
import SignInForm from '@/components/Auth/SignInForm';
import AuthLoadingSpinner from '@/components/Auth/AuthLoadingSpinner';

const SecureLogin = () => {
  const [isLoading, setIsLoading] = useState(false);
  
  const { isAuthenticated, isLoading: authLoading, session } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get the redirect path from location state, default to dashboard
  const from = location.state?.from?.pathname || '/dashboard';

  useEffect(() => {
    console.log('SecureLogin useEffect:', { isAuthenticated, authLoading, hasSession: !!session });
    
    if (!authLoading && isAuthenticated && session) {
      console.log('User is authenticated, redirecting to:', from);
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate, from, session]);

  if (authLoading) {
    return <AuthLoadingSpinner />;
  }

  // Don't render login form if user is already authenticated
  if (isAuthenticated && session) {
    return <AuthLoadingSpinner />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card className="w-[400px]">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-blue-600 mr-2" />
            <CardTitle className="text-2xl font-bold">Amana Corporate</CardTitle>
          </div>
          <CardDescription className="text-center">
            Sign in to access your workflow management system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignInForm isLoading={isLoading} setIsLoading={setIsLoading} />
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account? Contact your administrator.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecureLogin;
