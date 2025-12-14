import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowLeft, Search, Mail, Phone, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { LeadCampaign } from '@/hooks/useLeadCampaigns';
import { Lead, LEAD_SCORE_COLORS, LEAD_STATUS_COLORS } from '@/types/lead';

interface CampaignLeadsViewProps {
  campaign: LeadCampaign;
  onBack: () => void;
}

export function CampaignLeadsView({ campaign, onBack }: CampaignLeadsViewProps) {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchCampaignLeads = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('leads')
          .select(`
            *,
            assigned_user:profiles!leads_assigned_to_fkey(id, name, email),
            product_interest:products!leads_product_interest_id_fkey(id, name)
          `)
          .eq('campaign_id', campaign.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setLeads(data || []);
      } catch (error) {
        console.error('Error fetching campaign leads:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCampaignLeads();
  }, [campaign.id]);

  const filteredLeads = leads.filter(lead =>
    lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.company?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <CardTitle>{campaign.name}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {campaign.lead_count} leads • Assigned to {campaign.assigned_user?.name || 'Unassigned'}
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Outreach Template Preview */}
        {campaign.outreach_template && (
          <div className="p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium mb-2">Campaign Outreach Template</h4>
            <p className="text-sm text-muted-foreground">
              {campaign.outreach_template.email?.professional?.substring(0, 100)}...
            </p>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search leads..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Leads Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lead</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Contact</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map((lead) => (
                  <TableRow
                    key={lead.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/leads/${lead.id}`)}
                  >
                    <TableCell className="font-medium">{lead.name}</TableCell>
                    <TableCell>{lead.company || '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {lead.email && <Mail className="h-3 w-3 text-muted-foreground" />}
                        {lead.mobile && <Phone className="h-3 w-3 text-muted-foreground" />}
                      </div>
                    </TableCell>
                    <TableCell>
                      {lead.score && (
                        <Badge className={LEAD_SCORE_COLORS[lead.score]}>
                          {lead.score}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {lead.status && (
                        <Badge className={LEAD_STATUS_COLORS[lead.status]}>
                          {lead.status}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {lead.last_contacted_at 
                        ? format(new Date(lead.last_contacted_at), 'MMM d')
                        : '-'}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredLeads.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No leads found in this campaign
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
