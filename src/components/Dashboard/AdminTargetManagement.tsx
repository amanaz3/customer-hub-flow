import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Target, TrendingUp, Calendar, Award } from "lucide-react";
import { PeriodSelector } from "./PeriodSelector";
import { TargetManagementTable } from "./TargetManagementTable";
import { BulkTargetDialog } from "./BulkTargetDialog";
import { useTargetManagement } from "@/hooks/useTargetManagement";

export const AdminTargetManagement = () => {
  const currentDate = new Date();
  const [periodType, setPeriodType] = useState<'monthly' | 'quarterly' | 'half-yearly' | 'annual'>('monthly');
  const [currentPeriod, setCurrentPeriod] = useState(() => {
    switch (periodType) {
      case 'monthly': return currentDate.getMonth() + 1;
      case 'quarterly': return Math.floor(currentDate.getMonth() / 3) + 1;
      case 'half-yearly': return currentDate.getMonth() < 6 ? 1 : 2;
      case 'annual': return 1;
    }
  });
  const [currentYear, setCurrentYear] = useState(currentDate.getFullYear());
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);

  const { data, isLoading, refetch } = useTargetManagement(periodType, currentPeriod, currentYear);

  const handlePeriodTypeChange = (newType: 'monthly' | 'quarterly' | 'half-yearly' | 'annual') => {
    setPeriodType(newType);
    // Reset period based on type
    switch (newType) {
      case 'monthly':
        setCurrentPeriod(currentDate.getMonth() + 1);
        break;
      case 'quarterly':
        setCurrentPeriod(Math.floor(currentDate.getMonth() / 3) + 1);
        break;
      case 'half-yearly':
        setCurrentPeriod(currentDate.getMonth() < 6 ? 1 : 2);
        break;
      case 'annual':
        setCurrentPeriod(1);
        break;
    }
  };

  const selectedUserNames = data
    .filter(user => selectedUserIds.includes(user.user_id))
    .map(user => user.user_name);

  const totals = data.reduce(
    (acc, user) => ({
      target_applications: acc.target_applications + user.target_applications,
      target_revenue: acc.target_revenue + user.target_revenue,
      actual_applications: acc.actual_applications + user.actual_applications,
      actual_revenue: acc.actual_revenue + user.actual_revenue,
    }),
    { target_applications: 0, target_revenue: 0, actual_applications: 0, actual_revenue: 0 }
  );

  const teamProgress = totals.target_applications > 0
    ? (totals.actual_applications / totals.target_applications) * 100
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Target Management</h2>
          <p className="text-muted-foreground">
            Manage and track team targets across different time periods
          </p>
        </div>
        <PeriodSelector
          periodType={periodType}
          currentPeriod={currentPeriod}
          currentYear={currentYear}
          onPeriodChange={setCurrentPeriod}
          onYearChange={setCurrentYear}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Target Applications</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.target_applications}</div>
            <p className="text-xs text-muted-foreground">
              {totals.actual_applications} actual
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Target Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('en-AE', {
                style: 'currency',
                currency: 'AED',
                minimumFractionDigits: 0,
              }).format(totals.target_revenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              {new Intl.NumberFormat('en-AE', {
                style: 'currency',
                currency: 'AED',
                minimumFractionDigits: 0,
              }).format(totals.actual_revenue)} actual
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Progress</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamProgress.toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground">
              Overall achievement
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.length}</div>
            <p className="text-xs text-muted-foreground">
              Team members
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={periodType} onValueChange={(value) => handlePeriodTypeChange(value as any)}>
        <TabsList className="grid w-full grid-cols-4 max-w-2xl">
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="quarterly">Quarterly</TabsTrigger>
          <TabsTrigger value="half-yearly">Half-Yearly</TabsTrigger>
          <TabsTrigger value="annual">Annual</TabsTrigger>
        </TabsList>

        <TabsContent value={periodType} className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>
                    {periodType === 'monthly' && 'Monthly'} 
                    {periodType === 'quarterly' && 'Quarterly'} 
                    {periodType === 'half-yearly' && 'Half-Yearly'} 
                    {periodType === 'annual' && 'Annual'} Targets
                  </CardTitle>
                  <CardDescription>
                    View and manage individual user targets and performance
                  </CardDescription>
                </div>
                <Button
                  onClick={() => setBulkDialogOpen(true)}
                  disabled={selectedUserIds.length === 0 || periodType !== 'monthly'}
                >
                  Set Targets ({selectedUserIds.length})
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading...</div>
              ) : (
                <TargetManagementTable
                  data={data}
                  period={periodType}
                  periodValue={currentPeriod}
                  year={currentYear}
                  onRefresh={refetch}
                  selectedUserIds={selectedUserIds}
                  onSelectionChange={setSelectedUserIds}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {periodType === 'monthly' && (
        <BulkTargetDialog
          open={bulkDialogOpen}
          onOpenChange={setBulkDialogOpen}
          selectedUserIds={selectedUserIds}
          selectedUserNames={selectedUserNames}
          month={currentPeriod}
          year={currentYear}
          onSuccess={() => {
            refetch();
            setSelectedUserIds([]);
          }}
        />
      )}
    </div>
  );
};
