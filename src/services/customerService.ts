import { supabase } from '@/lib/supabase';
import { Customer } from '@/types/customer';

export class CustomerService {
  static async fetchCustomers(userId?: string) {
    console.log('Fetching customers for user:', userId);
    
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching customers:', error);
      throw error;
    }

    console.log('Raw customers data:', data);

    const customersWithDocumentsAndHistory = await Promise.all(
      (data || []).map(async (customer) => {
        // Fetch documents
        const { data: docsData, error: docsError } = await supabase
          .from('documents')
          .select('*')
          .eq('customer_id', customer.id);

        if (docsError) {
          console.error('Error fetching documents for customer:', customer.id, docsError);
        }

        // Fetch status history
        const { data: statusHistory, error: statusError } = await supabase
          .from('status_changes')
          .select(`
            id,
            customer_id,
            previous_status,
            new_status,
            changed_by,
            changed_by_role,
            comment,
            created_at
          `)
          .eq('customer_id', customer.id)
          .order('created_at', { ascending: false });

        if (statusError) {
          console.error('Error fetching status history for customer:', customer.id, statusError);
        }

        // Fetch comments
        const { data: comments, error: commentsError } = await supabase
          .from('comments')
          .select('*')
          .eq('customer_id', customer.id)
          .order('created_at', { ascending: false });

        if (commentsError) {
          console.error('Error fetching comments for customer:', customer.id, commentsError);
        }

        return {
          ...customer,
          leadSource: customer.lead_source,
          licenseType: customer.license_type,
          documents: docsData || [],
          statusHistory: statusHistory || [],
          comments: (comments || []).map(comment => ({
            id: comment.id,
            content: comment.comment,
            author: comment.created_by,
            timestamp: comment.created_at || new Date().toISOString()
          }))
        };
      })
    );

