import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { 
  Database, 
  Cloud, 
  Server, 
  Check, 
  Sparkles,
  ArrowRight,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface VectorDBOption {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  pros: string[];
  cons: string[];
  recommended?: boolean;
  integrated?: boolean;
}

const vectorDBOptions: VectorDBOption[] = [
  {
    id: 'pgvector',
    name: 'pgvector (Supabase)',
    icon: <Database className="h-5 w-5" />,
    description: 'PostgreSQL extension for vector similarity search, native to Supabase',
    pros: ['No external service', 'Zero additional cost', 'Already integrated with Supabase'],
    cons: ['Limited scale (best for <100K docs)', 'Slightly slower at high volume'],
    recommended: true,
    integrated: true,
  },
  {
    id: 'pinecone',
    name: 'Pinecone',
    icon: <Cloud className="h-5 w-5" />,
    description: 'Managed vector database optimized for production ML workloads',
    pros: ['Highly scalable', 'Fast queries', 'Managed infrastructure'],
    cons: ['External service', 'API costs', 'Requires API key'],
  },
  {
    id: 'weaviate',
    name: 'Weaviate',
    icon: <Server className="h-5 w-5" />,
    description: 'Open-source vector database with hybrid search capabilities',
    pros: ['Self-hosted option', 'Hybrid search', 'GraphQL API'],
    cons: ['Complex setup', 'Requires infrastructure', 'More maintenance'],
  },
];

interface VectorDBSettingsProps {
  onSetupComplete?: (provider: string) => void;
}

export function VectorDBSettings({ onSetupComplete }: VectorDBSettingsProps) {
  const [selectedDB, setSelectedDB] = useState('pgvector');
  const [isSettingUp, setIsSettingUp] = useState(false);

  const handleSetup = () => {
    setIsSettingUp(true);
    // Trigger the setup flow
    onSetupComplete?.(selectedDB);
  };

  const selectedOption = vectorDBOptions.find(opt => opt.id === selectedDB);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Vector Database for AI Features
        </CardTitle>
        <CardDescription>
          Choose a vector database to enable semantic search and AI-powered features like document Q&A and smart matching.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <RadioGroup value={selectedDB} onValueChange={setSelectedDB} className="space-y-3">
          {vectorDBOptions.map((option) => (
            <div
              key={option.id}
              className={cn(
                "relative flex items-start gap-4 rounded-lg border p-4 transition-all cursor-pointer",
                selectedDB === option.id 
                  ? "border-primary bg-primary/5" 
                  : "border-border hover:border-primary/50"
              )}
              onClick={() => setSelectedDB(option.id)}
            >
              <RadioGroupItem value={option.id} id={option.id} className="mt-1" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "p-1.5 rounded",
                    selectedDB === option.id ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                  )}>
                    {option.icon}
                  </div>
                  <Label htmlFor={option.id} className="font-medium cursor-pointer">
                    {option.name}
                  </Label>
                  {option.recommended && (
                    <Badge variant="default" className="text-xs">Recommended</Badge>
                  )}
                  {option.integrated && (
                    <Badge variant="outline" className="text-xs">Integrated</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{option.description}</p>
                
                {selectedDB === option.id && (
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                      <p className="text-xs font-medium text-green-600 dark:text-green-400 mb-1">Pros</p>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {option.pros.map((pro, i) => (
                          <li key={i} className="flex items-start gap-1">
                            <Check className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                            {pro}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-amber-600 dark:text-amber-400 mb-1">Cons</p>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {option.cons.map((con, i) => (
                          <li key={i} className="flex items-start gap-1">
                            <Info className="h-3 w-3 text-amber-500 mt-0.5 flex-shrink-0" />
                            {con}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </RadioGroup>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            Selected: <span className="font-medium text-foreground">{selectedOption?.name}</span>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={handleSetup} disabled={isSettingUp}>
                  {isSettingUp ? 'Setting up...' : 'Create Embeddings Table'}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>This will create a table to store document embeddings for AI features</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardContent>
    </Card>
  );
}
