import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ListTodo, RefreshCcw, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const DevManagement = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/manage')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Configure
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dev</h1>
          <p className="text-muted-foreground mt-1">
            Task management and development cycles
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card 
          className="hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => navigate('/task-settings')}
        >
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <ListTodo className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Tasks</CardTitle>
                <CardDescription>Manage task and project settings</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Configure task types, priorities, and project organization.
            </p>
          </CardContent>
        </Card>

        <Card 
          className="hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => navigate('/cycles')}
        >
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <RefreshCcw className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Cycles</CardTitle>
                <CardDescription>Manage development cycles</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Create and manage time-boxed development iterations.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DevManagement;
