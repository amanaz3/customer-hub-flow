import { useToast } from '@/hooks/use-toast';
import { ApplicationService } from '@/services/applicationService';
import type { Application, CreateApplicationInput, UpdateApplicationInput } from '@/types/application';

export const useApplicationActions = (
  applications: Application[],
  setApplications: (apps: Application[]) => void,
  refreshData: () => Promise<void>
) => {
  const { toast } = useToast();

  const addApplication = async (input: CreateApplicationInput): Promise<Application | null> => {
    try {
      const newApplication = await ApplicationService.createApplication(input);
      
      // Create default documents
      const licenseType = input.application_data.license_type || 'Mainland';
      await ApplicationService.createApplicationDocuments(newApplication.id, licenseType);
      
      setApplications([...applications, newApplication]);
      
      toast({
        title: 'Success',
        description: 'Application created successfully',
      });
      
      await refreshData();
      return newApplication;
    } catch (error) {
      console.error('Error creating application:', error);
      toast({
        title: 'Error',
        description: 'Failed to create application',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateApplication = async (
    applicationId: string,
    updates: UpdateApplicationInput
  ): Promise<void> => {
    try {
      await ApplicationService.updateApplication(applicationId, updates);
      
      setApplications(
        applications.map((app) =>
          app.id === applicationId ? { ...app, ...updates } : app
        )
      );
      
      toast({
        title: 'Success',
        description: 'Application updated successfully',
      });
      
      await refreshData();
    } catch (error) {
      console.error('Error updating application:', error);
      toast({
        title: 'Error',
        description: 'Failed to update application',
        variant: 'destructive',
      });
    }
  };

  const deleteApplication = async (applicationId: string): Promise<void> => {
    try {
      await ApplicationService.deleteApplication(applicationId);
      
      setApplications(applications.filter((app) => app.id !== applicationId));
      
      toast({
        title: 'Success',
        description: 'Application deleted successfully',
      });
      
      await refreshData();
    } catch (error) {
      console.error('Error deleting application:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete application',
        variant: 'destructive',
      });
    }
  };

  const getApplicationById = async (applicationId: string): Promise<Application | null> => {
    try {
      return await ApplicationService.fetchApplicationById(applicationId);
    } catch (error) {
      console.error('Error fetching application:', error);
      return null;
    }
  };

  const updateApplicationStatus = async (
    applicationId: string,
    status: string,
    comment?: string,
    userId?: string
  ): Promise<void> => {
    try {
      await ApplicationService.updateApplicationStatus(applicationId, status, comment, userId);
      
      toast({
        title: 'Success',
        description: 'Application status updated successfully',
      });
      
      await refreshData();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update application status',
        variant: 'destructive',
      });
    }
  };

  const uploadDocument = async (
    applicationId: string,
    documentId: string,
    filePath: string
  ): Promise<void> => {
    try {
      await ApplicationService.uploadApplicationDocument(applicationId, documentId, filePath);
      
      toast({
        title: 'Success',
        description: 'Document uploaded successfully',
      });
      
      await refreshData();
    } catch (error) {
      console.error('Error uploading document:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload document',
        variant: 'destructive',
      });
    }
  };

  const addMessage = async (
    applicationId: string,
    message: string,
    senderId: string,
    senderType: 'user' | 'admin' | 'system' = 'user'
  ): Promise<void> => {
    try {
      await ApplicationService.addApplicationMessage(applicationId, message, senderId, senderType);
      
      toast({
        title: 'Success',
        description: 'Message added successfully',
      });
      
      await refreshData();
    } catch (error) {
      console.error('Error adding message:', error);
      toast({
        title: 'Error',
        description: 'Failed to add message',
        variant: 'destructive',
      });
    }
  };

  return {
    addApplication,
    updateApplication,
    deleteApplication,
    getApplicationById,
    updateApplicationStatus,
    uploadDocument,
    addMessage,
  };
};
