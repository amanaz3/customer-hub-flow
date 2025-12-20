import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Download, Eye, ExternalLink, Calendar, Building2, Layers } from "lucide-react";
import { SearchResult } from "@/pages/DocSearchQA";

interface SearchResultsProps {
  results: SearchResult[];
}

export const SearchResults = ({ results }: SearchResultsProps) => {
  const getRelevanceColor = (score: number) => {
    if (score >= 0.9) return "bg-green-500/10 text-green-500 border-green-500/20";
    if (score >= 0.7) return "bg-amber-500/10 text-amber-500 border-amber-500/20";
    return "bg-muted text-muted-foreground";
  };

  const getModuleColor = (module: string) => {
    switch (module.toLowerCase()) {
      case "bookkeeping":
        return "bg-blue-500/10 text-blue-500";
      case "tax":
        return "bg-purple-500/10 text-purple-500";
      case "crm":
        return "bg-green-500/10 text-green-500";
      case "pms":
        return "bg-orange-500/10 text-orange-500";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (results.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No results yet</h3>
          <p className="text-muted-foreground text-center mt-1">
            Use the Search tab to query your documents
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Retrieved Documents</h2>
        <Badge variant="secondary">{results.length} documents</Badge>
      </div>

      <ScrollArea className="h-[600px]">
        <div className="space-y-3 pr-4">
          {results.map((result) => (
            <Card key={result.id} className="hover:border-primary/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                      <h3 className="font-medium truncate">{result.title}</h3>
                    </div>

                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {result.snippet}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge variant="outline" className={getModuleColor(result.module)}>
                        <Layers className="h-3 w-3 mr-1" />
                        {result.module}
                      </Badge>
                      <Badge variant="outline">
                        {result.documentType}
                      </Badge>
                      <Badge variant="outline" className="gap-1">
                        <Calendar className="h-3 w-3" />
                        {result.date}
                      </Badge>
                      <Badge variant="outline" className="gap-1">
                        <Building2 className="h-3 w-3" />
                        {result.clientSupplier}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {Object.entries(result.metadata).map(([key, value]) => (
                        <Badge key={key} variant="secondary" className="text-xs">
                          {key}: {value}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <Badge className={`${getRelevanceColor(result.relevanceScore)} border`}>
                      {Math.round(result.relevanceScore * 100)}% match
                    </Badge>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
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
