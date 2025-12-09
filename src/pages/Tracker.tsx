import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Layers, 
  UserCheck, 
  Database, 
  BarChart3, 
  Activity, 
  Target,
  Building2
} from "lucide-react";

const Tracker = () => {
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

  const statsCards = [
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
      title: "By Services",
      description: "View applications organized by service type",
      icon: Layers,
      path: "/applications-by-services",
      color: "text-indigo-600"
    },
    {
      title: "Team Targets",
      description: "Track and manage team targets and goals",
      icon: Target,
      path: "/team-targets",
      color: "text-teal-600"
    }
  ];

  const opsCards = [
    {
      title: "Application Monitor",
      description: "Real-time monitoring of application status and alerts",
      icon: Activity,
      path: "/application-monitor",
      color: "text-red-600"
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
    }
  ];

  const analysisCards = [
    {
      title: "360° AI View",
      description: "Comprehensive AI insights across all tracking dimensions",
      icon: Activity,
      path: "/360-degree",
      color: "text-primary",
      featured: true
    },
    {
      title: "Customer Segments",
      description: "Recurring revenue analysis and growth potential by customer segment",
      icon: BarChart3,
      path: "/customer-segments",
      color: "text-emerald-600"
    },
    {
      title: "RFM Model",
      description: "Industry-standard RFM (Recency, Frequency, Monetary) customer segmentation",
      icon: Target,
      path: "/rfm-analysis",
      color: "text-amber-600"
    },
    {
      title: "Customer Classification",
      description: "Classify by industry, nationality, lead source with AI insights",
      icon: Building2,
      path: "/customer-classification",
      color: "text-pink-600"
    }
  ];

  const renderCard = (card: any) => {
    const Icon = card.icon;
    return (
      <Card
        key={card.path}
        className={`cursor-pointer hover:shadow-lg transition-all hover:border-primary/50 ${
          card.featured ? 'border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-purple-500/5' : ''
        }`}
        onClick={() => navigate(card.path)}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-lg ${card.featured ? 'bg-gradient-to-br from-primary/20 to-purple-500/20' : 'bg-muted'} ${card.color}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg flex items-center gap-2">
                {card.title}
                {card.featured && <Badge variant="secondary" className="text-xs">AI</Badge>}
              </CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <CardDescription className="text-sm">
            {card.description}
          </CardDescription>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tracker</h1>
        <p className="text-muted-foreground">
          Comprehensive application tracking and monitoring dashboard
        </p>
      </div>

      <div className="space-y-8">
        {/* Stats Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <BarChart3 className="h-5 w-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold">Stats</h2>
            <Badge variant="outline" className="ml-2">{statsCards.length}</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {statsCards.map(renderCard)}
          </div>
        </div>

        {/* Ops Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-orange-500/10">
              <Activity className="h-5 w-5 text-orange-600" />
            </div>
            <h2 className="text-xl font-semibold">Ops</h2>
            <Badge variant="outline" className="ml-2">{opsCards.length}</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {opsCards.map(renderCard)}
          </div>
        </div>

        {/* Analysis Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Target className="h-5 w-5 text-purple-600" />
            </div>
            <h2 className="text-xl font-semibold">Analysis</h2>
            <Badge variant="outline" className="ml-2">{analysisCards.length}</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {analysisCards.map(renderCard)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tracker;
