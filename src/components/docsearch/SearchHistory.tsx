import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Clock, RotateCcw, Trash2, FileSearch, Database, Zap } from "lucide-react";
import { format } from "date-fns";

interface HistoryItem {
  id: string;
  queryText: string;
  queryType: "rag" | "structured" | "hybrid";
  timestamp: string;
  resultsCount: number;
  filters: {
    module?: string;
    documentType?: string;
  };
}

export const SearchHistory = () => {
  const [searchFilter, setSearchFilter] = useState("");

  const [history] = useState<HistoryItem[]>([
    {
      id: "1",
      queryText: "Show me all VAT-related documents from Q4 2024",
      queryType: "hybrid",
      timestamp: new Date().toISOString(),
      resultsCount: 3,
      filters: { module: "Tax" }
    },
    {
      id: "2",
      queryText: "Find contracts expiring in the next 60 days",
      queryType: "rag",
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      resultsCount: 5,
      filters: { documentType: "Contract" }
    },
    {
      id: "3",
      queryText: "What are our outstanding receivables?",
      queryType: "structured",
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      resultsCount: 12,
      filters: { module: "Bookkeeping" }
    },
    {
      id: "4",
      queryText: "Show regulatory compliance documents for FTA",
      queryType: "rag",
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      resultsCount: 8,
      filters: { module: "Tax", documentType: "Regulatory" }
    }
  ]);

  const getQueryTypeIcon = (type: string) => {
    switch (type) {
      case "rag":
        return <FileSearch className="h-4 w-4" />;
      case "structured":
        return <Database className="h-4 w-4" />;
      case "hybrid":
        return <Zap className="h-4 w-4" />;
      default:
        return <Search className="h-4 w-4" />;
    }
  };

  const getQueryTypeColor = (type: string) => {
    switch (type) {
      case "rag":
        return "bg-purple-500/10 text-purple-500";
      case "structured":
        return "bg-blue-500/10 text-blue-500";
      case "hybrid":
        return "bg-amber-500/10 text-amber-500";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const filteredHistory = history.filter(item =>
    item.queryText.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Search History</h2>
        <Button variant="outline" size="sm" className="gap-2">
          <Trash2 className="h-4 w-4" />
          Clear History
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Filter history..."
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          className="pl-10"
        />
      </div>

      <ScrollArea className="h-[500px]">
        <div className="space-y-2 pr-4">
          {filteredHistory.map((item) => (
            <Card key={item.id} className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium mb-2 line-clamp-2">{item.queryText}</p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className={`${getQueryTypeColor(item.queryType)} gap-1`}>
                        {getQueryTypeIcon(item.queryType)}
                        {item.queryType.toUpperCase()}
                      </Badge>
                      <Badge variant="secondary">{item.resultsCount} results</Badge>
                      {item.filters.module && (
                        <Badge variant="outline">{item.filters.module}</Badge>
                      )}
                      {item.filters.documentType && (
                        <Badge variant="outline">{item.filters.documentType}</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {format(new Date(item.timestamp), "MMM d, h:mm a")}
                    </div>
                    <Button size="sm" variant="ghost" className="gap-1">
                      <RotateCcw className="h-3 w-3" />
                      Re-run
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
