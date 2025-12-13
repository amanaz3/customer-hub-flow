import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
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
  Building2,
  Globe
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
  [key: string]: string | undefined;
}

interface AnalysisResult {
  customer: CustomerData;
  riskLevel: 'low' | 'medium' | 'high';
  riskScore: number;
  painPoints: string[];
  recommendations: string[];
  documentationGaps: string[];
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

const CustomerPainPointAnalysis = () => {
  const [folders, setFolders] = useState<FolderInfo[]>([]);
  const [allCustomers, setAllCustomers] = useState<CustomerData[]>([]);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadStats, setUploadStats] = useState({ folders: 0, files: 0, customers: 0 });

  const parseExcelFile = async (file: File): Promise<CustomerData[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet) as CustomerData[];
          
          // Normalize column names
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
          // Continue with next batch
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

  const highRiskCount = analysisResults.filter(r => r.riskLevel === 'high').length;
  const mediumRiskCount = analysisResults.filter(r => r.riskLevel === 'medium').length;
  const lowRiskCount = analysisResults.filter(r => r.riskLevel === 'low').length;

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Upload Customer Data
          </CardTitle>
          <CardDescription>
            Select a parent directory containing child folders with Excel files (.xlsx, .xls, .csv)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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

          {allCustomers.length > 0 && (
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

          {isAnalyzing && (
            <Progress value={progress} className="mt-2" />
          )}
        </CardContent>
      </Card>

      {/* Results Section */}
      {analysisResults.length > 0 && (
        <>
          {/* Summary Stats */}
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

          {/* Export Button */}
          <div className="flex justify-end">
            <Button variant="outline" onClick={exportResults}>
              <Download className="h-4 w-4 mr-2" />
              Export Results
            </Button>
          </div>

          {/* Detailed Results */}
          <Card>
            <CardHeader>
              <CardTitle>Analysis Results</CardTitle>
              <CardDescription>
                Customers sorted by risk level (high risk first)
              </CardDescription>
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

                          {result.painPoints.length > 0 && (
                            <div className="mb-3">
                              <p className="text-sm font-medium mb-1 text-red-600">Pain Points:</p>
                              <ul className="text-sm text-muted-foreground list-disc list-inside">
                                {result.painPoints.map((point, i) => (
                                  <li key={i}>{point}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {result.documentationGaps.length > 0 && (
                            <div className="mb-3">
                              <p className="text-sm font-medium mb-1 text-yellow-600">Documentation Gaps:</p>
                              <ul className="text-sm text-muted-foreground list-disc list-inside">
                                {result.documentationGaps.map((gap, i) => (
                                  <li key={i}>{gap}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {result.recommendations.length > 0 && (
                            <div>
                              <p className="text-sm font-medium mb-1 text-green-600">Recommendations:</p>
                              <ul className="text-sm text-muted-foreground list-disc list-inside">
                                {result.recommendations.map((rec, i) => (
                                  <li key={i}>{rec}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default CustomerPainPointAnalysis;
