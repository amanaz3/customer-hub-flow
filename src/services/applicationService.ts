import { supabase } from '@/lib/supabase';
import type { 
  Application, 
  CreateApplicationInput, 
  UpdateApplicationInput,
  ApplicationDocument,
  ApplicationMessage,
  ApplicationOwner 
} from '@/types/application';

export class ApplicationService {
  /**
   * Create a new application for a customer
   */
  static async createApplication(input: CreateApplicationInput): Promise<Application> {
    const { data, error } = await supabase
      .from('account_applications')
      .insert([{
        customer_id: input.customer_id,
        application_type: input.application_type,
        submission_source: input.submission_source || 'web_form',
        status: input.status || 'draft',
        application_data: input.application_data as any,
      }] as any)
      .select('*')
      .single();

    if (error) throw error;
    return data as Application;
  }

  /**
   * Fetch all applications for a specific customer
   */
  static async fetchApplicationsByCustomerId(customerId: string): Promise<Application[]> {
    const { data, error } = await supabase
      .from('account_applications')
      .select(`
        *,
        customer:customers (
          id,
          name,
          email,
          mobile,
          company
        )
      `)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Application[];
  }

  /**
   * Fetch a single application by ID with all related data
   */
  static async fetchApplicationById(applicationId: string): Promise<Application | null> {
    const { data, error } = await supabase
      .from('account_applications')
      .select(`
        *,
        customer:customers (
          id,
          name,
          email,
          mobile,
          company,
          license_type
        )
      `)
      .eq('id', applicationId)
      .single();

    if (error) {
      console.error('Error fetching application:', error);
      return null;
    }

    const application = data as Application;

    // Fetch documents
    const { data: documents } = await supabase
      .from('application_documents')
      .select('*')
      .eq('application_id', applicationId)
      .order('created_at', { ascending: true });

    application.documents = (documents || []) as ApplicationDocument[];

    // Fetch messages
    const { data: messages } = await supabase
      .from('application_messages')
      .select('*')
      .eq('application_id', applicationId)
      .order('created_at', { ascending: false });

    application.messages = (messages || []) as ApplicationMessage[];

    // Fetch owners
    const { data: owners } = await supabase
      .from('application_owners')
      .select('*')
      .eq('application_id', applicationId)
      .order('created_at', { ascending: true });

    application.owners = (owners || []) as ApplicationOwner[];

    return application;
  }

  /**
   * Update an existing application
   */
  static async updateApplication(
    applicationId: string, 
    updates: UpdateApplicationInput
  ): Promise<Application> {
    const { data, error } = await supabase
      .from('account_applications')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', applicationId)
      .select('*')
      .single();

    if (error) throw error;
    return data as Application;
  }

  /**
   * Delete an application
   */
  static async deleteApplication(applicationId: string): Promise<void> {
    const { error } = await supabase
      .from('account_applications')
      .delete()
      .eq('id', applicationId);

    if (error) throw error;
  }

  /**
   * Create default documents for an application
   */
  static async createApplicationDocuments(
    applicationId: string, 
    licenseType: string
  ): Promise<void> {
    const defaultDocuments = [
      { document_type: 'Passport Copy', is_mandatory: true },
      { document_type: 'Emirates ID', is_mandatory: true },
      { document_type: 'Business Plan', is_mandatory: true },
      { document_type: 'Bank Statement', is_mandatory: true },
      { document_type: 'Trade License', is_mandatory: licenseType === 'Mainland' },
      { document_type: 'MOA', is_mandatory: licenseType === 'Mainland' },
      { document_type: 'Freezone License', is_mandatory: licenseType === 'Freezone' },
    ];

    const documentsToInsert = defaultDocuments
      .filter(doc => doc.is_mandatory)
      .map(doc => ({
        application_id: applicationId,
        document_type: doc.document_type,
        is_uploaded: false,
      }));

    const { error } = await supabase
      .from('application_documents')
      .insert(documentsToInsert);

    if (error) throw error;
  }

  /**
   * Upload a document for an application
   */
  static async uploadApplicationDocument(
    applicationId: string,
    documentId: string,
    filePath: string
  ): Promise<void> {
    const { error } = await supabase
      .from('application_documents')
      .update({
        file_path: filePath,
        is_uploaded: true,
      })
      .eq('id', documentId)
      .eq('application_id', applicationId);

    if (error) throw error;
  }

  /**
   * Add a message/comment to an application
   */
  static async addApplicationMessage(
    applicationId: string,
    message: string,
    senderId: string,
    senderType: 'user' | 'admin' | 'system' = 'user'
  ): Promise<ApplicationMessage> {
    const { data, error } = await supabase
      .from('application_messages')
      .insert({
        application_id: applicationId,
        sender_id: senderId,
        sender_type: senderType,
        message,
        is_read: false,
      })
      .select('*')
      .single();

    if (error) throw error;
    return data as ApplicationMessage;
  }

  /**
   * Add an owner to an application
   */
  static async addApplicationOwner(
    applicationId: string,
    ownerData: Omit<ApplicationOwner, 'id' | 'application_id' | 'created_at'>
  ): Promise<ApplicationOwner> {
    const { data, error } = await supabase
      .from('application_owners')
      .insert({
        application_id: applicationId,
        ...ownerData,
      })
      .select('*')
      .single();

    if (error) throw error;
    return data as ApplicationOwner;
  }

  /**
   * Update application status (calls edge function to trigger notifications)
   */
  static async updateApplicationStatus(
    applicationId: string,
    status: string,
    comment?: string,
    userId?: string,
    userRole: 'admin' | 'manager' | 'user' = 'user'
  ): Promise<void> {
    // Call the edge function to update status and create notifications
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('No active session');
    }

    const response = await fetch(
      `https://gddibkhyhcnejxthsyzu.supabase.co/functions/v1/update-application-status`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          applicationId,
          newStatus: status,
          comment: comment || '',
          changedBy: userId,
          changedByRole: userRole,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update application status');
    }

    const result = await response.json();
    console.log('Application status updated via edge function:', result);
  }
}
