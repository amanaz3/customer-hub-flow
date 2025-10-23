import React, { createContext, useContext, ReactNode } from 'react';
import { useApplicationData } from '@/hooks/useApplicationData';
import { useApplicationActions } from '@/hooks/useApplicationActions';
import type { Application, CreateApplicationInput, UpdateApplicationInput } from '@/types/application';

interface ApplicationContextType {
  applications: Application[];
  setApplications: (apps: Application[]) => void;
  isLoading: boolean;
  refreshData: () => Promise<void>;
  addApplication: (input: CreateApplicationInput) => Promise<Application | null>;
  updateApplication: (applicationId: string, updates: UpdateApplicationInput) => Promise<void>;
  deleteApplication: (applicationId: string) => Promise<void>;
  getApplicationById: (applicationId: string) => Promise<Application | null>;
  updateApplicationStatus: (
    applicationId: string,
    status: string,
    comment?: string,
    userId?: string
  ) => Promise<void>;
  uploadDocument: (applicationId: string, documentId: string, filePath: string) => Promise<void>;
  addMessage: (
    applicationId: string,
    message: string,
    senderId: string,
    senderType?: 'user' | 'admin' | 'system'
  ) => Promise<void>;
}

const ApplicationContext = createContext<ApplicationContextType | undefined>(undefined);

interface ApplicationProviderProps {
  children: ReactNode;
  customerId?: string;
}

export const ApplicationProvider = ({ children, customerId }: ApplicationProviderProps) => {
  const { applications, setApplications, isLoading, refreshData } = useApplicationData(customerId);
  
  const actions = useApplicationActions(applications, setApplications, refreshData);

  const value = {
    applications,
    setApplications,
    isLoading,
    refreshData,
    ...actions,
  };

  return (
    <ApplicationContext.Provider value={value}>
      {children}
    </ApplicationContext.Provider>
  );
};

export const useApplication = () => {
  const context = useContext(ApplicationContext);
  if (context === undefined) {
    throw new Error('useApplication must be used within an ApplicationProvider');
  }
  return context;
};

export const useApplications = useApplication; // Alias for backward compatibility
