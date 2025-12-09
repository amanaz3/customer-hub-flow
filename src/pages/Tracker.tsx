import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { 
  BarChart3, 
  Target,
  Settings2,
  Activity
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

  const featuredCard = {
    title: "360° AI View",
    description: "Get comprehensive AI-powered insights across Operations, Strategic Intelligence, and Analytics - your unified command center for data-driven decisions",
    icon: Activity,
    path: "/360-degree",
    color: "text-primary"
  };

  const trackerCards = [
    {
      title: "Ops",
      description: "Application tracking, team operations, pipeline monitoring",
      icon: Settings2,
      path: "/ops",
      color: "text-blue-600"
    },
    {
      title: "Strategic",
      description: "Customer segments, classification, and growth intelligence",
      icon: Target,
      path: "/strategic",
      color: "text-emerald-600"
    },
    {
      title: "Analysis",
      description: "RFM model, customer behavior analytics, and segmentation insights",
      icon: BarChart3,
      path: "/analysis",
      color: "text-amber-600"
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tracker</h1>
        <p className="text-muted-foreground">
          Comprehensive application tracking and monitoring dashboard
        </p>
      </div>

      {/* Featured 360° AI View Card */}
      <Card
        className="cursor-pointer hover:shadow-xl transition-all hover:border-primary/50 animate-fade-in border-2 border-primary/20 bg-gradient-to-r from-primary/5 via-purple-500/5 to-blue-500/5"
        onClick={() => navigate(featuredCard.path)}
      >
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 text-primary">
              <Activity className="h-8 w-8" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-2xl flex items-center gap-3">
                {featuredCard.title}
                <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">AI Powered</span>
              </CardTitle>
              <CardDescription className="text-sm mt-1">
                {featuredCard.description}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {trackerCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card
              key={card.path}
              className="cursor-pointer hover:shadow-lg transition-all hover:border-primary/50 animate-fade-in"
              onClick={() => navigate(card.path)}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg bg-muted ${card.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl">{card.title}</CardTitle>
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

export default Tracker;
