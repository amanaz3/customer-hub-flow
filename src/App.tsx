
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/contexts/SecureAuthContext';
import { CustomerProvider } from '@/contexts/CustomerContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import PageErrorBoundary from '@/components/PageErrorBoundary';
import ProtectedRoute from '@/components/Security/ProtectedRoute';
import MainLayout from '@/components/Layout/MainLayout';
import SecureLogin from '@/pages/SecureLogin';
import {
  LazyOptimizedDashboard,
  LazyCustomerList,
  LazyApplicationsList,
  LazyCustomersList,
  LazyCustomerNew,
  LazyCustomerDetail,
  LazyApplicationDetail,
  LazySecureUserManagement,
  LazyCompletedApplications,
  LazyRejected,
  LazySettings,
  LazyProductManagement,
  LazyServiceCategoryManagement,
  LazyBundleManagement,
  LazyNotFound,
  PageLoadingFallback
} from '@/components/LazyComponents';

import Analytics from '@/pages/Analytics';
import TargetManagement from '@/pages/TargetManagement';
import TeamTargets from '@/pages/TeamTargets';
import ApplicationPipeline from '@/pages/ApplicationPipeline';
import ApplicationMonitor from '@/pages/ApplicationMonitor';
import AgentHelpEditor from '@/pages/AgentHelpEditor';
import NotificationManagement from '@/pages/NotificationManagement';
import NotificationTesting from '@/pages/NotificationTesting';
import DevTools from '@/pages/DevTools';
import DevToolsNotifications from '@/pages/DevToolsNotifications';
import DevToolsDatabase from '@/pages/DevToolsDatabase';
import DevToolsMigration from '@/pages/DevToolsMigration';
import TaskCollaboration from '@/pages/TaskCollaboration';
import TaskSettings from '@/pages/TaskSettings';
import Configure from '@/pages/Configure';
import CustomerServicesManagement from '@/pages/CustomerServicesManagement';
import ServiceFormConfiguration from '@/pages/ServiceFormConfiguration';
import Messages from '@/pages/Messages';
import ApplicationsByStage from '@/pages/ApplicationsByStage';
import ApplicationsByTeam from '@/pages/ApplicationsByTeam';
import LegacyApplicationsView from '@/pages/LegacyApplicationsView';
import Tracker from '@/pages/Tracker';
import Ops from '@/pages/Ops';
import Strategic from '@/pages/Strategic';
import Analysis from '@/pages/Analysis';
import AI360View from '@/pages/AI360View';
import Cycles from '@/pages/Cycles';
import DevManagement from '@/pages/DevManagement';
import ApplicationsByServices from '@/pages/ApplicationsByServices';
import ServiceFees from '@/pages/ServiceFees';
import DevToolsNew from '@/pages/DevToolsNew';
import AdminManage from '@/pages/AdminManage';
import CustomerSegments from '@/pages/CustomerSegments';
import RFMAnalysis from '@/pages/RFMAnalysis';
import CustomerClassification from '@/pages/CustomerClassification';
import Legacy from '@/pages/Legacy';
import LegacyDashboard from '@/pages/LegacyDashboard';
import LiveAssistant from '@/pages/LiveAssistant';
import PlaybookEditor from '@/pages/PlaybookEditor';
import SalesGuide from '@/pages/SalesGuide';
import QuickReference from '@/pages/QuickReference';
import QuickNotes from '@/pages/QuickNotes';
// Leads.tsx removed - now consolidated into LeadWorkflow.tsx
import LeadDetail from '@/pages/LeadDetail';
import LeadWorkflow from '@/pages/LeadWorkflow';
import BankPainAnalysis from '@/pages/BankPainAnalysis';
import AccessManagement from '@/pages/AccessManagement';
import LeadDiscoveryAnalysis from '@/pages/LeadDiscoveryAnalysis';
import BankReadiness from '@/pages/BankReadiness';
import Webflow from '@/pages/Webflow';
import WebflowSimple from '@/pages/WebflowSimple';
import WebflowConfig from '@/pages/WebflowConfig';
import Web from '@/pages/Web';
import AIAssistant from '@/pages/AIAssistant';
import AIAssistantConfig from '@/pages/AIAssistantConfig';
import AIBookkeeper from '@/pages/AIBookkeeper';
import TaxFiling from '@/pages/TaxFiling';
import FractionalCFO from '@/pages/FractionalCFO';
import WorkflowBuilder from '@/pages/WorkflowBuilder';
import DocSearchQA from '@/pages/DocSearchQA';
import OpenBanking from '@/pages/OpenBanking';
import AIWorkflows from '@/pages/AIWorkflows';
import AIAdvisory from '@/pages/AIAdvisory';
import Sales from '@/pages/Sales';
import Customer from '@/pages/Customer';
import Agent from '@/pages/Agent';
import CompanyAndTeam from '@/pages/CompanyAndTeam';
import TeamPage from '@/pages/TeamPage';
import Accounting from '@/pages/Accounting';
import ErrorTracker from '@/utils/errorTracking';
import PerformanceMonitor from '@/utils/performanceMonitoring';
import FeatureAnalytics from '@/utils/featureAnalytics';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  useEffect(() => {
    // Initialize monitoring systems
    ErrorTracker.init();
    PerformanceMonitor.init();
    PerformanceMonitor.trackPageLoad();
    FeatureAnalytics.init();

    // Track app initialization
    FeatureAnalytics.trackUserEngagement('session_start');

    return () => {
      // Cleanup on unmount
      PerformanceMonitor.cleanup();
      FeatureAnalytics.clearData();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} storageKey="theme">
        <ErrorBoundary
          onError={(error, errorInfo) => {
            // Log application-level errors
            ErrorTracker.captureError(error, { component: 'App', ...errorInfo });
          }}
        >
          <Router>
            <AuthProvider>
            <CustomerProvider>
              <NotificationProvider>
                <div className="min-h-screen bg-background">
                <Routes>
                  <Route path="/login" element={
                    <PageErrorBoundary pageName="Login">
                      <SecureLogin />
                    </PageErrorBoundary>
                  } />
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  
                  <Route path="/dashboard" element={
                    <ProtectedRoute>
                      <MainLayout>
                        <PageErrorBoundary pageName="Dashboard">
                          <LazyOptimizedDashboard />
                        </PageErrorBoundary>
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/analytics" element={
                    <ProtectedRoute requireAdmin>
                      <MainLayout>
                        <PageErrorBoundary pageName="Analytics">
                          <Analytics />
                        </PageErrorBoundary>
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/targets" element={
                    <ProtectedRoute requireAdmin>
                      <MainLayout>
                        <PageErrorBoundary pageName="Target Management">
                          <TargetManagement />
                        </PageErrorBoundary>
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/team-targets" element={
                    <ProtectedRoute requireAdmin>
                      <MainLayout>
                        <PageErrorBoundary pageName="Team Targets">
                          <TeamTargets />
                        </PageErrorBoundary>
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/application-pipeline" element={
                    <ProtectedRoute requireAdmin>
                      <MainLayout>
                        <PageErrorBoundary pageName="Application Pipeline">
                          <ApplicationPipeline />
                        </PageErrorBoundary>
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/application-monitor" element={
                    <ProtectedRoute requireAdmin>
                      <MainLayout>
                        <PageErrorBoundary pageName="Application Monitor">
                          <ApplicationMonitor />
                        </PageErrorBoundary>
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/notification-management" element={
                    <ProtectedRoute requireAdmin>
                      <MainLayout>
                        <PageErrorBoundary pageName="Notification Management">
                          <NotificationManagement />
                        </PageErrorBoundary>
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/notification-testing" element={
                    <ProtectedRoute requireAdmin>
                      <MainLayout>
                        <PageErrorBoundary pageName="Notification Testing">
                          <NotificationTesting />
                        </PageErrorBoundary>
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/dev-tools" element={
                    <ProtectedRoute requireAdmin>
                      <MainLayout>
                        <PageErrorBoundary pageName="Admin Tools">
                          <DevTools />
                        </PageErrorBoundary>
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/dev-tools/notifications" element={
                    <ProtectedRoute requireAdmin>
                      <MainLayout>
                        <PageErrorBoundary pageName="Notification Testing">
                          <DevToolsNotifications />
                        </PageErrorBoundary>
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/dev-tools/database" element={
                    <ProtectedRoute requireAdmin>
                      <MainLayout>
                        <PageErrorBoundary pageName="Database Viewer">
                          <DevToolsDatabase />
                        </PageErrorBoundary>
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/dev-tools/migration" element={
                    <ProtectedRoute requireAdmin>
                      <MainLayout>
                        <PageErrorBoundary pageName="Data Migration">
                          <DevToolsMigration />
                        </PageErrorBoundary>
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/devtools" element={
                    <ProtectedRoute requireAdmin>
                      <MainLayout>
                        <PageErrorBoundary pageName="DevTools">
                          <DevToolsNew />
                        </PageErrorBoundary>
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/admin-manage" element={
                    <ProtectedRoute requireAdmin>
                      <MainLayout>
                        <PageErrorBoundary pageName="Manage">
                          <AdminManage />
                        </PageErrorBoundary>
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/applications" element={
                    <ProtectedRoute>
                      <MainLayout>
                        <PageErrorBoundary pageName="Applications List">
                          <LazyApplicationsList />
                        </PageErrorBoundary>
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/applications/new" element={
                    <ProtectedRoute>
                      <MainLayout>
                        <PageErrorBoundary pageName="New Application">
                          <LazyCustomerNew />
                        </PageErrorBoundary>
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/applications/new/:applicationId" element={
                    <ProtectedRoute>
                      <MainLayout>
                        <PageErrorBoundary pageName="Resume Application">
                          <LazyCustomerNew />
                        </PageErrorBoundary>
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/applications/:id" element={
                    <ProtectedRoute>
                      <MainLayout>
                        <PageErrorBoundary pageName="Application Details">
                          <LazyApplicationDetail />
                        </PageErrorBoundary>
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/applications-by-stage" element={
                    <ProtectedRoute requireAdmin>
                      <MainLayout>
                        <PageErrorBoundary pageName="Applications by Stage">
                          <ApplicationsByStage />
                        </PageErrorBoundary>
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/applications-by-team" element={
                    <ProtectedRoute requireAdmin>
                      <MainLayout>
                        <PageErrorBoundary pageName="Applications by Team">
                          <ApplicationsByTeam />
                        </PageErrorBoundary>
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/legacy-applications" element={
                    <ProtectedRoute requireAdmin>
                      <MainLayout>
                        <PageErrorBoundary pageName="Legacy Applications">
                          <LegacyApplicationsView />
                        </PageErrorBoundary>
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/applications-by-services" element={
                    <ProtectedRoute requireAdmin>
                      <MainLayout>
                        <PageErrorBoundary pageName="Applications by Services">
                          <ApplicationsByServices />
                        </PageErrorBoundary>
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/tracker" element={
                    <ProtectedRoute requireAdmin>
                      <MainLayout>
                        <PageErrorBoundary pageName="Tracker">
                          <Tracker />
                        </PageErrorBoundary>
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/360-degree" element={
                    <ProtectedRoute requireAdmin>
                      <MainLayout>
                        <PageErrorBoundary pageName="360° AI View">
                          <AI360View />
                        </PageErrorBoundary>
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/ops" element={
                    <ProtectedRoute requireAdmin>
                      <MainLayout>
                        <PageErrorBoundary pageName="Operations">
                          <Ops />
                        </PageErrorBoundary>
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/strategic" element={
                    <ProtectedRoute requireAdmin>
                      <MainLayout>
                        <PageErrorBoundary pageName="Strategic">
                          <Strategic />
                        </PageErrorBoundary>
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/analysis" element={
                    <ProtectedRoute requireAdmin>
                      <MainLayout>
                        <PageErrorBoundary pageName="Analysis">
                          <Analysis />
                        </PageErrorBoundary>
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/bank-pain-analysis" element={
                    <ProtectedRoute requireAdmin>
                      <MainLayout>
                        <PageErrorBoundary pageName="Bank Pain Analysis">
                          <BankPainAnalysis />
                        </PageErrorBoundary>
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/lead-discovery-analysis" element={
                    <ProtectedRoute requireAdmin>
                      <MainLayout>
                        <PageErrorBoundary pageName="Lead Discovery Analysis">
                          <LeadDiscoveryAnalysis />
                        </PageErrorBoundary>
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/bank-readiness" element={
                    <ProtectedRoute>
                      <MainLayout>
                        <PageErrorBoundary pageName="Bank Readiness">
                          <BankReadiness />
                        </PageErrorBoundary>
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/web" element={
                    <ProtectedRoute>
                      <MainLayout>
                        <PageErrorBoundary pageName="Web">
                          <Web />
                        </PageErrorBoundary>
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/webflow" element={
                    <PageErrorBoundary pageName="Webflow">
                      <Webflow />
                    </PageErrorBoundary>
                  } />
                  
                  <Route path="/webflow-simple/*" element={
                    <PageErrorBoundary pageName="Webflow Simple">
                      <WebflowSimple />
                    </PageErrorBoundary>
                  } />
                  
                  <Route path="/customer-segments" element={
                    <ProtectedRoute requireAdmin>
                      <MainLayout>
                        <PageErrorBoundary pageName="Customer Segments">
                          <CustomerSegments />
                        </PageErrorBoundary>
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/rfm-analysis" element={
                    <ProtectedRoute requireAdmin>
                      <MainLayout>
                        <PageErrorBoundary pageName="RFM Analysis">
                          <RFMAnalysis />
                        </PageErrorBoundary>
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/customer-classification" element={
                    <ProtectedRoute requireAdmin>
                      <MainLayout>
                        <PageErrorBoundary pageName="Customer Classification">
                          <CustomerClassification />
                        </PageErrorBoundary>
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/legacy" element={
                    <ProtectedRoute requireAdmin>
                      <MainLayout>
                        <PageErrorBoundary pageName="Legacy">
                          <Legacy />
                        </PageErrorBoundary>
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/legacy/dashboard" element={
                    <ProtectedRoute>
                      <MainLayout>
                        <PageErrorBoundary pageName="Legacy Dashboard">
                          <LegacyDashboard />
                        </PageErrorBoundary>
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/live-assistant" element={
                    <ProtectedRoute requireAdmin>
                      <MainLayout>
                        <PageErrorBoundary pageName="Live Assistant">
                          <LiveAssistant />
                        </PageErrorBoundary>
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/customers" element={
                    <ProtectedRoute>
                      <MainLayout>
                        <PageErrorBoundary pageName="Customers List">
                          <LazyCustomersList />
                        </PageErrorBoundary>
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/customers/new" element={<Navigate to="/applications/new" replace />} />
                  
                  <Route path="/customers/:id" element={
                    <ProtectedRoute>
                      <MainLayout>
                        <PageErrorBoundary pageName="Customer Profile">
                          <LazyCustomerDetail />
                        </PageErrorBoundary>
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/users" element={
                    <ProtectedRoute requireAdmin>
                      <MainLayout>
                        <PageErrorBoundary pageName="User Management">
                          <LazySecureUserManagement />
                        </PageErrorBoundary>
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/access-management" element={
                    <ProtectedRoute requireAdmin>
                      <MainLayout>
                        <PageErrorBoundary pageName="Access Management">
                          <AccessManagement />
                        </PageErrorBoundary>
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/completed" element={
                    <ProtectedRoute>
                      <MainLayout>
                        <PageErrorBoundary pageName="Completed Applications">
                          <LazyCompletedApplications />
                        </PageErrorBoundary>
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/rejected" element={
                    <ProtectedRoute>
                      <MainLayout>
                        <PageErrorBoundary pageName="Rejected Items">
                          <LazyRejected />
                        </PageErrorBoundary>
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/products" element={
                    <ProtectedRoute requireAdmin>
                      <MainLayout>
                        <PageErrorBoundary pageName="Product Management">
                          <LazyProductManagement />
                        </PageErrorBoundary>
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/service-categories" element={
                    <ProtectedRoute requireAdmin>
                      <MainLayout>
                        <PageErrorBoundary pageName="Service Category Management">
                          <LazyServiceCategoryManagement />
                        </PageErrorBoundary>
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/bundles" element={
                    <ProtectedRoute requireAdmin>
                      <MainLayout>
                        <PageErrorBoundary pageName="Bundle Management">
                          <LazyBundleManagement />
                        </PageErrorBoundary>
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/service-form-configuration" element={
                    <ProtectedRoute requireAdmin>
                      <MainLayout>
                        <PageErrorBoundary pageName="Service Details Form Configuration">
                          <ServiceFormConfiguration />
                        </PageErrorBoundary>
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/service-fees" element={
                    <ProtectedRoute requireAdmin>
                      <MainLayout>
                        <PageErrorBoundary pageName="Service Fees">
                          <ServiceFees />
                        </PageErrorBoundary>
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/settings" element={
                    <ProtectedRoute>
                      <MainLayout>
                        <PageErrorBoundary pageName="Settings">
                          <LazySettings />
                        </PageErrorBoundary>
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/admin/help-editor" element={
                    <ProtectedRoute requireAdmin>
                      <MainLayout>
                        <PageErrorBoundary pageName="Agent Help Editor">
                          <AgentHelpEditor />
                        </PageErrorBoundary>
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/admin/migrate" element={<Navigate to="/dev-tools" replace />} />
                  <Route path="/admin/database" element={<Navigate to="/dev-tools" replace />} />
                  
                  <Route path="/team" element={
                    <ProtectedRoute>
                      <MainLayout>
                        <PageErrorBoundary pageName="Track Tasks">
                          <TaskCollaboration />
                        </PageErrorBoundary>
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/cycles" element={
                    <ProtectedRoute requireAdmin>
                      <MainLayout>
                        <PageErrorBoundary pageName="Cycles">
                          <Cycles />
                        </PageErrorBoundary>
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/manage" element={
                    <ProtectedRoute requireAdmin>
                      <MainLayout>
                        <PageErrorBoundary pageName="Configure">
                          <Configure />
                        </PageErrorBoundary>
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/configure" element={
                    <ProtectedRoute requireAdmin>
                      <MainLayout>
                        <PageErrorBoundary pageName="Configure">
                          <Configure />
                        </PageErrorBoundary>
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/webflow-config" element={
                    <ProtectedRoute requireAdmin>
                      <MainLayout>
                        <PageErrorBoundary pageName="Webflow Config">
                          <WebflowConfig />
                        </PageErrorBoundary>
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/customer-services" element={
                    <ProtectedRoute requireAdmin>
                      <MainLayout>
                        <PageErrorBoundary pageName="Customer Services Management">
                          <CustomerServicesManagement />
                        </PageErrorBoundary>
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/dev-management" element={
                    <ProtectedRoute requireAdmin>
                      <MainLayout>
                        <PageErrorBoundary pageName="Dev Management">
                          <DevManagement />
                        </PageErrorBoundary>
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/messages" element={
                    <ProtectedRoute requireAdmin>
                      <MainLayout>
                        <PageErrorBoundary pageName="Messages">
                          <Messages />
                        </PageErrorBoundary>
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/task-settings" element={
                    <ProtectedRoute requireAdmin>
                      <MainLayout>
                        <PageErrorBoundary pageName="Task Settings">
                          <TaskSettings />
                        </PageErrorBoundary>
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/playbook-editor" element={
                    <ProtectedRoute requireAdmin>
                      <MainLayout>
                        <PageErrorBoundary pageName="Playbook Editor">
                          <PlaybookEditor />
                        </PageErrorBoundary>
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/quick-reference" element={
                    <ProtectedRoute>
                      <MainLayout>
                        <PageErrorBoundary pageName="Quick Reference">
                          <QuickReference />
                        </PageErrorBoundary>
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/quick-notes" element={
                    <ProtectedRoute>
                      <MainLayout>
                        <PageErrorBoundary pageName="Quick Notes">
                          <QuickNotes />
                        </PageErrorBoundary>
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/sales-guide" element={
                    <ProtectedRoute>
                      <MainLayout>
                        <PageErrorBoundary pageName="Sales Guide">
                          <SalesGuide />
                        </PageErrorBoundary>
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/ai-assistant" element={
                    <ProtectedRoute>
                      <MainLayout>
                        <PageErrorBoundary pageName="AI Assistant">
                          <AIAssistant />
                        </PageErrorBoundary>
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/ai-assistant-config" element={
                    <ProtectedRoute requireAdmin>
                      <MainLayout>
                        <PageErrorBoundary pageName="AI Assistant Config">
                          <AIAssistantConfig />
                        </PageErrorBoundary>
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/ai-bookkeeper" element={
                    <ProtectedRoute>
                      <MainLayout>
                        <PageErrorBoundary pageName="AI Bookkeeper">
                          <AIBookkeeper />
                        </PageErrorBoundary>
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/ai-advisory" element={
                    <ProtectedRoute>
                      <MainLayout>
                        <PageErrorBoundary pageName="AI Advisory">
                          <AIAdvisory />
                        </PageErrorBoundary>
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/tax-filing" element={
                    <ProtectedRoute>
                      <MainLayout>
                        <PageErrorBoundary pageName="Tax Filing">
                          <TaxFiling />
                        </PageErrorBoundary>
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/fractional-cfo" element={
                    <ProtectedRoute requireAdmin>
                      <MainLayout>
                        <PageErrorBoundary pageName="Fractional CFO">
                          <FractionalCFO />
                        </PageErrorBoundary>
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/workflow-builder" element={
                    <ProtectedRoute requireAdmin>
                      <MainLayout>
                        <PageErrorBoundary pageName="Workflow Builder">
                          <WorkflowBuilder />
                        </PageErrorBoundary>
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/leads" element={<Navigate to="/lead-workflow" replace />} />
                  
                  <Route path="/leads/:id" element={
                    <ProtectedRoute>
                      <MainLayout>
                        <PageErrorBoundary pageName="Lead Detail">
                          <LeadDetail />
                        </PageErrorBoundary>
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/lead-workflow" element={
                    <ProtectedRoute>
                      <MainLayout>
                        <PageErrorBoundary pageName="Lead Workflow">
                          <LeadWorkflow />
                        </PageErrorBoundary>
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/doc-search" element={
                    <ProtectedRoute>
                      <MainLayout>
                        <PageErrorBoundary pageName="Doc Search & Q/A">
                          <DocSearchQA />
                        </PageErrorBoundary>
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/open-banking" element={
                    <ProtectedRoute>
                      <MainLayout>
                        <PageErrorBoundary pageName="Open Banking">
                          <OpenBanking />
                        </PageErrorBoundary>
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/ai-workflows" element={
                    <ProtectedRoute>
                      <MainLayout>
                        <PageErrorBoundary pageName="AI Workflows">
                          <AIWorkflows />
                        </PageErrorBoundary>
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/sales" element={
                    <ProtectedRoute>
                      <PageErrorBoundary pageName="Sales">
                        <Sales />
                      </PageErrorBoundary>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/customer" element={
                    <ProtectedRoute>
                      <PageErrorBoundary pageName="Customer">
                        <Customer />
                      </PageErrorBoundary>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/agent" element={
                    <ProtectedRoute>
                      <PageErrorBoundary pageName="Agent">
                        <Agent />
                      </PageErrorBoundary>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/company-and-team" element={
                    <ProtectedRoute>
                      <PageErrorBoundary pageName="Company and Team">
                        <CompanyAndTeam />
                      </PageErrorBoundary>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/team-page" element={
                    <ProtectedRoute>
                      <PageErrorBoundary pageName="Team">
                        <TeamPage />
                      </PageErrorBoundary>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/accounting" element={
                    <ProtectedRoute>
                      <PageErrorBoundary pageName="Accounting">
                        <Accounting />
                      </PageErrorBoundary>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="*" element={
                    <PageErrorBoundary pageName="Not Found">
                      <LazyNotFound />
                    </PageErrorBoundary>
                  } />
                  </Routes>
                </div>
              </NotificationProvider>
            </CustomerProvider>
          </AuthProvider>
        </Router>
      </ErrorBoundary>
      <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
