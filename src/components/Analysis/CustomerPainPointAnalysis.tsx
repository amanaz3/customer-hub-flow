import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Upload, 
  FolderOpen, 
  FileSpreadsheet, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Loader2,
  Download,
  Users,
  Globe,
  Crown,
  Star,
  TrendingUp,
  Shield,
  Briefcase,
  Filter,
  X,
  Database,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import * as XLSX from 'xlsx';

interface CustomerData {
  name: string;
  email?: string;
  nationality?: string;
  phone?: string;
  country?: string;
  company?: string;
  existingServices?: string[];
  productName?: string;
  [key: string]: string | string[] | undefined;
}

interface AnalysisResult {
  customer: CustomerData;
  riskLevel: 'low' | 'medium' | 'high';
  riskScore: number;
  painPoints: string[];
  recommendations: string[];
  documentationGaps: string[];
  wealthTier: 'UHNW' | 'HNW' | 'Mass Affluent' | 'Standard';
  wealthTierReason?: string;
  bankingReadinessTier: 'Tier 1' | 'Tier 2' | 'Tier 3';
  bankingReadinessReason?: string;
  serviceOpportunity: 'High' | 'Medium' | 'Low';
  serviceOpportunityReason?: string;
  nationalitySegment: string;
  nationalitySegmentReason?: string;
  recommendedProducts: string[];
  crossSellOpportunities?: string[];
}

interface FileInfo {
  name: string;
  path: string;
  customers: CustomerData[];
}

interface FolderInfo {
  name: string;
  files: FileInfo[];
}

interface DBCustomer {
  id: string;
  name: string;
  email: string;
  company: string;
  mobile: string;
  product_id: string | null;
  product_name: string | null;
}

interface Product {
  id: string;
  name: string;
}

