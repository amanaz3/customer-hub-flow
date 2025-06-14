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

    const customersWithDocuments = await Promise.all(
      (data || []).map(async (customer) => {
        const { data: docsData, error: docsError } = await supabase
          .from('documents')
          .select('*')
          .eq('customer_id', customer.id);

        if (docsError) {
          console.error('Error fetching documents for customer:', customer.id, docsError);
        }

        return {
          ...customer,
          leadSource: customer.lead_source,
          licenseType: customer.license_type,
          documents: docsData || []
        };
      })
    );

    console.log('Customers with documents:', customersWithDocuments);
    return customersWithDocuments;
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
      drive_folder_id: null // No longer using Google Drive
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
    return data;
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

    // Add status change to history - using the correct property names from the database schema
    const { error: statusError } = await supabase
      .from('status_changes')
      .insert({
        customer_id: customerId,
        previous_status: previousStatus as "Draft" | "Submitted" | "Returned" | "Sent to Bank" | "Complete" | "Rejected" | "Need More Info" | "Paid",
        new_status: status as "Draft" | "Submitted" | "Returned" | "Sent to Bank" | "Complete" | "Rejected" | "Need More Info" | "Paid",
        changed_by: changedBy,
        changed_by_role: role as "admin" | "user",
        comment: comment || null,
        created_at: new Date().toISOString()
      });

    if (statusError) {
      console.error('Error adding status change to history:', statusError);
      throw statusError;
    }

    console.log('Customer status updated successfully in database');
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

    const { data: statusHistory, error: statusError } = await supabase
      .from('status_changes')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (statusError) {
      console.error('Error fetching status history:', statusError);
    }

    const customerWithDetails = {
      ...customer,
      leadSource: customer.lead_source,
      licenseType: customer.license_type,
      documents: documents || [],
      comments: comments || [],
      statusHistory: statusHistory || []
    };

    console.log('Customer with details:', customerWithDetails);
    return customerWithDetails;
  }
}
