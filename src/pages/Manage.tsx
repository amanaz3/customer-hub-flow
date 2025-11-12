import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Users, MessageSquare, Target, Activity, ChevronDown, ChevronUp } from "lucide-react";
import NotificationManagement from "@/pages/NotificationManagement";

const Manage = () => {
  const navigate = useNavigate();
  const [messagesOpen, setMessagesOpen] = useState(false);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Manage</h1>
      </div>

      <div className="grid grid-cols-1 gap-6">
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

        <Collapsible open={messagesOpen} onOpenChange={setMessagesOpen}>
          <Card className="border-2 shadow-lg overflow-hidden col-span-full">
            <CardHeader className="pb-4 border-b bg-gradient-to-r from-blue-500/5 to-purple-500/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <MessageSquare className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Messages & Notifications</CardTitle>
                    <CardDescription className="text-sm mt-1">
                      Configure notification settings, email templates, and message preferences
                    </CardDescription>
                  </div>
                </div>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm">
                    {messagesOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </Button>
                </CollapsibleTrigger>
              </div>
            </CardHeader>
            <CollapsibleContent>
              <CardContent className="p-0">
                <NotificationManagement />
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

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
    </div>
  );
};

export default Manage;
