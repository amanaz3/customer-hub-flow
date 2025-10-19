import React from 'react';
import { PageLoadingSkeleton } from '@/components/ui/loading-skeletons';

const AuthLoadingSpinner: React.FC = () => {
  return <PageLoadingSkeleton message="Authenticating..." />;
};

export default AuthLoadingSpinner;
