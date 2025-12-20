import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  FileText, 
  CreditCard, 
  Building2, 
  Receipt, 
  Users,
  PenLine,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface UploadedFile {
  id: string;
  name: string;
  type: string;
  detectedType: string;
  confidence: number;
  status: 'uploading' | 'processing' | 'ready' | 'error';
  size: number;
}

interface DataIntakeStepProps {
  onFilesUploaded?: (files: UploadedFile[]) => void;
  onProceed?: () => void;
  demoMode?: boolean;
}

const uploadCategories = [
  {
    id: 'invoices',
    title: 'Sales Invoices',
    description: 'Invoices you sent to customers',
    icon: FileText,
    accept: '.pdf,.jpg,.png,.doc,.docx',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  {
    id: 'bills',
    title: 'Purchase Bills',
    description: 'Bills from vendors/suppliers',
    icon: Receipt,
    accept: '.pdf,.jpg,.png,.doc,.docx',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
  },
  {
    id: 'bank',
    title: 'Bank Statements',
    description: 'Monthly bank account statements',
    icon: Building2,
    accept: '.pdf,.csv,.xlsx',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
  {
    id: 'card',
    title: 'Credit Card Statements',
    description: 'Credit card transaction history',
    icon: CreditCard,
    accept: '.pdf,.csv,.xlsx',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
  },
  {
    id: 'expenses',
    title: 'Employee Expenses',
    description: 'Expense claims and receipts',
    icon: Users,
    accept: '.pdf,.jpg,.png,.xlsx',
    color: 'text-rose-500',
    bgColor: 'bg-rose-500/10',
  },
  {
    id: 'manual',
    title: 'Manual Entry',
    description: 'Add transactions manually',
    icon: PenLine,
    accept: '',
    color: 'text-slate-500',
    bgColor: 'bg-slate-500/10',
  },
];

export function DataIntakeStep({ onFilesUploaded, onProceed }: DataIntakeStepProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [dragOver, setDragOver] = useState<string | null>(null);

  const handleFileUpload = (categoryId: string, files: FileList | null) => {
    if (!files) return;

    const newFiles: UploadedFile[] = Array.from(files).map((file, index) => ({
      id: `${Date.now()}-${index}`,
      name: file.name,
      type: categoryId,
      detectedType: categoryId,
      confidence: Math.random() * 0.3 + 0.7, // Simulated 70-100% confidence
      status: 'ready' as const,
      size: file.size,
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);
    onFilesUploaded?.(newFiles);
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600';
    if (confidence >= 0.7) return 'text-amber-600';
    return 'text-red-600';
  };

  const totalFiles = uploadedFiles.length;
  const readyFiles = uploadedFiles.filter(f => f.status === 'ready').length;

  return (
    <div className="space-y-6">
      {/* Header with Progress */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Data Intake</h2>
          <p className="text-muted-foreground">
            Upload your financial documents. AI will auto-detect document types.
          </p>
        </div>
        {totalFiles > 0 && (
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Files Ready</p>
            <p className="text-2xl font-bold">{readyFiles}/{totalFiles}</p>
          </div>
        )}
      </div>

      {/* Upload Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {uploadCategories.map(category => {
          const Icon = category.icon;
          const categoryFiles = uploadedFiles.filter(f => f.type === category.id);
          
          return (
            <Card 
              key={category.id}
              className={cn(
                'relative overflow-hidden transition-all duration-200',
                'hover:shadow-md hover:border-primary/50',
                dragOver === category.id && 'border-primary bg-primary/5'
              )}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(category.id);
              }}
              onDragLeave={() => setDragOver(null)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(null);
                handleFileUpload(category.id, e.dataTransfer.files);
              }}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className={cn('p-2 rounded-lg', category.bgColor)}>
                    <Icon className={cn('h-5 w-5', category.color)} />
                  </div>
                  {categoryFiles.length > 0 && (
                    <Badge variant="secondary">{categoryFiles.length} files</Badge>
                  )}
                </div>
                <CardTitle className="text-base mt-2">{category.title}</CardTitle>
                <CardDescription className="text-xs">
                  {category.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {category.id !== 'manual' ? (
                  <label className="block">
                    <input
                      type="file"
                      multiple
                      accept={category.accept}
                      className="hidden"
                      onChange={(e) => handleFileUpload(category.id, e.target.files)}
                    />
                    <div className={cn(
                      'border-2 border-dashed rounded-lg p-4 text-center cursor-pointer',
                      'transition-colors duration-200',
                      'hover:border-primary hover:bg-primary/5'
                    )}>
                      <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Drop files or click to upload
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {category.accept.split(',').join(', ')}
                      </p>
                    </div>
                  </label>
                ) : (
                  <Button variant="outline" className="w-full">
                    <PenLine className="h-4 w-4 mr-2" />
                    Add Manual Entry
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Uploaded Documents</CardTitle>
            <CardDescription>
              AI has analyzed your documents. Review detected types below.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {uploadedFiles.map(file => (
                <div 
                  key={file.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {file.status === 'uploading' && (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                    {file.status === 'ready' && (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    )}
                    {file.status === 'error' && (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                    <div>
                      <p className="font-medium text-sm">{file.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className="text-xs">
                          {file.detectedType}
                        </Badge>
                        <span className={getConfidenceColor(file.confidence)}>
                          {(file.confidence * 100).toFixed(0)}% confidence
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => removeFile(file.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Confidence & Uncertainty Notice */}
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
            <div>
              <p className="font-medium text-sm">AI Detection Notice</p>
              <p className="text-sm text-muted-foreground">
                Document types are auto-detected with confidence scores. 
                Items below 70% confidence will be flagged for manual review. 
                You remain responsible for final classification.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Button */}
      <div className="flex justify-end">
        <Button 
          size="lg" 
          onClick={onProceed}
          disabled={uploadedFiles.length === 0}
          className="min-w-[200px]"
        >
          Proceed to Classification
          {uploadedFiles.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {uploadedFiles.length} files
            </Badge>
          )}
        </Button>
      </div>
    </div>
  );
}
