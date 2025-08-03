import { supabase } from '@/lib/supabase';
import { Customer } from '@/types/customer';

export class OptimizedCustomerService {
  private static cache: Map<string, { data: any; timestamp: number }> = new Map();
  private static readonly CACHE_DURATION = 60000; // 1 minute cache

  // Check if cached data is still valid
  private static isCacheValid(cacheKey: string): boolean {
    const cached = this.cache.get(cacheKey);
    if (!cached) return false;
    return Date.now() - cached.timestamp < this.CACHE_DURATION;
  }

  // Get cached data if valid
  private static getCachedData(cacheKey: string): any | null {
    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey)?.data || null;
    }
    return null;
  }

  // Set cache data
  private static setCacheData(cacheKey: string, data: any): void {
    this.cache.set(cacheKey, { data, timestamp: Date.now() });
  }

  // Clear cache for specific keys or all
  static clearCache(cacheKey?: string): void {
    if (cacheKey) {
      this.cache.delete(cacheKey);
    } else {
      this.cache.clear();
    }
  }

  // Optimized fetch with pagination and caching
  static async fetchCustomersPaginated(
    page: number = 1,
    pageSize: number = 50,
    userId?: string,
    includeDetails: boolean = false
  ) {
    const cacheKey = `customers_${page}_${pageSize}_${userId}_${includeDetails}`;
    
    // Try cache first
    const cached = this.getCachedData(cacheKey);
    if (cached) {
      console.log('Returning cached customer data');
      return cached;
    }

    console.log('Fetching customers with pagination:', { page, pageSize, userId, includeDetails });
    
    const offset = (page - 1) * pageSize;
    
    let query = supabase
      .from('customers')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    // Apply user filter if not admin
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: customers, error, count } = await query;

    if (error) {
      console.error('Error fetching customers:', error);
      throw error;
    }

    let result;

    if (includeDetails && customers && customers.length > 0) {
      // Fetch related data only if needed
      const customerIds = customers.map(c => c.id);
      
      // Batch fetch related data
      const [documentsRes, statusHistoryRes, commentsRes] = await Promise.all([
        supabase
          .from('documents')
          .select('*')
          .in('customer_id', customerIds),
        supabase
          .from('status_changes')
          .select('*')
          .in('customer_id', customerIds)
          .order('created_at', { ascending: false }),
        supabase
          .from('comments')
          .select('*')
          .in('customer_id', customerIds)
          .order('created_at', { ascending: false })
      ]);

      // Group related data by customer_id
      const documentsByCustomer = (documentsRes.data || []).reduce((acc, doc) => {
        if (!acc[doc.customer_id]) acc[doc.customer_id] = [];
        acc[doc.customer_id].push(doc);
        return acc;
      }, {} as Record<string, any[]>);

      const statusHistoryByCustomer = (statusHistoryRes.data || []).reduce((acc, status) => {
        if (!acc[status.customer_id]) acc[status.customer_id] = [];
        acc[status.customer_id].push(status);
        return acc;
      }, {} as Record<string, any[]>);

      const commentsByCustomer = (commentsRes.data || []).reduce((acc, comment) => {
        if (!acc[comment.customer_id]) acc[comment.customer_id] = [];
        acc[comment.customer_id].push(comment);
        return acc;
      }, {} as Record<string, any[]>);

      // Combine data
      const customersWithDetails = customers.map(customer => ({
        ...customer,
        leadSource: customer.lead_source,
        licenseType: customer.license_type,
        documents: documentsByCustomer[customer.id] || [],
        statusHistory: statusHistoryByCustomer[customer.id] || [],
        comments: (commentsByCustomer[customer.id] || []).map(comment => ({
          id: comment.id,
          customer_id: comment.customer_id,
          content: comment.comment,
          author: comment.created_by,
          timestamp: comment.created_at || new Date().toISOString()
        }))
      }));

      result = {
        customers: customersWithDetails,
        totalCount: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize)
      };
    } else {
      // Return basic customer data only
      const basicCustomers = (customers || []).map(customer => ({
        ...customer,
        leadSource: customer.lead_source,
        licenseType: customer.license_type,
        documents: [],
        statusHistory: [],
        comments: []
      }));

      result = {
        customers: basicCustomers,
        totalCount: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize)
      };
    }

    // Cache the result
    this.setCacheData(cacheKey, result);
    
    console.log('Fetched customers with pagination:', result);
    return result;
  }

  // Fetch dashboard stats efficiently
  static async fetchDashboardStats(userId?: string) {
    const cacheKey = `dashboard_stats_${userId}`;
    
    // Try cache first
    const cached = this.getCachedData(cacheKey);
    if (cached) {
      console.log('Returning cached dashboard stats');
      return cached;
    }

    console.log('Fetching dashboard stats for user:', userId);
    
    let query = supabase.from('customers').select('status, amount, created_at, updated_at');
    
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: customers, error } = await query;

    if (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }

    // Calculate stats
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    const isCurrentMonth = (customer: any) => {
      const customerDate = new Date(customer.updated_at || customer.created_at || '');
      const customerMonth = customerDate.getMonth() + 1;
      const customerYear = customerDate.getFullYear();
      return customerMonth === currentMonth && customerYear === currentYear;
    };

    const stats = {
      totalCustomers: (customers || []).filter(c => c.status === 'Draft').length,
      completedApplications: (customers || []).filter(c => 
        (c.status === 'Complete' || c.status === 'Paid') && isCurrentMonth(c)
      ).length,
      submittedApplications: (customers || []).filter(c => 
        !['Draft', 'Complete', 'Paid', 'Rejected'].includes(c.status)
      ).length,
      totalRevenue: (customers || [])
        .filter(c => c.status === 'Complete' || c.status === 'Paid')
        .reduce((sum, c) => sum + (c.amount || 0), 0)
    };

    // Cache the result
    this.setCacheData(cacheKey, stats);
    
    console.log('Dashboard stats calculated:', stats);
    return stats;
  }

  // Optimized customer creation with minimal data fetching
  static async createCustomer(customer: Customer, userId: string) {
    console.log('Creating customer with optimized service:', customer);
    
    // Clear related cache
    this.clearCache();
    
    // Use original service for creation (it's already optimized)
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
    };

    const { data, error } = await supabase
      .from('customers')
      .insert(customerData)
      .select()
      .single();

    if (error) {
      console.error('Database insert error:', error);
      throw new Error(`Failed to create customer in database: ${error.message}`);
    }

    // Create default documents in background (don't wait)
    this.createDefaultDocumentsAsync(data.id, customer.licenseType);

    return data;
  }

  // Async document creation to not block UI
  private static async createDefaultDocumentsAsync(customerId: string, licenseType: string) {
    try {
      // Create default documents manually since we don't have the RPC function
      const defaultDocuments = [
        // Mandatory documents for all license types
        { name: 'Passport Copy', is_mandatory: true, category: 'mandatory' },
        { name: 'Emirates ID Copy', is_mandatory: true, category: 'mandatory' },
        { name: 'Trade License Copy', is_mandatory: true, category: 'mandatory' },
        { name: 'Memorandum of Association (MOA)', is_mandatory: true, category: 'mandatory' },
        { name: 'Bank Statements (Last 6 months)', is_mandatory: true, category: 'mandatory' },
      ];

      // Add Freezone-specific documents if applicable
      if (licenseType === 'Freezone') {
        defaultDocuments.push(
          { name: 'Freezone License Copy', is_mandatory: true, category: 'freezone' },
          { name: 'Lease Agreement (Freezone)', is_mandatory: true, category: 'freezone' },
        );
      }

      const documentsToInsert = defaultDocuments.map(doc => ({
        customer_id: customerId,
        name: doc.name,
        is_mandatory: doc.is_mandatory,
        category: doc.category as "mandatory" | "freezone" | "supporting" | "signatory",
        requires_license_type: licenseType === 'Freezone' && doc.category === 'freezone' ? licenseType as "Mainland" | "Freezone" | "Offshore" : null,
        is_uploaded: false,
        file_path: null
      }));

      await supabase.from('documents').insert(documentsToInsert);
    } catch (error) {
      console.error('Error creating default documents async:', error);
      // Don't throw - this is a background operation
    }
  }

  // Optimized single customer fetch
  static async fetchCustomerById(customerId: string) {
    const cacheKey = `customer_${customerId}`;
    
    // Try cache first
    const cached = this.getCachedData(cacheKey);
    if (cached) {
      console.log('Returning cached customer details');
      return cached;
    }

    console.log('Fetching customer by ID:', customerId);
    
    // Fetch customer and related data in parallel
    const [customerRes, documentsRes, commentsRes, statusHistoryRes] = await Promise.all([
      supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .single(),
      supabase
        .from('documents')
        .select('*')
        .eq('customer_id', customerId),
      supabase
        .from('comments')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false }),
      supabase
        .from('status_changes')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
    ]);

    if (customerRes.error) {
      throw customerRes.error;
    }

    const result = {
      ...customerRes.data,
      leadSource: customerRes.data.lead_source,
      licenseType: customerRes.data.license_type,
      documents: documentsRes.data || [],
      comments: (commentsRes.data || []).map(comment => ({
        id: comment.id,
        customer_id: comment.customer_id,
        content: comment.comment,
        author: comment.created_by,
        timestamp: comment.created_at || new Date().toISOString()
      })),
      statusHistory: statusHistoryRes.data || []
    };

    // Cache the result
    this.setCacheData(cacheKey, result);
    
    return result;
  }

  // Update customer with cache invalidation and transaction support
  static async updateCustomer(customerId: string, updates: Partial<Customer>) {
    console.log('Updating customer with optimized service:', customerId, updates);
    
    // Get current data for rollback if needed
    const currentData = await this.fetchCustomerById(customerId);
    
    // Clear related cache
    this.clearCache(`customer_${customerId}`);
    this.clearCache(); // Clear all pagination cache
    
    // Map frontend field names to database column names
    const updateData: any = {};
    
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.email !== undefined) updateData.email = updates.email;
    if (updates.mobile !== undefined) updateData.mobile = updates.mobile;
    if (updates.company !== undefined) updateData.company = updates.company;
    if (updates.leadSource !== undefined) updateData.lead_source = updates.leadSource;
    if (updates.licenseType !== undefined) updateData.license_type = updates.licenseType;
    if (updates.amount !== undefined) updateData.amount = updates.amount;
    if (updates.preferred_bank !== undefined) updateData.preferred_bank = updates.preferred_bank;
    if (updates.annual_turnover !== undefined) updateData.annual_turnover = updates.annual_turnover;
    if (updates.jurisdiction !== undefined) updateData.jurisdiction = updates.jurisdiction;
    if (updates.customer_notes !== undefined) updateData.customer_notes = updates.customer_notes;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.user_id !== undefined) updateData.user_id = updates.user_id;
    
    // Always update the updated_at timestamp
    updateData.updated_at = new Date().toISOString();

    try {
      const { data, error } = await supabase
        .from('customers')
        .update(updateData)
        .eq('id', customerId)
        .select()
        .single();

      if (error) {
        console.error('Error updating customer:', error);
        throw error;
      }

      // Validate the update was successful
      if (!data) {
        throw new Error('Update operation did not return data');
      }

      return data;
    } catch (error) {
      // On error, restore cache with current data to maintain consistency
      this.setCacheData(`customer_${customerId}`, currentData);
      throw error;
    }
  }

  // Bulk reassignment method
  static async reassignCustomers(
    customerIds: string[], 
    newUserId: string, 
    reason: string, 
    adminId: string
  ) {
    console.log('Bulk reassigning customers:', { customerIds, newUserId, reason, adminId });
    
    // Clear all related cache
    this.clearCache();
    
    try {
      // Get current customer data for status logging
      const { data: customers, error: fetchError } = await supabase
        .from('customers')
        .select('id, user_id, name')
        .in('id', customerIds);

      if (fetchError) throw fetchError;

      // Update all customers with new user_id
      const { error: updateError } = await supabase
        .from('customers')
        .update({ 
          user_id: newUserId,
          updated_at: new Date().toISOString()
        })
        .in('id', customerIds);

      if (updateError) throw updateError;

      // Create status change entries for audit trail
      const statusChangeEntries = (customers || []).map(customer => ({
        customer_id: customer.id,
        previous_status: 'Draft' as const, // Keep same status, just track reassignment
        new_status: 'Draft' as const,
        changed_by: adminId,
        changed_by_role: 'admin' as const,
        comment: `Application reassigned from user ${customer.user_id || 'unassigned'} to user ${newUserId}. Reason: ${reason}`,
        created_at: new Date().toISOString()
      }));

      if (statusChangeEntries.length > 0) {
        const { error: statusError } = await supabase
          .from('status_changes')
          .insert(statusChangeEntries);

        if (statusError) {
          console.error('Error logging status changes:', statusError);
          // Don't throw - reassignment was successful, logging is secondary
        }
      }

      console.log(`Successfully reassigned ${customerIds.length} customers to user ${newUserId}`);
      return { success: true, count: customerIds.length };

    } catch (error) {
      console.error('Error in bulk reassignment:', error);
      throw error;
    }
  }
}