const CustomerPainPointAnalysis = () => {
  const [folders, setFolders] = useState<FolderInfo[]>([]);
  const [allCustomers, setAllCustomers] = useState<CustomerData[]>([]);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadStats, setUploadStats] = useState({ folders: 0, files: 0, customers: 0 });
  
  // Data source tab
  const [dataSource, setDataSource] = useState<'upload' | 'database'>('database');
  
  // DB customers state
  const [dbCustomers, setDbCustomers] = useState<DBCustomer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductFilter, setSelectedProductFilter] = useState<string>('all');
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<Set<string>>(new Set());
  const [isLoadingDB, setIsLoadingDB] = useState(false);

  // Classification filters
  const [wealthFilter, setWealthFilter] = useState<string>('all');
  const [readinessFilter, setReadinessFilter] = useState<string>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [nationalityFilter, setNationalityFilter] = useState<string>('all');
  // Classification counts
  const classificationCounts = useMemo(() => {
    const wealthTiers = { UHNW: 0, HNW: 0, 'Mass Affluent': 0, Standard: 0 };
    const readinessTiers = { 'Tier 1': 0, 'Tier 2': 0, 'Tier 3': 0 };
    const serviceOpps = { High: 0, Medium: 0, Low: 0 };
    const nationalitySegs: Record<string, number> = {};

    analysisResults.forEach(r => {
      if (r.wealthTier) wealthTiers[r.wealthTier]++;
      if (r.bankingReadinessTier) readinessTiers[r.bankingReadinessTier]++;
      if (r.serviceOpportunity) serviceOpps[r.serviceOpportunity]++;
      if (r.nationalitySegment) {
        nationalitySegs[r.nationalitySegment] = (nationalitySegs[r.nationalitySegment] || 0) + 1;
      }
    });

    return { wealthTiers, readinessTiers, serviceOpps, nationalitySegs };
  }, [analysisResults]);

  // Filtered results for classifications tab
  const filteredResults = useMemo(() => {
    return analysisResults.filter(r => {
      if (wealthFilter !== 'all' && r.wealthTier !== wealthFilter) return false;
      if (readinessFilter !== 'all' && r.bankingReadinessTier !== readinessFilter) return false;
      if (serviceFilter !== 'all' && r.serviceOpportunity !== serviceFilter) return false;
      if (nationalityFilter !== 'all' && r.nationalitySegment !== nationalityFilter) return false;
      return true;
    });
  }, [analysisResults, wealthFilter, readinessFilter, serviceFilter, nationalityFilter]);

  const clearAllFilters = () => {
    setWealthFilter('all');
    setReadinessFilter('all');
    setServiceFilter('all');
    setNationalityFilter('all');
  };

  const hasActiveFilters = wealthFilter !== 'all' || readinessFilter !== 'all' || serviceFilter !== 'all' || nationalityFilter !== 'all';

  // Load products and customers from DB
  const loadDBData = useCallback(async () => {
    setIsLoadingDB(true);
    try {
      // Load products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, name')
        .eq('is_active', true);
      
      if (productsError) throw productsError;
      setProducts(productsData || []);

      // Load customers with their products
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select(`
          id, name, email, company, mobile,
          product_id,
          products:product_id (name)
        `)
        .order('created_at', { ascending: false })
        .limit(500);
      
      if (customersError) throw customersError;
      
      const formattedCustomers: DBCustomer[] = (customersData || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        company: c.company,
        mobile: c.mobile,
        product_id: c.product_id,
        product_name: c.products?.name || null
      }));
      
      setDbCustomers(formattedCustomers);
    } catch (error) {
      console.error('Error loading DB data:', error);
      toast.error('Failed to load customers from database');
    } finally {
      setIsLoadingDB(false);
    }
  }, []);

  useEffect(() => {
    if (dataSource === 'database') {
      loadDBData();
    }
  }, [dataSource, loadDBData]);

  // Filtered DB customers by product
  const filteredDBCustomers = useMemo(() => {
    if (selectedProductFilter === 'all') return dbCustomers;
    if (selectedProductFilter === 'none') return dbCustomers.filter(c => !c.product_id);
    return dbCustomers.filter(c => c.product_id === selectedProductFilter);
  }, [dbCustomers, selectedProductFilter]);

  // Toggle customer selection
  const toggleCustomerSelection = (customerId: string) => {
    const newSet = new Set(selectedCustomerIds);
    if (newSet.has(customerId)) {
      newSet.delete(customerId);
    } else {
      newSet.add(customerId);
    }
    setSelectedCustomerIds(newSet);
  };

  // Select/deselect all visible customers
  const toggleSelectAll = () => {
    if (selectedCustomerIds.size === filteredDBCustomers.length) {
      setSelectedCustomerIds(new Set());
    } else {
      setSelectedCustomerIds(new Set(filteredDBCustomers.map(c => c.id)));
    }
  };

  // Analyze selected DB customers
  const analyzeDBCustomers = async () => {
    if (selectedCustomerIds.size === 0) {
      toast.error('Please select customers to analyze');
      return;
    }

    const selectedCustomers = dbCustomers.filter(c => selectedCustomerIds.has(c.id));
    const customerDataForAnalysis: CustomerData[] = selectedCustomers.map(c => ({
      name: c.name,
      email: c.email,
      company: c.company,
      phone: c.mobile,
      productName: c.product_name || undefined,
      existingServices: c.product_name ? [c.product_name] : undefined
    }));

    setAllCustomers(customerDataForAnalysis);
    
    // Trigger analysis
    setIsAnalyzing(true);
    setProgress(0);
    const results: AnalysisResult[] = [];
    const batchSize = 10;

    try {
      for (let i = 0; i < customerDataForAnalysis.length; i += batchSize) {
        const batch = customerDataForAnalysis.slice(i, i + batchSize);
        
        const { data, error } = await supabase.functions.invoke('analyze-bank-pain-points', {
          body: { customers: batch }
        });

        if (error) {
          console.error('Analysis error:', error);
          toast.error('Analysis error - retrying...');
        } else if (data?.results) {
          results.push(...data.results);
        } else if (data?.retryable) {
          toast.error(data.error || 'Please try again');
        }

        setProgress(((i + batchSize) / customerDataForAnalysis.length) * 100);
      }

      setAnalysisResults(results);
      if (results.length > 0) {
        toast.success(`Analysis complete: ${results.length} customers analyzed`);
      } else {
        toast.error('No results returned. Please try again.');
      }
    } catch (error) {
      console.error('Analysis failed:', error);
      toast.error('Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const parseExcelFile = async (file: File): Promise<CustomerData[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet) as CustomerData[];
          
          const normalizedData = jsonData.map(row => {
            const normalized: CustomerData = { name: '' };
            Object.entries(row).forEach(([key, value]) => {
              const lowerKey = key.toLowerCase().trim();
              if (lowerKey.includes('name')) normalized.name = String(value || '');
              else if (lowerKey.includes('email')) normalized.email = String(value || '');
              else if (lowerKey.includes('national')) normalized.nationality = String(value || '');
              else if (lowerKey.includes('phone') || lowerKey.includes('mobile')) normalized.phone = String(value || '');
              else if (lowerKey.includes('country')) normalized.country = String(value || '');
              else normalized[lowerKey] = String(value || '');
            });
            return normalized;
          }).filter(c => c.name);
          
          resolve(normalizedData);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  const handleDirectoryUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsLoading(true);
    setProgress(0);
    
    try {
      const folderMap = new Map<string, FileInfo[]>();
      const excelFiles = Array.from(files).filter(f => 
        f.name.endsWith('.xlsx') || f.name.endsWith('.xls') || f.name.endsWith('.csv')
      );

      if (excelFiles.length === 0) {
        toast.error('No Excel files found in the selected directory');
        setIsLoading(false);
        return;
      }

      let processedFiles = 0;
      let totalCustomers: CustomerData[] = [];

      for (const file of excelFiles) {
        const pathParts = file.webkitRelativePath.split('/');
        const folderName = pathParts.length > 1 ? pathParts[pathParts.length - 2] : 'Root';
        
        try {
          const customers = await parseExcelFile(file);
          const fileInfo: FileInfo = {
            name: file.name,
            path: file.webkitRelativePath,
            customers
          };

          if (!folderMap.has(folderName)) {
            folderMap.set(folderName, []);
          }
          folderMap.get(folderName)!.push(fileInfo);
          totalCustomers = [...totalCustomers, ...customers];
          
          processedFiles++;
          setProgress((processedFiles / excelFiles.length) * 100);
        } catch (err) {
          console.error(`Error parsing ${file.name}:`, err);
        }
      }

      const folderInfos: FolderInfo[] = Array.from(folderMap.entries()).map(([name, files]) => ({
        name,
        files
      }));

      setFolders(folderInfos);
      setAllCustomers(totalCustomers);
      setUploadStats({
        folders: folderInfos.length,
        files: excelFiles.length,
        customers: totalCustomers.length
      });
      
      toast.success(`Loaded ${totalCustomers.length} customers from ${excelFiles.length} files`);
    } catch (error) {
      console.error('Error processing files:', error);
      toast.error('Failed to process files');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const analyzeCustomers = async () => {
    if (allCustomers.length === 0) {
      toast.error('No customers to analyze');
      return;
    }

    setIsAnalyzing(true);
    setProgress(0);
    const results: AnalysisResult[] = [];
    const batchSize = 10;

    try {
      for (let i = 0; i < allCustomers.length; i += batchSize) {
        const batch = allCustomers.slice(i, i + batchSize);
        
        const { data, error } = await supabase.functions.invoke('analyze-bank-pain-points', {
          body: { customers: batch }
        });

        if (error) {
          console.error('Analysis error:', error);
        } else if (data?.results) {
          results.push(...data.results);
        }

        setProgress(((i + batchSize) / allCustomers.length) * 100);
      }

      setAnalysisResults(results);
      toast.success(`Analysis complete: ${results.length} customers analyzed`);
    } catch (error) {
      console.error('Analysis failed:', error);
      toast.error('Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const exportResults = () => {
    if (analysisResults.length === 0) return;

    const exportData = analysisResults.map(r => ({
      Name: r.customer.name,
      Email: r.customer.email || '',
      Nationality: r.customer.nationality || '',
      'Risk Level': r.riskLevel,
      'Risk Score': r.riskScore,
      'Wealth Tier': r.wealthTier || '',
      'Banking Readiness': r.bankingReadinessTier || '',
      'Service Opportunity': r.serviceOpportunity || '',
      'Nationality Segment': r.nationalitySegment || '',
      'Recommended Products': (r.recommendedProducts || []).join('; '),
      'Pain Points': r.painPoints.join('; '),
      'Recommendations': r.recommendations.join('; '),
      'Documentation Gaps': r.documentationGaps.join('; ')
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Analysis Results');
    XLSX.writeFile(wb, `bank-account-pain-analysis-${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Results exported successfully');
  };

  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'high':
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> High Risk</Badge>;
      case 'medium':
        return <Badge variant="secondary" className="gap-1 bg-yellow-500/10 text-yellow-600"><AlertTriangle className="h-3 w-3" /> Medium Risk</Badge>;
      default:
        return <Badge variant="secondary" className="gap-1 bg-green-500/10 text-green-600"><CheckCircle className="h-3 w-3" /> Low Risk</Badge>;
    }
  };

  const getWealthTierBadge = (tier: string) => {
    switch (tier) {
      case 'UHNW':
        return <Badge className="gap-1 bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-950 border-0"><Crown className="h-3 w-3" /> UHNW</Badge>;
      case 'HNW':
        return <Badge className="gap-1 bg-amber-100 text-amber-700 border-amber-200"><Star className="h-3 w-3" /> HNW</Badge>;
      case 'Mass Affluent':
        return <Badge variant="secondary" className="gap-1 bg-blue-500/10 text-blue-600">Mass Affluent</Badge>;
      default:
        return <Badge variant="outline" className="gap-1">Standard</Badge>;
    }
  };

  const getReadinessBadge = (tier: string) => {
    switch (tier) {
      case 'Tier 1':
        return <Badge className="gap-1 bg-green-500/10 text-green-600 border-green-200"><Shield className="h-3 w-3" /> Tier 1</Badge>;
      case 'Tier 2':
        return <Badge className="gap-1 bg-yellow-500/10 text-yellow-600 border-yellow-200">Tier 2</Badge>;
      case 'Tier 3':
        return <Badge variant="destructive" className="gap-1">Tier 3 (EDD)</Badge>;
      default:
        return <Badge variant="outline">{tier}</Badge>;
    }
  };

  const getServiceOpportunityBadge = (level: string) => {
    switch (level) {
      case 'High':
        return <Badge className="gap-1 bg-orange-500/10 text-orange-600 border-orange-200"><TrendingUp className="h-3 w-3" /> High Priority</Badge>;
      case 'Medium':
        return <Badge variant="secondary" className="gap-1 bg-blue-500/10 text-blue-600">Medium</Badge>;
      default:
        return <Badge variant="outline" className="gap-1">Low</Badge>;
    }
  };

  const highRiskCount = analysisResults.filter(r => r.riskLevel === 'high').length;
  const mediumRiskCount = analysisResults.filter(r => r.riskLevel === 'medium').length;
  const lowRiskCount = analysisResults.filter(r => r.riskLevel === 'low').length;

  return (
    <div className="space-y-6">
      {/* Data Source Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Customer Analysis & Cross-Sell Opportunities
          </CardTitle>
          <CardDescription>
            Analyze customers for banking readiness, pain points, and cross-sell opportunities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={dataSource} onValueChange={(v) => setDataSource(v as 'upload' | 'database')}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="database" className="gap-2">
                <Database className="h-4 w-4" />
                Existing Customers
              </TabsTrigger>
              <TabsTrigger value="upload" className="gap-2">
                <Upload className="h-4 w-4" />
                Upload Data
              </TabsTrigger>
            </TabsList>

            {/* Database Customers Tab */}
            <TabsContent value="database" className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Select value={selectedProductFilter} onValueChange={setSelectedProductFilter}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Filter by service" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Services</SelectItem>
                      <SelectItem value="none">No Service Assigned</SelectItem>
                      {products.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Badge variant="secondary">{filteredDBCustomers.length} customers</Badge>
                </div>
                <Button variant="outline" size="sm" onClick={loadDBData} disabled={isLoadingDB}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingDB ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>

              {isLoadingDB ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <ScrollArea className="h-[300px] border rounded-lg">
                  <div className="p-2">
                    <div className="flex items-center gap-2 p-2 border-b mb-2">
                      <Checkbox
                        checked={selectedCustomerIds.size === filteredDBCustomers.length && filteredDBCustomers.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                      <span className="text-sm font-medium">
                        Select All ({selectedCustomerIds.size} selected)
                      </span>
                    </div>
                    {filteredDBCustomers.map(customer => (
                      <div
                        key={customer.id}
                        className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded-md cursor-pointer"
                        onClick={() => toggleCustomerSelection(customer.id)}
                      >
                        <Checkbox
                          checked={selectedCustomerIds.has(customer.id)}
                          onCheckedChange={() => toggleCustomerSelection(customer.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{customer.name}</p>
                          <p className="text-sm text-muted-foreground truncate">{customer.company}</p>
                        </div>
                        {customer.product_name && (
                          <Badge variant="outline" className="shrink-0">{customer.product_name}</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}

              <Button 
                onClick={analyzeDBCustomers} 
                disabled={isAnalyzing || selectedCustomerIds.size === 0}
                className="w-full"
                size="lg"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing {selectedCustomerIds.size} customers...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Analyze {selectedCustomerIds.size} Selected Customers
                  </>
                )}
              </Button>

              {isAnalyzing && <Progress value={progress} />}
            </TabsContent>

            {/* Upload Tab */}
            <TabsContent value="upload" className="space-y-4">
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                <input
                  type="file"
                  id="directory-upload"
                  // @ts-ignore - webkitdirectory is not in standard types
                  webkitdirectory="true"
                  directory=""
                  multiple
                  onChange={handleDirectoryUpload}
                  className="hidden"
                  disabled={isLoading}
                />
                <label htmlFor="directory-upload" className="cursor-pointer">
                  <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">Click to select a folder</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    All Excel files in subfolders will be processed
                  </p>
                </label>
              </div>

              {isLoading && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Processing files...</span>
                  </div>
                  <Progress value={progress} />
                </div>
              )}

              {uploadStats.customers > 0 && !isLoading && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-muted/50 text-center">
                    <FolderOpen className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <p className="text-2xl font-bold">{uploadStats.folders}</p>
                    <p className="text-sm text-muted-foreground">Folders</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50 text-center">
                    <FileSpreadsheet className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <p className="text-2xl font-bold">{uploadStats.files}</p>
                    <p className="text-sm text-muted-foreground">Files</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50 text-center">
                    <Users className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <p className="text-2xl font-bold">{uploadStats.customers}</p>
                    <p className="text-sm text-muted-foreground">Customers</p>
                  </div>
                </div>
              )}

              {folders.length > 0 && (
                <Accordion type="multiple" className="w-full">
                  {folders.map((folder, idx) => (
                    <AccordionItem key={idx} value={folder.name}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-2">
                          <FolderOpen className="h-4 w-4" />
                          <span>{folder.name}</span>
                          <Badge variant="secondary">{folder.files.length} files</Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2 pl-6">
                          {folder.files.map((file, fidx) => (
                            <div key={fidx} className="flex items-center gap-2 text-sm">
                              <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                              <span>{file.name}</span>
                              <Badge variant="outline">{file.customers.length} records</Badge>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}

              {allCustomers.length > 0 && dataSource === 'upload' && (
                <Button 
                  onClick={analyzeCustomers} 
                  disabled={isAnalyzing}
                  className="w-full"
                  size="lg"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing {allCustomers.length} customers...
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Analyze Bank Account Pain Points
                    </>
                  )}
                </Button>
              )}

              {isAnalyzing && dataSource === 'upload' && (
                <Progress value={progress} className="mt-2" />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Results Section */}
      {analysisResults.length > 0 && (
        <>
          {/* Export Button */}
          <div className="flex justify-end">
            <Button variant="outline" onClick={exportResults}>
              <Download className="h-4 w-4 mr-2" />
              Export Results
            </Button>
          </div>

          <Tabs defaultValue="risk" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="risk">Risk Analysis</TabsTrigger>
              <TabsTrigger value="classifications">Classifications</TabsTrigger>
            </TabsList>

            <TabsContent value="risk" className="space-y-4">
              {/* Risk Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-card to-card/50">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <p className="text-3xl font-bold">{analysisResults.length}</p>
                      <p className="text-sm text-muted-foreground">Total Analyzed</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-red-500/5 to-red-500/10 border-red-500/20">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <XCircle className="h-8 w-8 mx-auto mb-2 text-red-500" />
                      <p className="text-3xl font-bold text-red-500">{highRiskCount}</p>
                      <p className="text-sm text-muted-foreground">High Risk</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-yellow-500/5 to-yellow-500/10 border-yellow-500/20">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
                      <p className="text-3xl font-bold text-yellow-600">{mediumRiskCount}</p>
                      <p className="text-sm text-muted-foreground">Medium Risk</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                      <p className="text-3xl font-bold text-green-600">{lowRiskCount}</p>
                      <p className="text-sm text-muted-foreground">Low Risk</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Risk Analysis Results */}
              <Card>
                <CardHeader>
                  <CardTitle>Risk Analysis Results</CardTitle>
                  <CardDescription>Customers sorted by risk level (high risk first)</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px]">
                    <div className="space-y-4">
                      {analysisResults
                        .sort((a, b) => {
                          const order = { high: 0, medium: 1, low: 2 };
                          return order[a.riskLevel] - order[b.riskLevel];
                        })
                        .map((result, idx) => (
                          <Card key={idx} className={`border-l-4 ${
                            result.riskLevel === 'high' ? 'border-l-red-500' :
                            result.riskLevel === 'medium' ? 'border-l-yellow-500' : 'border-l-green-500'
                          }`}>
                            <CardContent className="pt-4">
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <h4 className="font-semibold text-lg">{result.customer.name}</h4>
                                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                    {result.customer.email && <span>{result.customer.email}</span>}
                                    {result.customer.nationality && (
                                      <span className="flex items-center gap-1">
                                        <Globe className="h-3 w-3" />
                                        {result.customer.nationality}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {getRiskBadge(result.riskLevel)}
                                  <Badge variant="outline">Score: {result.riskScore}/100</Badge>
                                </div>
                              </div>

                              <Accordion type="single" collapsible className="w-full">
                                <AccordionItem value="details" className="border-none">
                                  <AccordionTrigger className="py-2 text-sm hover:no-underline">
                                    View Details
                                  </AccordionTrigger>
                                  <AccordionContent>
                                    <div className="grid gap-4 pt-2">
                                      {result.painPoints.length > 0 && (
                                        <div>
                                          <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                                            <AlertTriangle className="h-4 w-4 text-destructive" />
                                            Pain Points
                                          </h5>
                                          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                                            {result.painPoints.map((point, pidx) => (
                                              <li key={pidx}>{point}</li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}

                                      {result.recommendations.length > 0 && (
                                        <div>
                                          <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                                            <CheckCircle className="h-4 w-4 text-green-600" />
                                            Recommendations
                                          </h5>
                                          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                                            {result.recommendations.map((rec, ridx) => (
                                              <li key={ridx}>{rec}</li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}

                                      {result.documentationGaps.length > 0 && (
                                        <div>
                                          <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                                            <FileSpreadsheet className="h-4 w-4 text-blue-600" />
                                            Documentation Needed
                                          </h5>
                                          <div className="flex flex-wrap gap-2">
                                            {result.documentationGaps.map((doc, didx) => (
                                              <Badge key={didx} variant="outline">{doc}</Badge>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </AccordionContent>
                                </AccordionItem>
                              </Accordion>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="classifications" className="space-y-4">
              {/* Classification Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-amber-500/5 to-amber-500/10 border-amber-500/20">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <Crown className="h-8 w-8 mx-auto mb-2 text-amber-500" />
                      <p className="text-sm font-medium text-muted-foreground mb-2">Wealth Tier</p>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between"><span>UHNW</span><span className="font-bold">{classificationCounts.wealthTiers.UHNW}</span></div>
                        <div className="flex justify-between"><span>HNW</span><span className="font-bold">{classificationCounts.wealthTiers.HNW}</span></div>
                        <div className="flex justify-between"><span>Mass Affluent</span><span className="font-bold">{classificationCounts.wealthTiers['Mass Affluent']}</span></div>
                        <div className="flex justify-between"><span>Standard</span><span className="font-bold">{classificationCounts.wealthTiers.Standard}</span></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-500/5 to-blue-500/10 border-blue-500/20">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <Shield className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                      <p className="text-sm font-medium text-muted-foreground mb-2">Banking Readiness</p>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between"><span>Tier 1 (Premium)</span><span className="font-bold text-green-600">{classificationCounts.readinessTiers['Tier 1']}</span></div>
                        <div className="flex justify-between"><span>Tier 2 (Standard)</span><span className="font-bold text-yellow-600">{classificationCounts.readinessTiers['Tier 2']}</span></div>
                        <div className="flex justify-between"><span>Tier 3 (EDD)</span><span className="font-bold text-red-600">{classificationCounts.readinessTiers['Tier 3']}</span></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-500/5 to-orange-500/10 border-orange-500/20">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <TrendingUp className="h-8 w-8 mx-auto mb-2 text-orange-500" />
                      <p className="text-sm font-medium text-muted-foreground mb-2">Service Opportunity</p>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between"><span>High Priority</span><span className="font-bold text-orange-600">{classificationCounts.serviceOpps.High}</span></div>
                        <div className="flex justify-between"><span>Medium</span><span className="font-bold text-blue-600">{classificationCounts.serviceOpps.Medium}</span></div>
                        <div className="flex justify-between"><span>Low</span><span className="font-bold">{classificationCounts.serviceOpps.Low}</span></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-500/5 to-purple-500/10 border-purple-500/20">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <Globe className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                      <p className="text-sm font-medium text-muted-foreground mb-2">Nationality Segments</p>
                      <div className="space-y-1 text-sm">
                        {Object.entries(classificationCounts.nationalitySegs).map(([seg, count]) => (
                          <div key={seg} className="flex justify-between">
                            <span className="truncate">{seg}</span>
                            <span className="font-bold">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Filters */}
              <Card>
                <CardContent className="pt-4">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Filters:</span>
                    </div>
                    
                    <Select value={wealthFilter} onValueChange={setWealthFilter}>
                      <SelectTrigger className="w-[150px] bg-background">
                        <SelectValue placeholder="Wealth Tier" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover z-50">
                        <SelectItem value="all">All Wealth Tiers</SelectItem>
                        <SelectItem value="UHNW">UHNW</SelectItem>
                        <SelectItem value="HNW">HNW</SelectItem>
                        <SelectItem value="Mass Affluent">Mass Affluent</SelectItem>
                        <SelectItem value="Standard">Standard</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={readinessFilter} onValueChange={setReadinessFilter}>
                      <SelectTrigger className="w-[150px] bg-background">
                        <SelectValue placeholder="Readiness" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover z-50">
                        <SelectItem value="all">All Readiness</SelectItem>
                        <SelectItem value="Tier 1">Tier 1 (Premium)</SelectItem>
                        <SelectItem value="Tier 2">Tier 2 (Standard)</SelectItem>
                        <SelectItem value="Tier 3">Tier 3 (EDD)</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={serviceFilter} onValueChange={setServiceFilter}>
                      <SelectTrigger className="w-[150px] bg-background">
                        <SelectValue placeholder="Service Opp" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover z-50">
                        <SelectItem value="all">All Opportunities</SelectItem>
                        <SelectItem value="High">High Priority</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="Low">Low</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={nationalityFilter} onValueChange={setNationalityFilter}>
                      <SelectTrigger className="w-[180px] bg-background">
                        <SelectValue placeholder="Nationality" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover z-50">
                        <SelectItem value="all">All Nationalities</SelectItem>
                        {Object.keys(classificationCounts.nationalitySegs).map(seg => (
                          <SelectItem key={seg} value={seg}>{seg}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {hasActiveFilters && (
                      <Button variant="ghost" size="sm" onClick={clearAllFilters} className="gap-1">
                        <X className="h-3 w-3" />
                        Clear
                      </Button>
                    )}

                    <div className="ml-auto text-sm text-muted-foreground">
                      Showing {filteredResults.length} of {analysisResults.length}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Classification Results */}
              <Card>
                <CardHeader>
                  <CardTitle>Customer Classifications</CardTitle>
                  <CardDescription>Customers with wealth tier, readiness, and service opportunity classifications</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px]">
                    <div className="space-y-4">
                      {filteredResults
                        .sort((a, b) => {
                          const tierOrder = { UHNW: 0, HNW: 1, 'Mass Affluent': 2, Standard: 3 };
                          return (tierOrder[a.wealthTier] || 3) - (tierOrder[b.wealthTier] || 3);
                        })
                        .map((result, idx) => (
                          <Card key={idx} className="border-l-4 border-l-primary/50">
                            <CardContent className="pt-4">
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <h4 className="font-semibold text-lg">{result.customer.name}</h4>
                                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                    {result.customer.nationality && (
                                      <span className="flex items-center gap-1">
                                        <Globe className="h-3 w-3" />
                                        {result.customer.nationality}
                                      </span>
                                    )}
                                    {result.nationalitySegment && (
                                      <Badge variant="outline" className="text-xs">{result.nationalitySegment}</Badge>
                                    )}
                                  </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 justify-end">
                                  {getWealthTierBadge(result.wealthTier)}
                                  {getReadinessBadge(result.bankingReadinessTier)}
                                  {getServiceOpportunityBadge(result.serviceOpportunity)}
                                </div>
                              </div>

                              <div className="mt-3 p-3 bg-muted/50 rounded-md space-y-2">
                                <h5 className="text-sm font-medium text-muted-foreground">Classification Reasoning</h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                  {result.wealthTierReason && (
                                    <div className="flex items-start gap-2">
                                      <Crown className="h-3 w-3 text-amber-500 mt-0.5 shrink-0" />
                                      <div>
                                        <span className="font-medium">Wealth:</span>
                                        <span className="text-muted-foreground ml-1">{result.wealthTierReason}</span>
                                      </div>
                                    </div>
                                  )}
                                  {result.bankingReadinessReason && (
                                    <div className="flex items-start gap-2">
                                      <Shield className="h-3 w-3 text-blue-500 mt-0.5 shrink-0" />
                                      <div>
                                        <span className="font-medium">Readiness:</span>
                                        <span className="text-muted-foreground ml-1">{result.bankingReadinessReason}</span>
                                      </div>
                                    </div>
                                  )}
                                  {result.serviceOpportunityReason && (
                                    <div className="flex items-start gap-2">
                                      <TrendingUp className="h-3 w-3 text-orange-500 mt-0.5 shrink-0" />
                                      <div>
                                        <span className="font-medium">Service:</span>
                                        <span className="text-muted-foreground ml-1">{result.serviceOpportunityReason}</span>
                                      </div>
                                    </div>
                                  )}
                                  {result.nationalitySegmentReason && (
                                    <div className="flex items-start gap-2">
                                      <Globe className="h-3 w-3 text-purple-500 mt-0.5 shrink-0" />
                                      <div>
                                        <span className="font-medium">Nationality:</span>
                                        <span className="text-muted-foreground ml-1">{result.nationalitySegmentReason}</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {result.recommendedProducts && result.recommendedProducts.length > 0 && (
                                <div className="mt-3">
                                  <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                                    <Briefcase className="h-4 w-4 text-primary" />
                                    Recommended Products
                                  </h5>
                                  <div className="flex flex-wrap gap-2">
                                    {result.recommendedProducts.map((product, pidx) => (
                                      <Badge key={pidx} variant="secondary" className="text-xs">{product}</Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default CustomerPainPointAnalysis;