    console.log('Customers with documents and status history:', customersWithDocumentsAndHistory);
    return customersWithDocumentsAndHistory;
  }

  static async createCustomer(customer: Customer, userId: string) {
    console.log('Creating customer:', customer);
    
    const customerData = {
      name: customer.name,
      email: customer.email,
      mobile: customer.mobile,
      company: customer.company,
      lead_source: customer.leadSource as "Website" | "Referral" | "Social Media" | "Other",
      license_type: customer.licenseType as "Mainland" | "Freezone" | "Offshore",
      amount: customer.amount,
      status: customer.status as "Draft" | "Submitted" | "Returned" | "Sent to Bank" | "Complete" | "Rejected" | "Need More Info" | "Paid",
      user_id: userId,
      preferred_bank: customer.preferred_bank,
      annual_turnover: customer.annual_turnover,
      jurisdiction: customer.jurisdiction,
      customer_notes: customer.customer_notes,
      // drive_folder_id removed - no longer using Google Drive
    };

    console.log('Inserting customer data:', customerData);

    const { data, error } = await supabase
      .from('customers')
      .insert(customerData)
      .select()
      .single();

    if (error) {
      console.error('Database insert error:', error);
      throw new Error(`Failed to create customer in database: ${error.message}`);
    }

    console.log('Customer created successfully:', data);

    // Create default documents for the new customer
    await this.createDefaultDocuments(data.id, customer.licenseType);

    return data;
  }

  static async createDefaultDocuments(customerId: string, licenseType: string) {
    console.log('Creating default documents for customer:', customerId, licenseType);
    
    interface DefaultDocument {
      name: string;
      is_mandatory: boolean;
      category: string;
      requires_license_type?: string;
    }

    const defaultDocuments: DefaultDocument[] = [
      // Mandatory documents for all license types
      { name: 'Passport Copy', is_mandatory: true, category: 'mandatory' },
      { name: 'Emirates ID Copy', is_mandatory: true, category: 'mandatory' },
      { name: 'Trade License Copy', is_mandatory: true, category: 'mandatory' },
      { name: 'Memorandum of Association (MOA)', is_mandatory: true, category: 'mandatory' },
      { name: 'Bank Statements (Last 6 months)', is_mandatory: true, category: 'mandatory' },
      
      // Supporting documents (optional but recommended)
      { name: 'Company Profile', is_mandatory: false, category: 'supporting' },
      { name: 'Audited Financial Statements', is_mandatory: false, category: 'supporting' },
      { name: 'Business Plan', is_mandatory: false, category: 'supporting' },
      { name: 'Proof of Address', is_mandatory: false, category: 'supporting' },
      
      // Signatory documents
      { name: 'Authorized Signatory Passport', is_mandatory: false, category: 'signatory' },
      { name: 'Authorized Signatory Emirates ID', is_mandatory: false, category: 'signatory' },
      { name: 'Board Resolution', is_mandatory: false, category: 'signatory' },
    ];

    // Add Freezone-specific documents if applicable
    if (licenseType === 'Freezone') {
      defaultDocuments.push(
        { name: 'Freezone License Copy', is_mandatory: true, category: 'freezone', requires_license_type: 'Freezone' },
        { name: 'Lease Agreement (Freezone)', is_mandatory: true, category: 'freezone', requires_license_type: 'Freezone' },
        { name: 'No Objection Certificate', is_mandatory: false, category: 'freezone', requires_license_type: 'Freezone' }
      );
    }

    const documentsToInsert = defaultDocuments.map(doc => ({
      customer_id: customerId,
      name: doc.name,
      is_mandatory: doc.is_mandatory,
      category: doc.category as "mandatory" | "freezone" | "supporting" | "signatory",
      requires_license_type: doc.requires_license_type ? doc.requires_license_type as "Mainland" | "Freezone" | "Offshore" : null,
      is_uploaded: false,
      file_path: null
    }));

    const { error } = await supabase
      .from('documents')
      .insert(documentsToInsert);

    if (error) {
      console.error('Error creating default documents:', error);
      // Don't throw error here as customer creation was successful
      // Just log the error and continue
    } else {
      console.log('Default documents created successfully for customer:', customerId);
    }
  }

  static async uploadDocument(customerId: string, documentId: string, filePath: string) {
    const fileInfo = JSON.parse(filePath);
    
    const { error } = await supabase
      .from('documents')
      .update({ 
        is_uploaded: true, 
        file_path: filePath,
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId);

    if (error) {
      console.error('Error updating document:', error);
      throw error;
    }

    // Get document name for status history
    const { data: documentData, error: docError } = await supabase
      .from('documents')
      .select('name')
      .eq('id', documentId)
      .single();

    if (docError) {
      console.error('Error fetching document name:', docError);
    }

    // Add status change to history for document upload
    const { error: statusError } = await supabase
      .from('status_changes')
      .insert({
        customer_id: customerId,
        previous_status: 'Draft' as "Draft" | "Submitted" | "Returned" | "Sent to Bank" | "Complete" | "Rejected" | "Need More Info" | "Paid",
        new_status: 'Draft' as "Draft" | "Submitted" | "Returned" | "Sent to Bank" | "Complete" | "Rejected" | "Need More Info" | "Paid",
        changed_by: 'System',
        changed_by_role: 'user' as "admin" | "user",
        comment: `Document uploaded: ${documentData?.name || fileInfo.name}`,
        created_at: new Date().toISOString()
      });

    if (statusError) {
      console.error('Error adding document upload to status history:', statusError);
      // Don't throw error here as the upload itself was successful
    }

    console.log('Document uploaded successfully:', fileInfo);
    return fileInfo;
  }

  static async updateCustomerStatus(customerId: string, status: string, comment: string, changedBy: string, role: string) {
    console.log('Updating customer status in database:', { customerId, status, comment, changedBy, role });
    
    // Get the current customer to access previous status
    const { data: currentCustomer, error: fetchError } = await supabase
      .from('customers')
      .select('status')
      .eq('id', customerId)
      .single();

    if (fetchError) {
      console.error('Error fetching current customer status:', fetchError);
      throw fetchError;
    }

    const previousStatus = currentCustomer?.status || 'Draft';
    
    console.log('Previous status retrieved:', previousStatus, 'New status:', status);

    // Update customer status
    const { error: customerError } = await supabase
      .from('customers')
      .update({ 
        status: status as "Draft" | "Submitted" | "Returned" | "Sent to Bank" | "Complete" | "Rejected" | "Need More Info" | "Paid",
        updated_at: new Date().toISOString()
      })
      .eq('id', customerId);

    if (customerError) {
      console.error('Error updating customer status:', customerError);
      throw customerError;
    }

    // Add status change to history
    const statusChangeData = {
      customer_id: customerId,
      previous_status: previousStatus as "Draft" | "Submitted" | "Returned" | "Sent to Bank" | "Complete" | "Rejected" | "Need More Info" | "Paid",
      new_status: status as "Draft" | "Submitted" | "Returned" | "Sent to Bank" | "Complete" | "Rejected" | "Need More Info" | "Paid",
      changed_by: changedBy, // Use the provided changedBy parameter (user ID)
      changed_by_role: role as "admin" | "user",
      comment: comment || null,
      created_at: new Date().toISOString()
    };
    
    console.log('Inserting status change to history:', statusChangeData);
    
    const { data: statusChangeResult, error: statusError } = await supabase
      .from('status_changes')
      .insert(statusChangeData)
      .select()
      .single();

    if (statusError) {
      console.error('Error adding status change to history:', statusError);
      throw statusError;
    }
    
    console.log('Status change successfully inserted:', statusChangeResult);

    console.log('Customer status updated successfully in database with status history');
    return { success: true };
  }

  static async fetchCustomerById(customerId: string) {
    console.log('Fetching customer by ID:', customerId);
    
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single();

    if (customerError) {
      console.error('Error fetching customer:', customerError);
      throw customerError;
    }

    const { data: documents, error: docsError } = await supabase
      .from('documents')
      .select('*')
      .eq('customer_id', customerId);

    if (docsError) {
      console.error('Error fetching documents:', docsError);
      throw docsError;
    }

    const { data: comments, error: commentsError } = await supabase
      .from('comments')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (commentsError) {
      console.error('Error fetching comments:', commentsError);
    }

    // Fetch status history with proper field mapping
    const { data: statusHistory, error: statusError } = await supabase
      .from('status_changes')
      .select(`
        id,
        customer_id,
        previous_status,
        new_status,
        changed_by,
        changed_by_role,
        comment,
        created_at
      `)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (statusError) {
      console.error('Error fetching status history:', statusError);
    } else {
      console.log('Status history fetched successfully:', statusHistory);
    }

    const customerWithDetails = {
      ...customer,
      leadSource: customer.lead_source,
      licenseType: customer.license_type,
      documents: documents || [],
      comments: comments || [],
      statusHistory: statusHistory || []
    };

    console.log('Customer with details and status history:', customerWithDetails);
    return customerWithDetails;
  }
}
