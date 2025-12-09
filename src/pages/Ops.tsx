import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { 
  Layers, 
  UserCheck, 
  Database, 
  BarChart3, 
  Activity, 
  Target,
  ArrowLeft
} from "lucide-react";

const Ops = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please log in to access this page");
        navigate('/');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role !== 'admin') {
        toast.error("Access denied. Admin privileges required.");
        navigate('/');
        return;
      }

      setIsAdmin(true);
    } catch (error) {
      console.error('Error checking admin status:', error);
      navigate('/');
    }
  };

  if (!isAdmin) {
    return null;
  }

  const opsCards = [
    {
      title: "360° AI View",
      description: "Comprehensive AI insights across all tracking dimensions",
      icon: Activity,
      path: "/360-degree",
      color: "text-primary",
      featured: true
    },
    {
      title: "By Stage",
      description: "View applications organized by their current stage",
      icon: Layers,
      path: "/applications-by-stage",
      color: "text-blue-600"
    },
    {
      title: "By Team",
      description: "View applications organized by team members with funnel and heat map",
      icon: UserCheck,
      path: "/applications-by-team",
      color: "text-green-600"
    },
    {
      title: "By Legacy",
      description: "View legacy applications with missing completion data",
      icon: Database,
      path: "/legacy-applications",
      color: "text-orange-600"
    },
    {
      title: "Application Pipeline",
      description: "Visual pipeline with AI recommendations and performance analytics",
      icon: BarChart3,
      path: "/application-pipeline",
      color: "text-purple-600"
    },
    {
      title: "Application Monitor",
      description: "Real-time monitoring of application status and alerts",
      icon: Activity,
      path: "/application-monitor",
      color: "text-red-600"
    },
    {
      title: "Team Targets",
      description: "Track and manage team targets and goals",
      icon: Target,
      path: "/team-targets",
      color: "text-teal-600"
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => navigate('/tracker')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Operations</h1>
          <p className="text-muted-foreground">
            Application tracking and team operations management
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {opsCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card
              key={card.path}
              className={`cursor-pointer hover:shadow-lg transition-all hover:border-primary/50 ${
                card.featured ? 'col-span-full border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-purple-500/5' : ''
              }`}
              onClick={() => navigate(card.path)}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg ${card.featured ? 'bg-gradient-to-br from-primary/20 to-purple-500/20' : 'bg-muted'} ${card.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-xl flex items-center gap-2">
                      {card.title}
                      {card.featured && <Badge variant="secondary" className="text-xs">AI</Badge>}
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm">
                  {card.description}
                </CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Ops;
