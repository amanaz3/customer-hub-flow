import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bot, Save, RefreshCw, Code, MessageSquare, Settings2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/SecureAuthContext';

interface AIConfig {
  id: string;
  name: string;
  system_prompt: string;
  greeting_message: string;
  is_active: boolean;
  model: string;
  workflow_rules: any;
  api_mappings: any;
}

const AIAssistantConfig = () => {
  const { isAdmin } = useAuth();
  const [config, setConfig] = useState<AIConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [workflowRulesJson, setWorkflowRulesJson] = useState('');
  const [apiMappingsJson, setApiMappingsJson] = useState('');

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_assistant_config')
        .select('*')
        .eq('is_active', true)
        .single();

      if (error) throw error;

      setConfig(data as AIConfig);
      setWorkflowRulesJson(JSON.stringify(data.workflow_rules, null, 2));
      setApiMappingsJson(JSON.stringify(data.api_mappings, null, 2));
    } catch (error: any) {
      console.error('Error fetching AI config:', error);
      toast.error('Failed to load AI configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!config || !isAdmin) return;

    setSaving(true);
    try {
      // Parse JSON fields
      let parsedWorkflowRules;
      let parsedApiMappings;

      try {
        parsedWorkflowRules = JSON.parse(workflowRulesJson);
      } catch {
        toast.error('Invalid JSON in Workflow Rules');
        setSaving(false);
        return;
      }

      try {
        parsedApiMappings = JSON.parse(apiMappingsJson);
      } catch {
        toast.error('Invalid JSON in API Mappings');
        setSaving(false);
        return;
      }

      const { error } = await supabase
        .from('ai_assistant_config')
        .update({
          system_prompt: config.system_prompt,
          greeting_message: config.greeting_message,
          is_active: config.is_active,
          model: config.model,
          workflow_rules: parsedWorkflowRules,
          api_mappings: parsedApiMappings,
        })
        .eq('id', config.id);

      if (error) throw error;

      toast.success('AI Assistant configuration saved');
    } catch (error: any) {
      console.error('Error saving config:', error);
      toast.error('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!config) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No AI configuration found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Bot className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">AI Assistant Configuration</h1>
            <p className="text-muted-foreground">Configure the AI chatbot behavior and responses</p>
          </div>
        </div>
        {isAdmin && (
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save Changes
          </Button>
        )}
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings2 className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="prompt" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Prompts
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            Advanced
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Basic configuration for the AI Assistant</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable AI Assistant</Label>
                  <p className="text-sm text-muted-foreground">Turn the AI chatbot on or off</p>
                </div>
                <Switch
                  checked={config.is_active}
                  onCheckedChange={(checked) => setConfig({ ...config, is_active: checked })}
                  disabled={!isAdmin}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">AI Model</Label>
                <Input
                  id="model"
                  value={config.model}
                  onChange={(e) => setConfig({ ...config, model: e.target.value })}
                  placeholder="gpt-4o-mini"
                  disabled={!isAdmin}
                />
                <p className="text-xs text-muted-foreground">The AI model to use for responses</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="greeting">Greeting Message</Label>
                <Textarea
                  id="greeting"
                  value={config.greeting_message}
                  onChange={(e) => setConfig({ ...config, greeting_message: e.target.value })}
                  rows={3}
                  disabled={!isAdmin}
                />
                <p className="text-xs text-muted-foreground">The initial message shown to users</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prompt">
          <Card>
            <CardHeader>
              <CardTitle>System Prompt</CardTitle>
              <CardDescription>Define the AI's personality, capabilities, and behavior</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={config.system_prompt}
                onChange={(e) => setConfig({ ...config, system_prompt: e.target.value })}
                rows={15}
                className="font-mono text-sm"
                disabled={!isAdmin}
              />
              <p className="text-xs text-muted-foreground mt-2">
                This prompt instructs the AI on how to behave and respond to users
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Workflow Rules</CardTitle>
                <CardDescription>JSON configuration for conversation flow and steps</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={workflowRulesJson}
                  onChange={(e) => setWorkflowRulesJson(e.target.value)}
                  rows={10}
                  className="font-mono text-sm"
                  disabled={!isAdmin}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>API Mappings</CardTitle>
                <CardDescription>JSON configuration for API endpoint mappings</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={apiMappingsJson}
                  onChange={(e) => setApiMappingsJson(e.target.value)}
                  rows={8}
                  className="font-mono text-sm"
                  disabled={!isAdmin}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIAssistantConfig;
