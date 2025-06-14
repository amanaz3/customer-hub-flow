
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/SecureAuthContext";
import { CustomerProvider } from "./contexts/CustomerContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import ProtectedRoute from "./components/Security/ProtectedRoute";
import React from "react";

// Pages
import SecureLogin from "./pages/SecureLogin";
import Dashboard from "./pages/Dashboard";
import CustomerList from "./pages/CustomerList";
import CustomerNew from "./pages/CustomerNew";
import CustomerDetail from "./pages/CustomerDetail";
import CompletedCases from "./pages/CompletedCases";
import SecureUserManagement from "./pages/SecureUserManagement";
import Settings from "./pages/Settings";
import Security from "./pages/Security";
import NotFound from "./pages/NotFound";

// Create QueryClient instance outside component to prevent recreation on every render
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <CustomerProvider>
            <NotificationProvider>
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/login" element={<SecureLogin />} />
                  <Route 
                    path="/dashboard" 
                    element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/customers" 
                    element={
                      <ProtectedRoute>
                        <CustomerList />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/customers/new" 
                    element={
                      <ProtectedRoute>
                        <CustomerNew />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/customers/:id" 
                    element={
                      <ProtectedRoute>
                        <CustomerDetail />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/completed" 
                    element={
                      <ProtectedRoute>
                        <CompletedCases />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/users" 
                    element={
                      <ProtectedRoute requireAdmin={true}>
                        <SecureUserManagement />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/security" 
                    element={
                      <ProtectedRoute requireAdmin={true}>
                        <Security />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/settings" 
                    element={
                      <ProtectedRoute>
                        <Settings />
                      </ProtectedRoute>
                    } 
                  />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </NotificationProvider>
          </CustomerProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
