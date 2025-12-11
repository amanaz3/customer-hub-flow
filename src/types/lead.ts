export type LeadScore = 'hot' | 'warm' | 'cold';

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'converted' | 'lost';

export interface Lead {
  id: string;
  reference_number: number;
  name: string;
  email: string | null;
  mobile: string | null;
  company: string | null;
  source: string | null;
  score: LeadScore;
  status: LeadStatus;
  assigned_to: string | null;
  notes: string | null;
  product_interest_id: string | null;
  estimated_value: number | null;
  next_follow_up: string | null;
  last_contacted_at: string | null;
  converted_customer_id: string | null;
  converted_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  assigned_user?: {
    id: string;
    name: string;
    email: string;
  };
  product_interest?: {
    id: string;
    name: string;
  };
}

export interface LeadActivity {
  id: string;
  lead_id: string;
  activity_type: string;
  description: string | null;
  created_by: string | null;
  created_at: string;
  // Joined fields
  creator?: {
    id: string;
    name: string;
  };
}

export const LEAD_SCORE_COLORS: Record<LeadScore, string> = {
  hot: 'bg-red-500/20 text-red-700 border-red-300',
  warm: 'bg-amber-500/20 text-amber-700 border-amber-300',
  cold: 'bg-blue-500/20 text-blue-700 border-blue-300',
};

export const LEAD_STATUS_COLORS: Record<LeadStatus, string> = {
  new: 'bg-emerald-500/20 text-emerald-700 border-emerald-300',
  contacted: 'bg-blue-500/20 text-blue-700 border-blue-300',
  qualified: 'bg-purple-500/20 text-purple-700 border-purple-300',
  proposal: 'bg-amber-500/20 text-amber-700 border-amber-300',
  negotiation: 'bg-orange-500/20 text-orange-700 border-orange-300',
  converted: 'bg-green-500/20 text-green-700 border-green-300',
  lost: 'bg-gray-500/20 text-gray-700 border-gray-300',
};

export const ACTIVITY_TYPES = [
  { value: 'call', label: 'Phone Call', icon: 'Phone' },
  { value: 'whatsapp', label: 'WhatsApp', icon: 'MessageCircle' },
  { value: 'email', label: 'Email', icon: 'Mail' },
  { value: 'meeting', label: 'Meeting', icon: 'Users' },
  { value: 'note', label: 'Note', icon: 'FileText' },
] as const;

export const LEAD_SOURCES = [
  'Website',
  'Referral',
  'Social Media',
  'Cold Call',
  'Event',
  'Partner',
  'Advertisement',
  'Other',
] as const;
