import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, RefreshCw, Sparkles } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

export function MonitorAIInsights() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["monitor-ai-insights"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("analyze-monitor-insights");

      if (error) {
        console.error("Error fetching AI insights:", error);
        throw error;
      }

      return data;
    },
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      toast.success("AI insights refreshed");
    } catch (error) {
      toast.error("Failed to refresh insights");
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <Card className="col-span-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="flex items-center gap-2">
                AI Insights
                <Sparkles className="h-4 w-4 text-yellow-500" />
              </CardTitle>
              <CardDescription>
                Real-time analysis and recommendations powered by AI
              </CardDescription>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex flex-col items-center gap-2">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Analyzing applications...</p>
            </div>
          </div>
        ) : data?.error ? (
          <div className="text-center py-8">
            <p className="text-sm text-red-500">{data.error}</p>
            <Button variant="outline" size="sm" onClick={handleRefresh} className="mt-4">
              Try Again
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown>{data?.insights || "No insights available"}</ReactMarkdown>
            </div>
            
            {data?.timestamp && (
              <div className="text-xs text-muted-foreground text-right">
                Last updated: {new Date(data.timestamp).toLocaleString()}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
