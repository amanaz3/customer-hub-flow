import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart3, 
  Building2,
  Activity
} from "lucide-react";

const Strategic = () => {
  const navigate = useNavigate();

  const strategicCards = [
    {
      title: "360° AI View",
      description: "Comprehensive AI insights across all strategic dimensions",
      icon: Activity,
      path: "/360-degree",
      color: "text-primary"
    },
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
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Strategic</h1>
        <p className="text-muted-foreground">
          Strategic insights, customer intelligence, and growth analytics
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {strategicCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card
              key={card.path}
              className="cursor-pointer hover:shadow-lg transition-all hover:border-primary/50"
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
