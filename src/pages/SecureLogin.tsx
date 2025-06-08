
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SecureAuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield } from 'lucide-react';
import SignInForm from '@/components/Auth/SignInForm';
import SignUpForm from '@/components/Auth/SignUpForm';
import AuthLoadingSpinner from '@/components/Auth/AuthLoadingSpinner';

const SecureLogin = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  if (authLoading) {
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
            Secure access to your workflow management system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={isSignUp ? 'signup' : 'signin'} onValueChange={(value) => setIsSignUp(value === 'signup')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <SignInForm isLoading={isLoading} setIsLoading={setIsLoading} />
            </TabsContent>
            
            <TabsContent value="signup">
              <SignUpForm isLoading={isLoading} setIsLoading={setIsLoading} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecureLogin;
