import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Calendar, 
  FileSpreadsheet, 
  Users, 
  Target, 
  MoreVertical,
  Play,
  Pause,
  CheckCircle,
  MessageSquare
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LeadCampaign } from '@/hooks/useLeadCampaigns';

interface CampaignCardProps {
  campaign: LeadCampaign;
  onClick: () => void;
  onStatusChange: (status: 'active' | 'completed' | 'paused') => void;
  onGenerateOutreach: () => void;
}

export function CampaignCard({ 
  campaign, 
  onClick, 
  onStatusChange,
  onGenerateOutreach 
}: CampaignCardProps) {
  const progressPercent = campaign.lead_count > 0 
    ? Math.round((campaign.converted_count / campaign.lead_count) * 100) 
    : 0;

  const statusColors = {
    active: 'bg-emerald-500/20 text-emerald-700 border-emerald-300',
    completed: 'bg-blue-500/20 text-blue-700 border-blue-300',
    paused: 'bg-amber-500/20 text-amber-700 border-amber-300',
  };

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{campaign.name}</CardTitle>
            {campaign.description && (
              <p className="text-sm text-muted-foreground line-clamp-1">
                {campaign.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <Badge className={statusColors[campaign.status]}>
              {campaign.status}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {campaign.status !== 'active' && (
                  <DropdownMenuItem onClick={() => onStatusChange('active')}>
                    <Play className="h-4 w-4 mr-2" />
                    Set Active
                  </DropdownMenuItem>
                )}
                {campaign.status !== 'paused' && (
                  <DropdownMenuItem onClick={() => onStatusChange('paused')}>
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </DropdownMenuItem>
                )}
                {campaign.status !== 'completed' && (
                  <DropdownMenuItem onClick={() => onStatusChange('completed')}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark Complete
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={onGenerateOutreach}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Generate Outreach
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{campaign.assigned_user?.name || 'Unassigned'}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Target className="h-4 w-4" />
            <span>{campaign.lead_count} leads</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{format(new Date(campaign.start_date), 'MMM d, yyyy')}</span>
          </div>
          {campaign.excel_file_name && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <FileSpreadsheet className="h-4 w-4" />
              <span className="truncate">{campaign.excel_file_name}</span>
            </div>
          )}
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Conversion Progress</span>
            <span className="font-medium">{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {campaign.converted_count} of {campaign.lead_count} converted
          </p>
        </div>

        {campaign.expected_completion_date && (
          <div className="text-xs text-muted-foreground">
            Expected: {format(new Date(campaign.expected_completion_date), 'MMM d, yyyy')}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
