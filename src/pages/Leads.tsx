import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Users,
  Plus,
  Search,
  Filter,
  Flame,
  ThermometerSun,
  Snowflake,
  Phone,
  Mail,
  Building2,
  Calendar,
  ArrowUpRight,
} from 'lucide-react';
import { useLeads } from '@/hooks/useLeads';
import { CreateLeadDialog } from '@/components/Lead/CreateLeadDialog';
import { DailyLeadCheckBanner } from '@/components/Lead/DailyLeadCheckBanner';
import { LeadReminderScheduleDialog } from '@/components/Lead/LeadReminderScheduleDialog';
import { LEAD_SCORE_COLORS, LEAD_STATUS_COLORS, type LeadScore, type LeadStatus } from '@/types/lead';
import { useAuth } from '@/contexts/SecureAuthContext';
import { format, formatDistanceToNow } from 'date-fns';

const scoreIcons: Record<LeadScore, React.ReactNode> = {
  hot: <Flame className="h-3 w-3" />,
  warm: <ThermometerSun className="h-3 w-3" />,
  cold: <Snowflake className="h-3 w-3" />,
};

export default function Leads() {
  const navigate = useNavigate();
  const { leads, loading } = useLeads();
  const { isAdmin } = useAuth();
  const [search, setSearch] = useState('');
  const [scoreFilter, setScoreFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchesSearch =
        lead.name.toLowerCase().includes(search.toLowerCase()) ||
        lead.email?.toLowerCase().includes(search.toLowerCase()) ||
        lead.company?.toLowerCase().includes(search.toLowerCase()) ||
        lead.mobile?.includes(search);

      const matchesScore = scoreFilter === 'all' || lead.score === scoreFilter;
      const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;

      return matchesSearch && matchesScore && matchesStatus;
    });
  }, [leads, search, scoreFilter, statusFilter]);

  const stats = useMemo(() => {
    const total = leads.length;
    const hot = leads.filter((l) => l.score === 'hot').length;
    const warm = leads.filter((l) => l.score === 'warm').length;
    const cold = leads.filter((l) => l.score === 'cold').length;
    const converted = leads.filter((l) => l.status === 'converted').length;
    const conversionRate = total > 0 ? ((converted / total) * 100).toFixed(1) : '0';

    return { total, hot, warm, cold, converted, conversionRate };
  }, [leads]);

  return (
    <>
      <div className="space-y-6 py-6">
        {/* Daily Lead Check Banner */}
        <DailyLeadCheckBanner 
          hotCount={stats.hot} 
          warmCount={stats.warm} 
          coldCount={stats.cold} 
        />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" />
              Leads
            </h1>
            <p className="text-muted-foreground text-sm">
              Capture, track, and convert all prospects efficiently
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && <LeadReminderScheduleDialog />}
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Lead
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-xs text-muted-foreground">Total Leads</div>
            </CardContent>
          </Card>
          <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-red-500" />
                <span className="text-2xl font-bold text-red-700">{stats.hot}</span>
              </div>
              <div className="text-xs text-muted-foreground">Hot Leads</div>
            </CardContent>
          </Card>
          <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <ThermometerSun className="h-4 w-4 text-amber-500" />
                <span className="text-2xl font-bold text-amber-700">{stats.warm}</span>
              </div>
              <div className="text-xs text-muted-foreground">Warm Leads</div>
            </CardContent>
          </Card>
          <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Snowflake className="h-4 w-4 text-blue-500" />
                <span className="text-2xl font-bold text-blue-700">{stats.cold}</span>
              </div>
              <div className="text-xs text-muted-foreground">Cold Leads</div>
            </CardContent>
          </Card>
          <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-700">{stats.conversionRate}%</div>
              <div className="text-xs text-muted-foreground">Conversion Rate</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, company, or phone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={scoreFilter} onValueChange={setScoreFilter}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Score" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Scores</SelectItem>
                  <SelectItem value="hot">Hot</SelectItem>
                  <SelectItem value="warm">Warm</SelectItem>
                  <SelectItem value="cold">Cold</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                  <SelectItem value="proposal">Proposal</SelectItem>
                  <SelectItem value="negotiation">Negotiation</SelectItem>
                  <SelectItem value="converted">Converted</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Leads Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">
              {filteredLeads.length} Lead{filteredLeads.length !== 1 ? 's' : ''}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : filteredLeads.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No leads found. Add your first lead to get started.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Lead</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Product Interest</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead>Next Follow-up</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLeads.map((lead) => (
                      <TableRow
                        key={lead.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/leads/${lead.id}`)}
                      >
                        <TableCell>
                          <div>
                            <div className="font-medium">{lead.name}</div>
                            {lead.company && (
                              <div className="text-xs text-muted-foreground flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                {lead.company}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {lead.email && (
                              <div className="text-xs flex items-center gap-1">
                                <Mail className="h-3 w-3 text-muted-foreground" />
                                {lead.email}
                              </div>
                            )}
                            {lead.mobile && (
                              <div className="text-xs flex items-center gap-1">
                                <Phone className="h-3 w-3 text-muted-foreground" />
                                {lead.mobile}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`${LEAD_SCORE_COLORS[lead.score]} flex items-center gap-1 w-fit`}
                          >
                            {scoreIcons[lead.score]}
                            <span className="capitalize">{lead.score}</span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`${LEAD_STATUS_COLORS[lead.status]} capitalize`}
                          >
                            {lead.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {lead.product_interest?.name || (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {lead.assigned_user?.name || (
                            <span className="text-muted-foreground">Unassigned</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {lead.next_follow_up ? (
                            <div className="flex items-center gap-1 text-xs">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(lead.next_follow_up), 'MMM d, yyyy')}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
                        </TableCell>
                        <TableCell>
                          <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <CreateLeadDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />
    </>
  );
}
