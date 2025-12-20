import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Settings, 
  Play, 
  Pause, 
  RefreshCw, 
  Zap, 
  Users, 
  AlertTriangle,
  Activity,
  Server,
  Clock
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { QueueConfig } from "@/hooks/useTaxFilingJobs";

interface AdminControlsPanelProps {
  queues: QueueConfig[];
  onRefresh: () => void;
}

export function AdminControlsPanel({ queues, onRefresh }: AdminControlsPanelProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [autoProcessEnabled, setAutoProcessEnabled] = useState(false);
  const [riskThreshold, setRiskThreshold] = useState([70]);
  const [batchSize, setBatchSize] = useState("10");

  const triggerQueueProcessing = async () => {
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('tax-filing-orchestrator', {
        body: { action: 'process_queue' }
      });

      if (error) throw error;

      toast.success("Queue processing triggered", {
        description: `Processed ${data?.batch?.length || 0} jobs`
      });
      onRefresh();
    } catch (error) {
      console.error('Queue processing error:', error);
      toast.error("Failed to process queue");
    } finally {
      setIsProcessing(false);
    }
  };

  const updateQueueConfig = async (queueName: string, updates: Partial<QueueConfig>) => {
    try {
      const { error } = await supabase
        .from('tax_filing_queue_config')
        .update(updates)
        .eq('queue_name', queueName);

      if (error) throw error;

      toast.success(`Queue "${queueName}" updated`);
      onRefresh();
    } catch (error) {
      console.error('Queue update error:', error);
      toast.error("Failed to update queue");
    }
  };

  const pauseAllQueues = async () => {
    try {
      const { error } = await supabase
        .from('tax_filing_queue_config')
        .update({ is_paused: true })
        .neq('queue_name', '');

      if (error) throw error;

      toast.success("All queues paused");
      onRefresh();
    } catch (error) {
      toast.error("Failed to pause queues");
    }
  };

  const resumeAllQueues = async () => {
    try {
      const { error } = await supabase
        .from('tax_filing_queue_config')
        .update({ is_paused: false })
        .neq('queue_name', '');

      if (error) throw error;

      toast.success("All queues resumed");
      onRefresh();
    } catch (error) {
      toast.error("Failed to resume queues");
    }
  };

  const allPaused = queues.every(q => q.is_paused);
  const anyPaused = queues.some(q => q.is_paused);

  return (
    <div className="space-y-6">
      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <Server className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{queues.length}</p>
              <p className="text-sm text-muted-foreground">Active Queues</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">
                {queues.reduce((sum, q) => sum + q.max_workers, 0)}
              </p>
              <p className="text-sm text-muted-foreground">Total Workers</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <Clock className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{anyPaused ? "Partial" : "Active"}</p>
              <p className="text-sm text-muted-foreground">Processing Status</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <Zap className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{autoProcessEnabled ? "On" : "Off"}</p>
              <p className="text-sm text-muted-foreground">Auto Process</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Global Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Global Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={triggerQueueProcessing} 
              disabled={isProcessing}
              className="gap-2"
            >
              {isProcessing ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              Process Queue Now
            </Button>
            
            {allPaused ? (
              <Button variant="outline" onClick={resumeAllQueues} className="gap-2">
                <Play className="h-4 w-4" />
                Resume All Queues
              </Button>
            ) : (
              <Button variant="outline" onClick={pauseAllQueues} className="gap-2">
                <Pause className="h-4 w-4" />
                Pause All Queues
              </Button>
            )}

            <Button variant="outline" onClick={onRefresh} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh Status
            </Button>
          </div>

          <Separator />

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-Process Queue</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically process jobs when ready
                  </p>
                </div>
                <Switch 
                  checked={autoProcessEnabled}
                  onCheckedChange={setAutoProcessEnabled}
                />
              </div>

              <div className="space-y-2">
                <Label>Batch Size</Label>
                <Input 
                  type="number" 
                  value={batchSize}
                  onChange={(e) => setBatchSize(e.target.value)}
                  min="1"
                  max="100"
                />
                <p className="text-sm text-muted-foreground">
                  Jobs to process per batch
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Risk Threshold</Label>
                  <Badge variant="outline">{riskThreshold[0]}%</Badge>
                </div>
                <Slider
                  value={riskThreshold}
                  onValueChange={setRiskThreshold}
                  max={100}
                  step={5}
                />
                <p className="text-sm text-muted-foreground">
                  Jobs above this score are prioritized for review
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Queue Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Queue Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {queues.map((queue) => (
              <div 
                key={queue.id} 
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div>
                    <p className="font-medium capitalize">
                      {queue.queue_name.replace(/_/g, ' ')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Priority: {queue.priority_weight} | Max Workers: {queue.max_workers}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {queue.is_paused && (
                    <Badge variant="secondary">
                      <Pause className="h-3 w-3 mr-1" />
                      Paused
                    </Badge>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`workers-${queue.id}`} className="text-sm">
                      Workers:
                    </Label>
                    <Input
                      id={`workers-${queue.id}`}
                      type="number"
                      value={queue.max_workers}
                      onChange={(e) => updateQueueConfig(queue.queue_name, {
                        max_workers: parseInt(e.target.value) || 1
                      })}
                      className="w-16 h-8"
                      min="1"
                      max="20"
                    />
                  </div>

                  <Button
                    size="sm"
                    variant={queue.is_paused ? "default" : "outline"}
                    onClick={() => updateQueueConfig(queue.queue_name, {
                      is_paused: !queue.is_paused
                    })}
                  >
                    {queue.is_paused ? (
                      <Play className="h-4 w-4" />
                    ) : (
                      <Pause className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Alerts & Warnings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            System Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {anyPaused && (
              <div className="flex items-center gap-2 p-3 bg-warning/10 text-warning rounded-lg">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm">Some queues are paused</span>
              </div>
            )}
            {queues.some(q => q.max_workers < 2) && (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Consider increasing workers for better throughput
                </span>
              </div>
            )}
            {!anyPaused && queues.every(q => q.max_workers >= 2) && (
              <div className="flex items-center gap-2 p-3 bg-primary/10 text-primary rounded-lg">
                <Activity className="h-4 w-4" />
                <span className="text-sm">System operating normally</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
