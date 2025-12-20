import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, ArrowLeft, UserCog, MessageSquare, BookOpen, KeyRound, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function Configure1User() {
  const navigate = useNavigate();

  const items = [
    {
      title: "User Management",
      description: "Manage users, roles and permissions",
      icon: UserCog,
      path: "/users",
    },
    {
      title: "Messages",
      description: "Notification settings and preferences",
      icon: MessageSquare,
      path: "/messages",
    },
    {
      title: "Help Editor",
      description: "Manage help content and documentation",
      icon: BookOpen,
      path: "/admin/help-editor",
    },
    {
      title: "Access Management",
      description: "Granular page and feature access control",
      icon: KeyRound,
      path: "/access-management",
    },
  ];

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/configure-1')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Configure 1
        </Button>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <User className="w-8 h-8" />
          User Configuration
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage user configuration settings
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((item) => (
          <Card
            key={item.title}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate(item.path)}
          >
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-base">{item.title}</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
