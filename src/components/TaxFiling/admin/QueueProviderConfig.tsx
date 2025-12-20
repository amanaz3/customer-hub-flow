import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  Database, 
  Cloud, 
  Server, 
  Shield, 
  Zap,
  Settings,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Eye,
  EyeOff
} from "lucide-react";
import { toast } from "sonner";

type ProviderType = 
  | 'supabase' 
  | 'rabbitmq' 
  | 'kafka' 
  | 'temporal' 
  | 'redis' 
  | 'aws_sqs' 
  | 'gcp_pubsub' 
  | 'azure_servicebus'
  | 'bull'
  | 'celery';

type HostingType = 'cloud' | 'self_hosted';

interface ProviderConfig {
  type: ProviderType;
  hosting: HostingType;
  enabled: boolean;
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  vhost?: string;
  ssl?: boolean;
  clusterUrls?: string;
  namespace?: string;
  taskQueue?: string;
  region?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  projectId?: string;
  subscriptionId?: string;
  connectionString?: string;
  redisUrl?: string;
  brokerUrl?: string;
}

interface ProviderInfo {
  name: string;
  icon: typeof Database;
  category: string;
  description: string;
  cloudOnly?: boolean;
  cloudProviders?: string[];
  requiresRedis?: boolean;
  requiresBroker?: boolean;
}

const PROVIDERS: Record<ProviderType, ProviderInfo> = {
  supabase: { 
    name: 'Supabase (Database)', 
    icon: Database, 
    category: 'database',
    description: 'Built-in database-backed queue using Supabase tables',
    cloudOnly: true
  },
  rabbitmq: { 
    name: 'RabbitMQ', 
    icon: Server, 
    category: 'message_broker',
    description: 'Advanced message queuing with routing and exchanges',
    cloudProviders: ['CloudAMQP', 'Amazon MQ', 'Azure Service Bus']
  },
  kafka: { 
    name: 'Apache Kafka', 
    icon: Zap, 
    category: 'streaming',
    description: 'High-throughput distributed streaming platform',
    cloudProviders: ['Confluent Cloud', 'Amazon MSK', 'Azure Event Hubs']
  },
  temporal: { 
    name: 'Temporal', 
    icon: RefreshCw, 
    category: 'workflow',
    description: 'Durable execution and workflow orchestration',
    cloudProviders: ['Temporal Cloud']
  },
  redis: { 
    name: 'Redis', 
    icon: Database, 
    category: 'cache_queue',
    description: 'In-memory data store with pub/sub and streams',
    cloudProviders: ['Redis Cloud', 'Amazon ElastiCache', 'Azure Cache']
  },
  aws_sqs: { 
    name: 'AWS SQS', 
    icon: Cloud, 
    category: 'cloud_native',
    description: 'Fully managed message queuing service',
    cloudOnly: true
  },
  gcp_pubsub: { 
    name: 'Google Pub/Sub', 
    icon: Cloud, 
    category: 'cloud_native',
    description: 'Real-time messaging service for event-driven systems',
    cloudOnly: true
  },
  azure_servicebus: { 
    name: 'Azure Service Bus', 
    icon: Cloud, 
    category: 'cloud_native',
    description: 'Enterprise message broker with queues and topics',
    cloudOnly: true
  },
  bull: { 
    name: 'Bull (Redis)', 
    icon: Zap, 
    category: 'node_queue',
    description: 'Node.js queue library powered by Redis',
    requiresRedis: true
  },
  celery: { 
    name: 'Celery', 
    icon: Server, 
    category: 'task_queue',
    description: 'Distributed task queue for Python applications',
    requiresBroker: true
  }
};

interface QueueProviderConfigProps {
  onSave: (config: ProviderConfig) => void;
}

