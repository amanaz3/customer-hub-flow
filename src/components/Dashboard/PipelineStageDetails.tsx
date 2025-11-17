import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LucideIcon } from "lucide-react";

interface Application {
  id: string;
  reference_number: number;
  status: string;
  created_at: string;
  customer?: {
    name: string;
    company: string;
  };
}

interface PipelineStageDetailsProps {
  applications: Application[];
  stageOrder: string[];
  stageLabels: Record<string, string>;
  stageIcons: Record<string, LucideIcon>;
}

export const PipelineStageDetails = ({ 
  applications, 
  stageOrder, 
  stageLabels, 
  stageIcons 
}: PipelineStageDetailsProps) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {stageOrder.map(status => {
        const stageApps = applications.filter(app => app.status === status);
        const Icon = stageIcons[status];
        
        // Calculate average days in stage
        const avgDays = stageApps.length > 0
          ? stageApps.reduce((sum, app) => {
              const days = Math.round(
                (new Date().getTime() - new Date(app.created_at).getTime()) / (1000 * 60 * 60 * 24)
              );
              return sum + days;
            }, 0) / stageApps.length
          : 0;

        return (
          <Card key={status}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Icon className="h-5 w-5" />
                  {stageLabels[status]}
                </CardTitle>
                <Badge variant="secondary">{stageApps.length}</Badge>
              </div>
              <CardDescription>
                Avg {Math.round(avgDays)} days in stage
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stageApps.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {stageApps.slice(0, 10).map(app => {
                    const daysInStage = Math.round(
                      (new Date().getTime() - new Date(app.created_at).getTime()) / (1000 * 60 * 60 * 24)
                    );
                    
                    return (
                      <div 
                        key={app.id} 
                        className="flex items-center justify-between p-2 rounded-md border hover:bg-muted/50 cursor-pointer"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            #{app.reference_number}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {app.customer?.name}
                          </p>
                        </div>
                        <Badge 
                          variant={
                            daysInStage > 14 ? 'destructive' :
                            daysInStage > 7 ? 'secondary' :
                            'outline'
                          }
                          className="ml-2"
                        >
                          {daysInStage}d
                        </Badge>
                      </div>
                    );
                  })}
                  {stageApps.length > 10 && (
                    <p className="text-xs text-center text-muted-foreground pt-2">
                      +{stageApps.length - 10} more applications
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No applications in this stage
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
