
import { supabase } from '@/lib/supabase';
import { Customer } from '@/types/customer';
import { googleDriveService } from '@/services/googleDriveService';

export class CustomerService {
  static async fetchCustomers(userId?: string) {
    console.log('Fetching customers for user:', userId);
    
    // Fetch customers with proper RLS handling
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching customers:', error);
      throw error;
    }

    console.log('Raw customers data:', data);

    // Fetch documents for each customer
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
    
    // Create Google Drive folder first (optional)
    let driveFolderId: string | undefined;
    try {
      const folderName = `${customer.name} - ${customer.company}`;
      driveFolderId = await googleDriveService.createCustomerFolder(folderName);
      console.log('Google Drive folder created:', driveFolderId);
    } catch (driveError) {
      console.warn('Google Drive folder creation failed (continuing without it):', driveError);
      // Continue without Drive folder - this is optional
    }

    // Insert customer into database with proper type casting
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
      drive_folder_id: driveFolderId || null
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
    // Parse the Google Drive file info from filePath
    const fileInfo = JSON.parse(filePath);
    
    // Update document in database
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

    console.log('Document uploaded successfully:', fileInfo);
    return fileInfo;
  }

  // Add method to fetch customer by ID with documents
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

    // Fetch documents for this customer
    const { data: documents, error: docsError } = await supabase
      .from('documents')
      .select('*')
      .eq('customer_id', customerId);

    if (docsError) {
      console.error('Error fetching documents:', docsError);
      throw docsError;
    }

    // Fetch comments for this customer
    const { data: comments, error: commentsError } = await supabase
      .from('comments')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (commentsError) {
      console.error('Error fetching comments:', commentsError);
      // Don't throw, just log the error
    }

    // Fetch status changes for this customer
    const { data: statusHistory, error: statusError } = await supabase
      .from('status_changes')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (statusError) {
      console.error('Error fetching status history:', statusError);
      // Don't throw, just log the error
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
