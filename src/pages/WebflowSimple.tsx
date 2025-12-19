import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { WebflowProvider, useWebflow } from '@/contexts/WebflowContext';
import { WebflowAIAssistant } from '@/components/AIAssistant/WebflowAIAssistant';
import { CountryPage } from './WebflowSimple/CountryPage';
import { IntentPage } from './WebflowSimple/IntentPage';
import { JurisdictionPage } from './WebflowSimple/JurisdictionPage';
import { ActivityPage } from './WebflowSimple/ActivityPage';
import { PlansPage } from './WebflowSimple/PlansPage';
import { PaymentPage } from './WebflowSimple/PaymentPage';
import { DetailsPage } from './WebflowSimple/DetailsPage';
import { BookkeepingPage } from './WebflowSimple/BookkeepingPage';
import { DashboardPage } from './WebflowSimple/DashboardPage';

const stepPaths = [
  '/webflow-simple/country',
  '/webflow-simple/intent',
  '/webflow-simple/jurisdiction',
  '/webflow-simple/activity',
  '/webflow-simple/plans',
  '/webflow-simple/payment',
  '/webflow-simple/details',
  '/webflow-simple/bookkeeping',
  '/webflow-simple/dashboard',
];

const stepNames = [
  'Country Selection',
  'Business Intent',
  'Jurisdiction',
  'Business Activity',
  'Plan & Pricing',
  'Payment',
  'Founder Details',
  'Bookkeeping & Tax',
  'Dashboard'
];

const WebflowSimpleContent: React.FC = () => {
  const { state, updateState } = useWebflow();
  const navigate = useNavigate();
  const location = useLocation();

  // Sync current step with route
  useEffect(() => {
    const currentPathIndex = stepPaths.findIndex(path => location.pathname === path);
    if (currentPathIndex !== -1 && currentPathIndex + 1 !== state.currentStep) {
      updateState({ currentStep: currentPathIndex + 1 });
    }
  }, [location.pathname]);

  // Build context for AI Assistant
  const assistantContext = {
    currentStep: stepNames[state.currentStep - 1],
    nationality: state.nationality || undefined,
    companyType: state.locationType || undefined,
    businessActivity: state.activityName || undefined,
    jurisdiction: state.emirate || undefined,
  };

  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/webflow-simple/country" replace />} />
        <Route path="/country" element={<CountryPage />} />
        <Route path="/intent" element={<IntentPage />} />
        <Route path="/jurisdiction" element={<JurisdictionPage />} />
        <Route path="/activity" element={<ActivityPage />} />
        <Route path="/plans" element={<PlansPage />} />
        <Route path="/payment" element={<PaymentPage />} />
        <Route path="/details" element={<DetailsPage />} />
        <Route path="/bookkeeping" element={<BookkeepingPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
      </Routes>

      {/* AI Assistant */}
      <WebflowAIAssistant context={assistantContext} />
    </>
  );
};

const WebflowSimple: React.FC = () => {
  return (
    <WebflowProvider>
      <WebflowSimpleContent />
    </WebflowProvider>
  );
};

export default WebflowSimple;
