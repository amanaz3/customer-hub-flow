import { supabase } from "@/integrations/supabase/client";
import { ServiceType, CustomerService } from "@/types/arr";

export const serviceManagementService = {
  async getAllServiceTypes(): Promise<ServiceType[]> {
    const { data, error } = await supabase
      .from('service_types')
      .select('*')
      .eq('is_active', true)
      .order('service_name');

    if (error) throw error;
    return (data || []) as ServiceType[];
  },

  async getCustomerServices(customerId: string): Promise<CustomerService[]> {
    const { data, error } = await supabase
      .from('customer_services')
      .select('*, service_type:service_types(*)')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as CustomerService[];
  },

  async addServiceToCustomer(
    customerId: string,
    serviceTypeId: string,
    startDate: string,
    assignedUserId: string
  ): Promise<CustomerService> {
    // Get service type to calculate ARR contribution
    const { data: serviceType, error: serviceError } = await supabase
      .from('service_types')
      .select('*')
      .eq('id', serviceTypeId)
      .single();

    if (serviceError) throw serviceError;

    const { data, error } = await supabase
      .from('customer_services')
      .insert({
        customer_id: customerId,
        service_type_id: serviceTypeId,
        start_date: startDate,
        assigned_user_id: assignedUserId,
        arr_contribution: serviceType.arr_value,
        status: 'active',
      })
      .select('*, service_type:service_types(*)')
      .single();

    if (error) throw error;
    return data as CustomerService;
  },

  async removeServiceFromCustomer(customerServiceId: string, endDate: string): Promise<void> {
    const { error } = await supabase
      .from('customer_services')
      .update({
        status: 'cancelled',
        end_date: endDate,
      })
      .eq('id', customerServiceId);

    if (error) throw error;
  },

  async calculateCustomerARR(customerId: string): Promise<number> {
    const { data, error } = await supabase
      .from('customer_services')
      .select('arr_contribution')
      .eq('customer_id', customerId)
      .eq('status', 'active');

    if (error) throw error;
    
    return data.reduce((sum, service) => sum + Number(service.arr_contribution), 0);
  },

  getServiceBundles(): Array<{ name: string; services: string[]; total_arr: number; description: string }> {
    return [
      {
        name: 'Full Package',
        services: ['BOOKKEEPING', 'VAT', 'CORP_TAX'],
        total_arr: 15250,
        description: 'Complete accounting solution',
      },
      {
        name: 'Basic Package',
        services: ['BOOKKEEPING', 'VAT'],
        total_arr: 14000,
        description: 'Essential bookkeeping and VAT',
      },
      {
        name: 'Compliance Only',
        services: ['VAT', 'CORP_TAX'],
        total_arr: 3250,
        description: 'Tax compliance services',
      },
    ];
  },
};
