import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Database, Brain, Shield, Zap, Save, RefreshCw, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export const SearchSettings = () => {
  const [settings, setSettings] = useState({
    // Vector Database
    vectorDb: "pinecone",
    embeddingModel: "text-embedding-3-large",
    topK: 10,
    similarityThreshold: 0.7,

    // AI Settings
    llmModel: "gpt-4",
    temperature: 0.3,
    maxTokens: 2000,
    enableStreaming: true,

    // Search Behavior
    enableHybridSearch: true,
    metadataFiltering: true,
    ragOnDemand: true,
    cacheResults: true,
    cacheDuration: 3600,

    // Compliance
    enableComplianceFlags: true,
    autoFlagSeverity: "medium",
    requireApprovalForHighRisk: true
  });

  const handleSave = () => {
    toast.success("Settings saved successfully");
  };

  const handleReset = () => {
    toast.info("Settings reset to defaults");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Search & AI Settings</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Reset
          </Button>
          <Button onClick={handleSave} className="gap-2">
            <Save className="h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Vector Database Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              Vector Database
            </CardTitle>
            <CardDescription>Configure semantic search and embeddings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Vector Database Provider</Label>
              <Select
                value={settings.vectorDb}
                onValueChange={(value) => setSettings({ ...settings, vectorDb: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pinecone">Pinecone</SelectItem>
                  <SelectItem value="weaviate">Weaviate</SelectItem>
                  <SelectItem value="milvus">Milvus</SelectItem>
                  <SelectItem value="qdrant">Qdrant</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Embedding Model</Label>
              <Select
                value={settings.embeddingModel}
                onValueChange={(value) => setSettings({ ...settings, embeddingModel: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text-embedding-3-large">text-embedding-3-large</SelectItem>
                  <SelectItem value="text-embedding-3-small">text-embedding-3-small</SelectItem>
                  <SelectItem value="text-embedding-ada-002">text-embedding-ada-002</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Top K Results</Label>
                <span className="text-sm text-muted-foreground">{settings.topK}</span>
              </div>
              <Slider
                value={[settings.topK]}
                onValueChange={([value]) => setSettings({ ...settings, topK: value })}
                min={1}
                max={50}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Similarity Threshold</Label>
                <span className="text-sm text-muted-foreground">{settings.similarityThreshold}</span>
              </div>
              <Slider
                value={[settings.similarityThreshold]}
                onValueChange={([value]) => setSettings({ ...settings, similarityThreshold: value })}
                min={0.1}
                max={1}
                step={0.05}
              />
            </div>
          </CardContent>
        </Card>

        {/* AI Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              AI Configuration
            </CardTitle>
            <CardDescription>Configure LLM for summarization and Q&A</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>LLM Model</Label>
              <Select
                value={settings.llmModel}
                onValueChange={(value) => setSettings({ ...settings, llmModel: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-4">GPT-4</SelectItem>
                  <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                  <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                  <SelectItem value="claude-3-opus">Claude 3 Opus</SelectItem>
                  <SelectItem value="claude-3-sonnet">Claude 3 Sonnet</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Temperature</Label>
                <span className="text-sm text-muted-foreground">{settings.temperature}</span>
              </div>
              <Slider
                value={[settings.temperature]}
                onValueChange={([value]) => setSettings({ ...settings, temperature: value })}
                min={0}
                max={1}
                step={0.1}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Max Tokens</Label>
                <span className="text-sm text-muted-foreground">{settings.maxTokens}</span>
              </div>
              <Slider
                value={[settings.maxTokens]}
                onValueChange={([value]) => setSettings({ ...settings, maxTokens: value })}
                min={256}
                max={4096}
                step={256}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Enable Streaming</Label>
                <p className="text-xs text-muted-foreground">Stream responses in real-time</p>
              </div>
              <Switch
                checked={settings.enableStreaming}
                onCheckedChange={(checked) => setSettings({ ...settings, enableStreaming: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Search Behavior */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Search Behavior
            </CardTitle>
            <CardDescription>Configure search strategies and caching</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Hybrid Search</Label>
                <p className="text-xs text-muted-foreground">Combine vector + keyword search</p>
              </div>
              <Switch
                checked={settings.enableHybridSearch}
                onCheckedChange={(checked) => setSettings({ ...settings, enableHybridSearch: checked })}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label>Metadata Filtering</Label>
                <p className="text-xs text-muted-foreground">Filter by module, date, type</p>
              </div>
              <Switch
                checked={settings.metadataFiltering}
                onCheckedChange={(checked) => setSettings({ ...settings, metadataFiltering: checked })}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label>RAG On-Demand</Label>
                <p className="text-xs text-muted-foreground">Only use RAG when needed</p>
              </div>
              <Switch
                checked={settings.ragOnDemand}
                onCheckedChange={(checked) => setSettings({ ...settings, ragOnDemand: checked })}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label>Cache Results</Label>
                <p className="text-xs text-muted-foreground">Cache similar queries</p>
              </div>
              <Switch
                checked={settings.cacheResults}
                onCheckedChange={(checked) => setSettings({ ...settings, cacheResults: checked })}
              />
            </div>

            {settings.cacheResults && (
              <div className="space-y-2">
                <Label>Cache Duration (seconds)</Label>
                <Input
                  type="number"
                  value={settings.cacheDuration}
                  onChange={(e) => setSettings({ ...settings, cacheDuration: parseInt(e.target.value) })}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Compliance Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Compliance
            </CardTitle>
            <CardDescription>Configure compliance detection and alerts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Enable Compliance Flags</Label>
                <p className="text-xs text-muted-foreground">Auto-detect compliance issues</p>
              </div>
              <Switch
                checked={settings.enableComplianceFlags}
                onCheckedChange={(checked) => setSettings({ ...settings, enableComplianceFlags: checked })}
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Auto-Flag Severity</Label>
              <Select
                value={settings.autoFlagSeverity}
                onValueChange={(value) => setSettings({ ...settings, autoFlagSeverity: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low (All issues)</SelectItem>
                  <SelectItem value="medium">Medium (Warnings & Errors)</SelectItem>
                  <SelectItem value="high">High (Errors only)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label>Require Approval for High Risk</Label>
                <p className="text-xs text-muted-foreground">Force review for critical items</p>
              </div>
              <Switch
                checked={settings.requireApprovalForHighRisk}
                onCheckedChange={(checked) => setSettings({ ...settings, requireApprovalForHighRisk: checked })}
              />
            </div>

            <div className="rounded-lg bg-muted p-3">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Bookkeeping Ready</span>
              </div>
              <p className="text-xs text-muted-foreground">
                All outputs are structured for bookkeeping and tax automation compliance.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
