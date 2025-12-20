import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, User, Users, Building2, Megaphone, ChevronRight, Server } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Configure1() {
  const navigate = useNavigate();

  const cards = [
    {
      title: "User",
      description: "User configuration settings",
      icon: User,
      path: "/configure-1/user",
    },
    {
      title: "Customer",
      description: "Customer configuration settings",
      icon: Users,
      path: "/configure-1/customer",
    },
    {
      title: "Business",
      description: "Business configuration settings",
      icon: Building2,
      path: "/configure-1/business",
    },
    {
      title: "Sales & Marketing",
      description: "Sales and marketing configuration settings",
      icon: Megaphone,
      path: "/configure-1/sales-marketing",
    },
    {
      title: "Platform & Infra",
      description: "Platform and infrastructure settings",
      icon: Server,
      path: "/configure-1/platform-infra",
    },
  ];

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="w-8 h-8" />
          Configure
        </h1>
        <p className="text-muted-foreground mt-2">
          Configuration options
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <Card
            key={card.title}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate(card.path)}
          >
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <card.icon className="h-5 w-5 text-primary" />
                  </div>
                  <span>{card.title}</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{card.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
