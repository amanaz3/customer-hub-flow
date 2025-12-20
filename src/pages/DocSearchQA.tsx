import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, FileText, Brain, AlertTriangle, Settings, History } from "lucide-react";
import { QueryInterface } from "@/components/docsearch/QueryInterface";
import { SearchResults } from "@/components/docsearch/SearchResults";
import { ComplianceFlags } from "@/components/docsearch/ComplianceFlags";
import { SearchHistory } from "@/components/docsearch/SearchHistory";
import { SearchSettings } from "@/components/docsearch/SearchSettings";

export interface SearchResult {
  id: string;
  title: string;
  documentType: string;
  module: string;
  date: string;
  clientSupplier: string;
  relevanceScore: number;
  snippet: string;
  filePath: string;
  metadata: Record<string, string>;
}

export interface ComplianceFlag {
  id: string;
  documentId: string;
  documentTitle: string;
  flagType: "warning" | "error" | "suggestion";
  message: string;
  suggestedAction: string;
  status: "pending" | "approved" | "escalated" | "resolved";
}

export interface SearchQuery {
  id: string;
  queryText: string;
  queryType: "rag" | "structured" | "hybrid";
  timestamp: string;
  resultsCount: number;
  aiSummary: string;
  filters: {
    module?: string;
    dateRange?: { start: string; end: string };
    clientSupplier?: string;
    documentType?: string;
  };
}

const DocSearchQA = () => {
  const [activeTab, setActiveTab] = useState("search");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [complianceFlags, setComplianceFlags] = useState<ComplianceFlag[]>([]);
  const [aiSummary, setAiSummary] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [currentQuery, setCurrentQuery] = useState<SearchQuery | null>(null);

  const handleSearch = async (query: string, filters: SearchQuery["filters"]) => {
    setIsSearching(true);
    
    // Simulate AI-powered search
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock results
    const mockResults: SearchResult[] = [
      {
        id: "1",
        title: "Q4 2024 Financial Statement",
        documentType: "Financial Report",
        module: "Bookkeeping",
        date: "2024-12-15",
        clientSupplier: "Internal",
        relevanceScore: 0.95,
        snippet: "...total revenue increased by 15% compared to Q3, with operating expenses remaining stable...",
        filePath: "/documents/financial/q4-2024-statement.pdf",
        metadata: { pages: "24", author: "Finance Team" }
      },
      {
        id: "2",
        title: "Vendor Contract - ABC Supplies",
        documentType: "Contract",
        module: "CRM",
        date: "2024-11-20",
        clientSupplier: "ABC Supplies Ltd",
        relevanceScore: 0.87,
        snippet: "...payment terms set to Net 30, with automatic renewal clause in Section 5.2...",
        filePath: "/documents/contracts/abc-supplies-2024.pdf",
        metadata: { contractValue: "AED 150,000", term: "12 months" }
      },
      {
        id: "3",
        title: "VAT Return Q3 2024",
        documentType: "Tax Filing",
        module: "Tax",
        date: "2024-10-28",
        clientSupplier: "FTA",
        relevanceScore: 0.82,
        snippet: "...input VAT claimed AED 45,000, output VAT collected AED 78,000, net payable AED 33,000...",
        filePath: "/documents/tax/vat-q3-2024.pdf",
        metadata: { filingRef: "VAT2024Q3-001", status: "Filed" }
      }
    ];

    const mockFlags: ComplianceFlag[] = [
      {
        id: "f1",
        documentId: "3",
        documentTitle: "VAT Return Q3 2024",
        flagType: "warning",
        message: "VAT filing deadline approaching for Q4 2024",
        suggestedAction: "Prepare VAT return documents and submit before deadline",
        status: "pending"
      },
      {
        id: "f2",
        documentId: "2",
        documentTitle: "Vendor Contract - ABC Supplies",
        flagType: "suggestion",
        message: "Contract renewal date in 45 days",
        suggestedAction: "Review terms and initiate renewal discussions",
        status: "pending"
      }
    ];

    const mockSummary = `Based on your query "${query}", I found 3 relevant documents across Bookkeeping, CRM, and Tax modules. 

**Key Findings:**
- Q4 2024 shows strong financial performance with 15% revenue growth
- Active vendor contract with ABC Supplies (AED 150,000 value) due for renewal
- VAT obligations are current with Q3 2024 filed successfully

**Compliance Notes:**
- Q4 VAT filing deadline approaching - recommend early preparation
- Contract renewal opportunity identified for cost negotiation`;

    setSearchResults(mockResults);
    setComplianceFlags(mockFlags);
    setAiSummary(mockSummary);
    setCurrentQuery({
      id: Date.now().toString(),
      queryText: query,
      queryType: "hybrid",
      timestamp: new Date().toISOString(),
      resultsCount: mockResults.length,
      aiSummary: mockSummary,
      filters
    });
    setIsSearching(false);
  };

  const handleFlagAction = (flagId: string, action: "approve" | "escalate" | "resolve") => {
    setComplianceFlags(prev =>
      prev.map(flag =>
        flag.id === flagId
          ? { ...flag, status: action === "approve" ? "approved" : action === "escalate" ? "escalated" : "resolved" }
          : flag
      )
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Brain className="h-8 w-8 text-primary" />
            Doc Search & Q/A
          </h1>
          <p className="text-muted-foreground mt-1">
            AI-powered document search with hybrid RAG and compliance insights
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
          <TabsTrigger value="search" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Search
          </TabsTrigger>
          <TabsTrigger value="results" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Results
          </TabsTrigger>
          <TabsTrigger value="compliance" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Compliance
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            History
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-4">
          <QueryInterface
            onSearch={handleSearch}
            isSearching={isSearching}
            aiSummary={aiSummary}
            currentQuery={currentQuery}
          />
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          <SearchResults results={searchResults} />
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <ComplianceFlags flags={complianceFlags} onFlagAction={handleFlagAction} />
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <SearchHistory />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <SearchSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DocSearchQA;
