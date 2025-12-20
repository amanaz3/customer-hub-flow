import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  Upload,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface VectorDBStatusProps {
  onUploadClick?: () => void;
}

export function VectorDBStatus({ onUploadClick }: VectorDBStatusProps) {
  const [status, setStatus] = useState<'checking' | 'ready' | 'empty' | 'error'>('checking');
  const [embeddingCount, setEmbeddingCount] = useState(0);

  useEffect(() => {
    checkEmbeddingsStatus();
  }, []);

  const checkEmbeddingsStatus = async () => {
    setStatus('checking');
    try {
      // Try to query the table - if it doesn't exist, we'll catch the error
      const { data, error } = await supabase
        .rpc('get_public_tables');

      if (error) {
        setStatus('empty');
        return;
      }

      // Check if our embeddings table exists
      const tableExists = data?.some((t: { table_name: string }) => 
        t.table_name === 'tax_knowledge_embeddings'
      );

      if (!tableExists) {
        setStatus('empty');
        setEmbeddingCount(0);
        return;
      }

      // Table exists, check count using raw query approach
      // For now, assume ready if table exists
      setStatus('ready');
      setEmbeddingCount(0); // Will be updated when table has data
    } catch (error) {
      console.error('Error checking embeddings status:', error);
      setStatus('empty');
    }
  };

  const handleUploadClick = () => {
    if (onUploadClick) {
      onUploadClick();
    } else {
      toast.info('Go to AI Assistant Settings tab to configure and upload tax knowledge documents.');
    }
  };

  return (
    <Card className={cn(
      "transition-all",
      status === 'ready' && "border-green-500/30 bg-green-500/5",
      status === 'empty' && "border-amber-500/30 bg-amber-500/5",
      status === 'error' && "border-red-500/30 bg-red-500/5"
    )}>
      <CardContent className="py-3 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg",
              status === 'ready' && "bg-green-500/10",
              status === 'empty' && "bg-amber-500/10",
              status === 'checking' && "bg-muted",
              status === 'error' && "bg-red-500/10"
            )}>
              {status === 'checking' ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : status === 'ready' ? (
                <Database className="h-4 w-4 text-green-500" />
              ) : status === 'error' ? (
                <AlertCircle className="h-4 w-4 text-red-500" />
              ) : (
                <Database className="h-4 w-4 text-amber-500" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Tax Knowledge Base</span>
                {status === 'ready' && (
                  <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/30">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Ready
                  </Badge>
                )}
                {status === 'empty' && (
                  <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/30">
                    Not Configured
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {status === 'ready' 
                  ? `${embeddingCount} embeddings loaded (UAE tax laws, FTA circulars)`
                  : status === 'empty'
                  ? 'Upload UAE tax laws & regulations for AI-powered guidance'
                  : status === 'checking'
                  ? 'Checking embeddings status...'
                  : 'Error checking status'}
              </p>
            </div>
          </div>

          {status === 'empty' && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleUploadClick}
              className="gap-2 text-amber-600 border-amber-500/30 hover:bg-amber-500/10"
            >
              <Upload className="h-3 w-3" />
              Upload Docs
            </Button>
          )}

          {status === 'ready' && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleUploadClick}
              className="gap-2 text-green-600"
            >
              <Sparkles className="h-3 w-3" />
              Manage
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
