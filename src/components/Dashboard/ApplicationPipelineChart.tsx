import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

interface PipelineData {
  status: string;
  count: number;
}

interface ApplicationPipelineChartProps {
  data: PipelineData[];
}

export const ApplicationPipelineChart = ({ data }: ApplicationPipelineChartProps) => {
  const maxCount = Math.max(...data.map(d => d.count), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pipeline Flow Visualization</CardTitle>
        <CardDescription>Applications moving through each stage</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between gap-2">
          {data.map((stage, index) => {
            const widthPercentage = (stage.count / maxCount) * 100;
            const isLast = index === data.length - 1;

            return (
              <div key={stage.status} className="flex items-center flex-1">
                <div className="flex-1 space-y-2">
                  <div className="text-center">
                    <p className="text-sm font-medium">{stage.status}</p>
                    <p className="text-2xl font-bold">{stage.count}</p>
                  </div>
                  <div className="relative h-24 bg-muted rounded-lg overflow-hidden">
                    <div
                      className="absolute bottom-0 left-0 right-0 bg-primary transition-all duration-500"
                      style={{ height: `${widthPercentage}%` }}
                    />
                  </div>
                </div>
                {!isLast && (
                  <ArrowRight className="mx-2 h-6 w-6 text-muted-foreground flex-shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
