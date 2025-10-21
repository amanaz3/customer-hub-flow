// ARR Target Management Types

export interface ServiceType {
  id: string;
  service_name: string;
  service_code: string;
  frequency: 'monthly' | 'quarterly' | 'annual' | 'one-time';
  arr_value: number;
  unit_price: number;
  billing_period: 'month' | 'quarter' | 'year' | 'one-time';
  is_recurring: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CustomerService {
  id: string;
  customer_id: string;
  service_type_id: string;
  start_date: string;
  end_date?: string;
  status: 'active' | 'cancelled' | 'paused';
  arr_contribution: number;
  next_billing_date?: string;
  assigned_user_id?: string;
  created_at: string;
  updated_at: string;
  service_type?: ServiceType;
}

export interface ARRTarget {
  id: string;
  user_id: string;
  month: number;
  year: number;
  target_new_arr: number;
  target_upsell_arr: number;
  target_total_arr: number;
  target_new_clients: number;
  target_upsell_deals: number;
  target_meetings: number;
  target_checkins: number;
  target_proposals: number;
  target_closes: number;
  created_at: string;
  updated_at: string;
}

export interface ARRPerformance {
  actual_new_arr: number;
  actual_upsell_arr: number;
  actual_total_arr: number;
  new_clients_count: number;
  upsell_deals_count: number;
  pipeline_value: number;
  churn_arr: number;
}

export interface Deal {
  id: string;
  customer_id: string;
  deal_type: 'new_client' | 'upsell';
  deal_stage: 'prospect' | 'meeting_scheduled' | 'proposal_sent' | 'negotiation' | 'won' | 'lost';
  services: string[];
  arr_value: number;
  expected_close_date?: string;
  actual_close_date?: string;
  probability: number;
  assigned_user_id: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface WeeklyActivity {
  id: string;
  user_id: string;
  week_start_date: string;
  activity_type: 'meeting' | 'checkin' | 'proposal' | 'close';
  customer_id?: string;
  deal_id?: string;
  notes?: string;
  created_at: string;
}

export interface ARRProgress {
  newARRProgress: number;
  upsellARRProgress: number;
  totalARRProgress: number;
  newARRStatus: 'green' | 'yellow' | 'red' | 'gray';
  upsellARRStatus: 'green' | 'yellow' | 'red' | 'gray';
  totalARRStatus: 'green' | 'yellow' | 'red' | 'gray';
}

export interface ServiceBundle {
  name: string;
  services: string[];
  total_arr: number;
  description: string;
}
