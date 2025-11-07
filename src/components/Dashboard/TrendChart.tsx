import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { MonthData } from "@/services/comparisonService";
import { format } from "date-fns";
import { BarChart3, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TrendChartProps {
  data: MonthData[];
}

export const TrendChart = ({ data }: TrendChartProps) => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  
  const chartData = data.map((month) => ({
    name: format(new Date(month.year, month.month - 1, 1), "MMM yy"),
    Applications: month.applications,
    Completed: month.completed,
    Revenue: Number((month.revenue / 1000).toFixed(2)), // Convert to thousands for better chart scale
    "Completion %": Number(month.completionRate.toFixed(2)),
  }));

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              6-Month Trend Analysis
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Track your performance trends over the last 6 months
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      {!isCollapsed && (
        <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="name"
              className="text-xs"
              stroke="hsl(var(--muted-foreground))"
            />
            <YAxis
              className="text-xs"
              stroke="hsl(var(--muted-foreground))"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "6px",
              }}
              formatter={(value: number, name: string) => {
                if (name === "Revenue") {
                  return [`AED ${(value * 1000).toLocaleString()}`, name];
                }
                if (name === "Completion %") {
                  return [`${value}%`, name];
                }
                return [value, name];
              }}
            />
            <Legend
              wrapperStyle={{
                paddingTop: "20px",
              }}
            />
            <Line
              type="monotone"
              dataKey="Applications"
              stroke="hsl(217, 91%, 60%)"
              strokeWidth={2}
              dot={{ fill: "hsl(217, 91%, 60%)", strokeWidth: 2 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="Completed"
              stroke="hsl(142, 76%, 36%)"
              strokeWidth={2}
              dot={{ fill: "hsl(142, 76%, 36%)", strokeWidth: 2 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="Revenue"
              stroke="hsl(160, 84%, 39%)"
              strokeWidth={2}
              dot={{ fill: "hsl(160, 84%, 39%)", strokeWidth: 2 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="Completion %"
              stroke="hsl(24, 95%, 53%)"
              strokeWidth={2}
              dot={{ fill: "hsl(24, 95%, 53%)", strokeWidth: 2 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
        <div className="mt-4 text-xs text-muted-foreground">
          <p>* Revenue shown in thousands (K) for better visualization</p>
        </div>
        </CardContent>
      )}
    </Card>
  );
};
