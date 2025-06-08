
import { supabase } from '@/lib/supabase';
import { Customer } from '@/types/customer';
import { googleDriveService } from '@/services/googleDriveService';

export class CustomerService {
  static async fetchCustomers(userId?: string) {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching customers:', error);
      throw error;
    }

    // Fetch documents for each customer
    const customersWithDocuments = await Promise.all(
      (data || []).map(async (customer) => {
        const { data: docsData } = await supabase
          .from('documents')
          .select('*')
          .eq('customer_id', customer.id);

        return {
          ...customer,
          leadSource: customer.lead_source,
          licenseType: customer.license_type,
          documents: docsData || []
        };
      })
    );

    return customersWithDocuments;
  }

  static async createCustomer(customer: Customer, userId: string) {
    // Create Google Drive folder first
    let driveFolderId: string | undefined;
    try {
      const folderName = `${customer.name} - ${customer.company}`;
      driveFolderId = await googleDriveService.createCustomerFolder(folderName);
      console.log('Google Drive folder created:', driveFolderId);
    } catch (driveError) {
      console.error('Google Drive folder creation failed:', driveError);
      // Continue without Drive folder - we'll handle this gracefully
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
      drive_folder_id: driveFolderId
    };

    const { data, error } = await supabase
      .from('customers')
      .insert(customerData)
      .select()
      .single();

    if (error) {
      console.error('Database insert error:', error);
      throw new Error('Failed to create customer in database');
    }

    console.log('Customer created in database:', data);
    
    if (!driveFolderId) {
      throw new Error('Google Drive folder creation failed');
    }

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
}
