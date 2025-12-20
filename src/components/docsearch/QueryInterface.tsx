import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Search, Filter, Sparkles, Loader2, ChevronDown, Database, FileSearch, Zap } from "lucide-react";
import { SearchQuery } from "@/pages/DocSearchQA";
import ReactMarkdown from "react-markdown";

interface QueryInterfaceProps {
  onSearch: (query: string, filters: SearchQuery["filters"]) => void;
  isSearching: boolean;
  aiSummary: string;
  currentQuery: SearchQuery | null;
}

export const QueryInterface = ({ onSearch, isSearching, aiSummary, currentQuery }: QueryInterfaceProps) => {
  const [queryText, setQueryText] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchQuery["filters"]>({});

  const handleSearch = () => {
    if (queryText.trim()) {
      onSearch(queryText, filters);
    }
  };

  const getQueryTypeInfo = (type: string) => {
    switch (type) {
      case "rag":
        return { icon: FileSearch, label: "RAG Search", color: "bg-purple-500/10 text-purple-500" };
      case "structured":
        return { icon: Database, label: "Structured Query", color: "bg-blue-500/10 text-blue-500" };
      case "hybrid":
        return { icon: Zap, label: "Hybrid Search", color: "bg-amber-500/10 text-amber-500" };
      default:
        return { icon: Search, label: "Search", color: "bg-muted text-muted-foreground" };
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Natural Language Query
          </CardTitle>
          <CardDescription>
            Ask questions about your documents in plain language. The AI will determine the best search strategy.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Textarea
              placeholder="e.g., 'Show me all VAT-related documents from Q4 2024' or 'Find contracts expiring in the next 60 days' or 'What are our outstanding receivables?'"
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              className="min-h-[100px] resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSearch();
                }
              }}
            />
          </div>

          <Collapsible open={showFilters} onOpenChange={setShowFilters}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                Advanced Filters
                <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? "rotate-180" : ""}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Module</Label>
                  <Select
                    value={filters.module || ""}
                    onValueChange={(value) => setFilters({ ...filters, module: value || undefined })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All modules" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Modules</SelectItem>
                      <SelectItem value="bookkeeping">Bookkeeping</SelectItem>
                      <SelectItem value="tax">Tax</SelectItem>
                      <SelectItem value="crm">CRM</SelectItem>
                      <SelectItem value="pms">PMS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Document Type</Label>
                  <Select
                    value={filters.documentType || ""}
                    onValueChange={(value) => setFilters({ ...filters, documentType: value || undefined })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="invoice">Invoice</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="financial-report">Financial Report</SelectItem>
                      <SelectItem value="tax-filing">Tax Filing</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="regulatory">Regulatory Document</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Client/Supplier</Label>
                  <Input
                    placeholder="Search by name..."
                    value={filters.clientSupplier || ""}
                    onChange={(e) => setFilters({ ...filters, clientSupplier: e.target.value || undefined })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Date Range</Label>
                  <div className="flex gap-2">
                    <Input
                      type="date"
                      value={filters.dateRange?.start || ""}
                      onChange={(e) =>
                        setFilters({
                          ...filters,
                          dateRange: { ...filters.dateRange, start: e.target.value, end: filters.dateRange?.end || "" }
                        })
                      }
                    />
                    <Input
                      type="date"
                      value={filters.dateRange?.end || ""}
                      onChange={(e) =>
                        setFilters({
                          ...filters,
                          dateRange: { start: filters.dateRange?.start || "", end: e.target.value }
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <div className="flex justify-end">
            <Button onClick={handleSearch} disabled={isSearching || !queryText.trim()} className="gap-2">
              {isSearching ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Search Documents
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {currentQuery && aiSummary && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="h-5 w-5 text-primary" />
                AI Summary
              </CardTitle>
              <div className="flex gap-2">
                {(() => {
                  const info = getQueryTypeInfo(currentQuery.queryType);
                  const Icon = info.icon;
                  return (
                    <Badge variant="outline" className={info.color}>
                      <Icon className="h-3 w-3 mr-1" />
                      {info.label}
                    </Badge>
                  );
                })()}
                <Badge variant="secondary">{currentQuery.resultsCount} documents found</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown>{aiSummary}</ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
