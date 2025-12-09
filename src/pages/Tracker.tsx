import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  BarChart3, 
  Target,
  Building2,
  Settings2
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

  const trackerCards = [
    {
      title: "Ops",
      description: "Application tracking, team operations, pipeline monitoring, and AI insights",
      icon: Settings2,
      path: "/ops",
      color: "text-primary",
      featured: true
    },
    {
      title: "Strategic",
      description: "Strategic insights, growth opportunities, and business planning intelligence",
      icon: Target,
      path: "/strategic",
      color: "text-blue-600"
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tracker</h1>
        <p className="text-muted-foreground">
          Comprehensive application tracking and monitoring dashboard
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {trackerCards.map((card) => {
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
                      {card.featured && <Badge variant="secondary" className="text-xs">New</Badge>}
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

export default Tracker;