export function QueueProviderConfig({ onSave }: QueueProviderConfigProps) {
  const [activeProvider, setActiveProvider] = useState<ProviderType>('supabase');
  const [hosting, setHosting] = useState<HostingType>('cloud');
  const [showPassword, setShowPassword] = useState(false);
  const [testing, setTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  
  const [config, setConfig] = useState<Partial<ProviderConfig>>({
    type: 'supabase',
    hosting: 'cloud',
    enabled: true,
    ssl: true,
    port: 5672
  });

  const updateConfig = (key: keyof ProviderConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setConnectionStatus('idle');
    
    // Simulate connection test
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const success = Math.random() > 0.3; // Simulate 70% success rate
    setConnectionStatus(success ? 'success' : 'error');
    
    if (success) {
      toast.success("Connection successful", {
        description: `Connected to ${PROVIDERS[activeProvider].name}`
      });
    } else {
      toast.error("Connection failed", {
        description: "Please check your credentials and try again"
      });
    }
    
    setTesting(false);
  };

  const handleSave = () => {
    onSave({
      ...config,
      type: activeProvider,
      hosting
    } as ProviderConfig);
    toast.success("Configuration saved");
  };

  const provider = PROVIDERS[activeProvider];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Queue Provider Configuration
        </CardTitle>
        <CardDescription>
          Configure your preferred message queue or workflow engine
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Provider Selection */}
        <div className="space-y-4">
          <Label>Select Provider</Label>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid grid-cols-5 w-full">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="database">Database</TabsTrigger>
              <TabsTrigger value="message_broker">Brokers</TabsTrigger>
              <TabsTrigger value="cloud_native">Cloud</TabsTrigger>
              <TabsTrigger value="workflow">Workflow</TabsTrigger>
            </TabsList>
            
            {['all', 'database', 'message_broker', 'cloud_native', 'workflow', 'streaming', 'cache_queue', 'node_queue', 'task_queue'].map(category => (
              <TabsContent key={category} value={category} className="mt-4">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {Object.entries(PROVIDERS)
                    .filter(([_, p]) => category === 'all' || p.category === category)
                    .map(([key, p]) => {
                      const Icon = p.icon;
                      const isActive = activeProvider === key;
                      return (
                        <button
                          key={key}
                          onClick={() => {
                            setActiveProvider(key as ProviderType);
                            setConnectionStatus('idle');
                          }}
                          className={`p-4 rounded-lg border text-left transition-all ${
                            isActive 
                              ? 'border-primary bg-primary/10' 
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Icon className="h-5 w-5" />
                            <span className="font-medium text-sm">{p.name}</span>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {p.description}
                          </p>
                          {p.cloudOnly && (
                            <Badge variant="secondary" className="mt-2 text-xs">
                              Cloud Only
                            </Badge>
                          )}
                        </button>
                      );
                    })}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>

        {/* Hosting Type */}
        {!PROVIDERS[activeProvider].cloudOnly && (
          <div className="space-y-3">
            <Label>Hosting Type</Label>
            <div className="flex gap-3">
              <Button
                variant={hosting === 'cloud' ? 'default' : 'outline'}
                onClick={() => setHosting('cloud')}
                className="flex-1 gap-2"
              >
                <Cloud className="h-4 w-4" />
                Cloud Managed
              </Button>
              <Button
                variant={hosting === 'self_hosted' ? 'default' : 'outline'}
                onClick={() => setHosting('self_hosted')}
                className="flex-1 gap-2"
              >
                <Server className="h-4 w-4" />
                Self-Hosted
              </Button>
            </div>
            {PROVIDERS[activeProvider].cloudProviders && hosting === 'cloud' && (
              <p className="text-sm text-muted-foreground">
                Supported: {PROVIDERS[activeProvider].cloudProviders?.join(', ')}
              </p>
            )}
          </div>
        )}

        {/* Configuration Fields */}
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="connection">
            <AccordionTrigger>Connection Settings</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              {/* Common fields for most providers */}
              {activeProvider !== 'supabase' && (
                <>
                  {/* RabbitMQ / General broker config */}
                  {['rabbitmq', 'redis', 'bull'].includes(activeProvider) && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Host</Label>
                          <Input 
                            placeholder={hosting === 'cloud' ? 'xxx.cloudamqp.com' : 'localhost'}
                            value={config.host || ''}
                            onChange={(e) => updateConfig('host', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Port</Label>
                          <Input 
                            type="number"
                            placeholder={activeProvider === 'redis' ? '6379' : '5672'}
                            value={config.port || ''}
                            onChange={(e) => updateConfig('port', parseInt(e.target.value))}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Username</Label>
                          <Input 
                            placeholder="username"
                            value={config.username || ''}
                            onChange={(e) => updateConfig('username', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Password</Label>
                          <div className="relative">
                            <Input 
                              type={showPassword ? 'text' : 'password'}
                              placeholder="••••••••"
                              value={config.password || ''}
                              onChange={(e) => updateConfig('password', e.target.value)}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                      </div>
                      {activeProvider === 'rabbitmq' && (
                        <div className="space-y-2">
                          <Label>Virtual Host</Label>
                          <Input 
                            placeholder="/"
                            value={config.vhost || '/'}
                            onChange={(e) => updateConfig('vhost', e.target.value)}
                          />
                        </div>
                      )}
                    </>
                  )}

                  {/* Kafka config */}
                  {activeProvider === 'kafka' && (
                    <>
                      <div className="space-y-2">
                        <Label>Bootstrap Servers</Label>
                        <Input 
                          placeholder="broker1:9092,broker2:9092"
                          value={config.clusterUrls || ''}
                          onChange={(e) => updateConfig('clusterUrls', e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                          Comma-separated list of broker addresses
                        </p>
                      </div>
                      {hosting === 'cloud' && (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>API Key</Label>
                            <Input 
                              placeholder="API Key"
                              value={config.accessKeyId || ''}
                              onChange={(e) => updateConfig('accessKeyId', e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>API Secret</Label>
                            <Input 
                              type="password"
                              placeholder="API Secret"
                              value={config.secretAccessKey || ''}
                              onChange={(e) => updateConfig('secretAccessKey', e.target.value)}
                            />
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Temporal config */}
                  {activeProvider === 'temporal' && (
                    <>
                      <div className="space-y-2">
                        <Label>Temporal Server Address</Label>
                        <Input 
                          placeholder={hosting === 'cloud' ? 'your-namespace.tmprl.cloud:7233' : 'localhost:7233'}
                          value={config.host || ''}
                          onChange={(e) => updateConfig('host', e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Namespace</Label>
                          <Input 
                            placeholder="default"
                            value={config.namespace || 'default'}
                            onChange={(e) => updateConfig('namespace', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Task Queue</Label>
                          <Input 
                            placeholder="tax-filing-queue"
                            value={config.taskQueue || 'tax-filing-queue'}
                            onChange={(e) => updateConfig('taskQueue', e.target.value)}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* AWS SQS config */}
                  {activeProvider === 'aws_sqs' && (
                    <>
                      <div className="space-y-2">
                        <Label>AWS Region</Label>
                        <Select 
                          value={config.region || 'us-east-1'}
                          onValueChange={(v) => updateConfig('region', v)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="us-east-1">US East (N. Virginia)</SelectItem>
                            <SelectItem value="us-west-2">US West (Oregon)</SelectItem>
                            <SelectItem value="eu-west-1">EU (Ireland)</SelectItem>
                            <SelectItem value="ap-southeast-1">Asia Pacific (Singapore)</SelectItem>
                            <SelectItem value="me-south-1">Middle East (Bahrain)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Access Key ID</Label>
                          <Input 
                            placeholder="AKIA..."
                            value={config.accessKeyId || ''}
                            onChange={(e) => updateConfig('accessKeyId', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Secret Access Key</Label>
                          <Input 
                            type="password"
                            placeholder="••••••••"
                            value={config.secretAccessKey || ''}
                            onChange={(e) => updateConfig('secretAccessKey', e.target.value)}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* GCP Pub/Sub config */}
                  {activeProvider === 'gcp_pubsub' && (
                    <>
                      <div className="space-y-2">
                        <Label>GCP Project ID</Label>
                        <Input 
                          placeholder="my-project-id"
                          value={config.projectId || ''}
                          onChange={(e) => updateConfig('projectId', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Service Account JSON</Label>
                        <Input 
                          type="file"
                          accept=".json"
                          className="cursor-pointer"
                        />
                        <p className="text-xs text-muted-foreground">
                          Upload your service account key file
                        </p>
                      </div>
                    </>
                  )}

                  {/* Azure Service Bus config */}
                  {activeProvider === 'azure_servicebus' && (
                    <div className="space-y-2">
                      <Label>Connection String</Label>
                      <Input 
                        placeholder="Endpoint=sb://..."
                        value={config.connectionString || ''}
                        onChange={(e) => updateConfig('connectionString', e.target.value)}
                      />
                    </div>
                  )}

                  {/* Celery config */}
                  {activeProvider === 'celery' && (
                    <div className="space-y-2">
                      <Label>Broker URL</Label>
                      <Input 
                        placeholder="amqp://guest:guest@localhost:5672//"
                        value={config.brokerUrl || ''}
                        onChange={(e) => updateConfig('brokerUrl', e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Supports RabbitMQ (amqp://) or Redis (redis://)
                      </p>
                    </div>
                  )}
                </>
              )}

              {activeProvider === 'supabase' && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 text-primary">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Supabase is already configured</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Using built-in database tables for queue management. No additional configuration required.
                  </p>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="security">
            <AccordionTrigger>Security Settings</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable SSL/TLS</Label>
                  <p className="text-sm text-muted-foreground">
                    Encrypt connections to the queue provider
                  </p>
                </div>
                <Switch 
                  checked={config.ssl ?? true}
                  onCheckedChange={(v) => updateConfig('ssl', v)}
                />
              </div>
              <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg">
                <Shield className="h-4 w-4 text-primary" />
                <span className="text-sm">
                  Credentials are stored securely as Supabase secrets
                </span>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="advanced">
            <AccordionTrigger>Advanced Settings</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Provider</Label>
                  <p className="text-sm text-muted-foreground">
                    Activate this queue provider
                  </p>
                </div>
                <Switch 
                  checked={config.enabled ?? true}
                  onCheckedChange={(v) => updateConfig('enabled', v)}
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={handleTestConnection}
            disabled={testing || activeProvider === 'supabase'}
            className="gap-2"
          >
            {testing ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : connectionStatus === 'success' ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : connectionStatus === 'error' ? (
              <AlertCircle className="h-4 w-4 text-red-500" />
            ) : (
              <Zap className="h-4 w-4" />
            )}
            Test Connection
          </Button>
          <Button onClick={handleSave} className="gap-2">
            <CheckCircle className="h-4 w-4" />
            Save Configuration
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
