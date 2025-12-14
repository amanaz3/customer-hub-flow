import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart3, 
  Building2,
  Activity,
  TrendingUp
} from "lucide-react";

const Strategic = () => {
  const navigate = useNavigate();

  const featuredCard = {
    title: "360° AI View",
    description: "Get comprehensive AI-powered insights across Customer Segments and Classification - your strategic intelligence command center",
    icon: Activity,
    path: "/360-degree",
    color: "text-primary"
  };

  const strategicCards = [
    {
      title: "Customer Segments",
      description: "Recurring revenue analysis and growth potential by customer segment",
      icon: BarChart3,
      path: "/customer-segments",
      color: "text-emerald-600"
    },
    {
      title: "Customer Classification",
      description: "Classify by industry, nationality, lead source with AI insights",
      icon: Building2,
      path: "/customer-classification",
      color: "text-pink-600"
    },
    {
      title: "Lead Analytics",
      description: "Lead conversion trends, pipeline forecasting, and performance metrics",
      icon: TrendingUp,
      path: "/leads",
      color: "text-amber-600"
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Strats</h1>
        <p className="text-muted-foreground">
          Strategic insights, customer intelligence, and growth analytics
        </p>
      </div>

      {/* Featured 360° AI View Card */}
      <Card
        className="cursor-pointer hover:shadow-xl transition-all hover:border-primary/50 animate-fade-in border-2 border-primary/20 bg-gradient-to-r from-primary/5 via-purple-500/5 to-emerald-500/5"
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {strategicCards.map((card) => {
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

export default Strategic;
