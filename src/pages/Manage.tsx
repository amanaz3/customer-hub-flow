import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Users, MessageSquare, Target, Activity, ChevronDown, ChevronUp } from "lucide-react";
import NotificationManagement from "./NotificationManagement";

const Manage = () => {
  const navigate = useNavigate();
  const [messagesOpen, setMessagesOpen] = useState(false);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Manage</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card 
          className="hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => navigate('/customer-services')}
        >
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Customer Services</CardTitle>
                <CardDescription>Manage customer services and products</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Configure and manage customer services, service types, and ARR tracking.
            </p>
          </CardContent>
        </Card>

        <Collapsible open={messagesOpen} onOpenChange={setMessagesOpen} className="md:col-span-2">
          <Card className="hover:shadow-lg transition-shadow">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <MessageSquare className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle>Messages</CardTitle>
                      <CardDescription>Manage notification settings and message preferences</CardDescription>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    {messagesOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <NotificationManagement />
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Target</CardTitle>
                <CardDescription>Manage targets and goals</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Set and track monthly, quarterly, and annual targets for teams and individuals.
            </p>
          </CardContent>
        </Card>

        <Card 
          className="hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => navigate('/team')}
        >
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Activity className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Tracking</CardTitle>
                <CardDescription>Task assignment and activity tracking</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Assign tasks, track user activities, and monitor team performance metrics.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Manage;
