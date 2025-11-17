import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";

interface Application {
  id: string;
  status: string;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
}

interface TeamApplicationsHeatMapProps {
  applications: Application[];
  teamMembers: TeamMember[];
}

const statusOrder = [
  'draft',
  'submitted',
  'under_review',
  'need more info',
  'returned',
  'approved',
  'paid',
  'completed',
  'rejected'
];

const statusLabels: Record<string, string> = {
  draft: "Draft",
  submitted: "Submitted",
  "under_review": "Under Review",
  approved: "Approved",
  paid: "Paid",
  completed: "Completed",
  rejected: "Rejected",
  returned: "Returned",
  "need more info": "Need More Info",
};

export const TeamApplicationsHeatMap = ({ applications, teamMembers }: TeamApplicationsHeatMapProps) => {
  // Calculate heat map data
  const heatMapData = teamMembers.map(member => {
    const memberApps = applications.filter(app => app.user_id === member.id);
    const statusCounts: Record<string, number> = {};
    const stuckCounts: Record<string, number> = {};
    
    statusOrder.forEach(status => {
      const appsInStatus = memberApps.filter(app => app.status === status);
      statusCounts[status] = appsInStatus.length;
      
      // Count stuck applications (7+ days in status)
      stuckCounts[status] = appsInStatus.filter(app => {
        const daysSinceUpdate = Math.floor(
          (Date.now() - new Date(app.updated_at).getTime()) / (1000 * 60 * 60 * 24)
        );
        return daysSinceUpdate > 7 && !['completed', 'rejected', 'paid'].includes(status);
      }).length;
    });

    return {
      member,
      statusCounts,
      stuckCounts,
      total: memberApps.length,
    };
  });

  // Calculate max count for color intensity
  const maxCount = Math.max(
    ...heatMapData.flatMap(row => Object.values(row.statusCounts)),
    1
  );

  // Get color intensity based on count
  const getIntensity = (count: number) => {
    if (count === 0) return 0;
    return Math.max(0.2, count / maxCount);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Applications Heat Map</CardTitle>
        <CardDescription>
          Application distribution across team members and statuses
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-background border-r border-b p-3 text-left min-w-[150px]">
                  Team Member
                </th>
                {statusOrder.map(status => (
                  <th
                    key={status}
                    className="border-b p-3 text-center min-w-[100px] text-xs"
                  >
                    {statusLabels[status] || status}
                  </th>
                ))}
                <th className="border-b border-l p-3 text-center min-w-[80px] font-bold">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {heatMapData.map(({ member, statusCounts, stuckCounts, total }) => (
                <tr key={member.id} className="hover:bg-muted/50">
                  <td className="sticky left-0 z-10 bg-background border-r p-3 font-medium">
                    <div className="space-y-1">
                      <div className="text-sm">{member.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {member.email}
                      </div>
                    </div>
                  </td>
                  {statusOrder.map(status => {
                    const count = statusCounts[status] || 0;
                    const stuck = stuckCounts[status] || 0;
                    const intensity = getIntensity(count);

                    return (
                      <td
                        key={status}
                        className="border-b p-2 text-center"
                        style={{
                          backgroundColor: count > 0
                            ? `hsla(var(--primary), ${intensity})`
                            : 'transparent',
                        }}
                      >
                        {count > 0 && (
                          <div className="flex flex-col items-center gap-1">
                            <Badge
                              variant={intensity > 0.5 ? "default" : "secondary"}
                              className="text-xs font-bold"
                            >
                              {count}
                            </Badge>
                            {stuck > 0 && (
                              <div className="flex items-center gap-1 text-destructive">
                                <AlertTriangle className="h-3 w-3" />
                                <span className="text-xs font-semibold">{stuck}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    );
                  })}
                  <td className="border-b border-l p-3 text-center font-bold">
                    <Badge variant="outline" className="font-bold">
                      {total}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-muted/50 font-bold">
                <td className="sticky left-0 z-10 bg-muted/50 border-r border-t p-3">
                  Total by Status
                </td>
                {statusOrder.map(status => {
                  const total = heatMapData.reduce(
                    (sum, row) => sum + (row.statusCounts[status] || 0),
                    0
                  );
                  return (
                    <td key={status} className="border-t p-3 text-center">
                      <Badge variant="outline" className="font-bold">
                        {total}
                      </Badge>
                    </td>
                  );
                })}
                <td className="border-t border-l p-3 text-center font-bold">
                  <Badge className="font-bold">
                    {applications.length}
                  </Badge>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="mt-4 flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsla(var(--primary), 0.2)' }} />
            <span>Low</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsla(var(--primary), 0.6)' }} />
            <span>Medium</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsla(var(--primary), 1)' }} />
            <span>High</span>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <span>Stuck (7+ days)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
