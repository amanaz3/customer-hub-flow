import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, MessageSquare, Shield, Wrench, BookOpen, ListTodo, RefreshCcw, UserCog, Code } from "lucide-react";

const Manage = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Configure</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Configuration Card */}
        <Card className="border-2">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <UserCog className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>User</CardTitle>
                <CardDescription>User and business configuration</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div 
              className="p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors flex items-center gap-3"
              onClick={() => navigate('/users')}
            >
              <Shield className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">User Management</p>
                <p className="text-xs text-muted-foreground">Manage users and permissions</p>
              </div>
            </div>
            <div 
              className="p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors flex items-center gap-3"
              onClick={() => navigate('/customer-services')}
            >
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">Customer Services</p>
                <p className="text-xs text-muted-foreground">Manage customer services and products</p>
              </div>
            </div>
            <div 
              className="p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors flex items-center gap-3"
              onClick={() => navigate('/messages')}
            >
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">Messages</p>
                <p className="text-xs text-muted-foreground">Notification settings and preferences</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dev Configuration Card */}
        <Card className="border-2">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Code className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Dev</CardTitle>
                <CardDescription>Developer and admin tools</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div 
              className="p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors flex items-center gap-3"
              onClick={() => navigate('/dev-tools')}
            >
              <Wrench className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">Admin Tools</p>
                <p className="text-xs text-muted-foreground">Developer and admin testing tools</p>
              </div>
            </div>
            <div 
              className="p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors flex items-center gap-3"
              onClick={() => navigate('/admin/help-editor')}
            >
              <BookOpen className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">Help Editor</p>
                <p className="text-xs text-muted-foreground">Manage help content and documentation</p>
              </div>
            </div>
            <div 
              className="p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors flex items-center gap-3"
              onClick={() => navigate('/task-settings')}
            >
              <ListTodo className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">Tasks</p>
                <p className="text-xs text-muted-foreground">Manage task and project settings</p>
              </div>
            </div>
            <div 
              className="p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors flex items-center gap-3"
              onClick={() => navigate('/cycles')}
            >
              <RefreshCcw className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">Cycles</p>
                <p className="text-xs text-muted-foreground">Manage development cycles</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Manage;
