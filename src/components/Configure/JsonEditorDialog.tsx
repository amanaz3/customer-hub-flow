import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Sparkles, Code, AlertTriangle } from "lucide-react";

interface JsonEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentConfig: any;
  onSave: (newConfig: any) => void;
}

export function JsonEditorDialog({ open, onOpenChange, currentConfig, onSave }: JsonEditorDialogProps) {
  const [jsonText, setJsonText] = useState(JSON.stringify(currentConfig, null, 2));
  const [aiPrompt, setAiPrompt] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const { toast } = useToast();

  const validateJson = (text: string): { valid: boolean; error?: string; parsed?: any } => {
    try {
      const parsed = JSON.parse(text);
      
      // Basic structure validation
      if (!parsed.sections || !Array.isArray(parsed.sections)) {
        return { valid: false, error: "Config must have a 'sections' array" };
      }
      if (!parsed.documents || !Array.isArray(parsed.documents)) {
        return { valid: false, error: "Config must have a 'documents' array" };
      }
      
      return { valid: true, parsed };
    } catch (error) {
      return { valid: false, error: error instanceof Error ? error.message : "Invalid JSON" };
    }
  };

  const handleManualChange = (value: string) => {
    setJsonText(value);
    const validation = validateJson(value);
    setValidationError(validation.error || null);
  };

  const handleAiModify = async () => {
    if (!aiPrompt.trim()) {
      toast({
        title: "Prompt Required",
        description: "Please enter instructions for how to modify the configuration",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('modify-json-config', {
        body: {
          currentConfig: JSON.parse(jsonText),
          prompt: aiPrompt,
        }
      });

      if (error) {
        if (error.message.includes("429")) {
          throw new Error("Rate limit exceeded. Please try again in a moment.");
        }
        if (error.message.includes("402")) {
          throw new Error("AI credits exhausted. Please add credits in Settings → Usage.");
        }
        throw error;
      }

      if (data?.modifiedConfig) {
        const newJsonText = JSON.stringify(data.modifiedConfig, null, 2);
        setJsonText(newJsonText);
        setValidationError(null);
        setAiPrompt("");
        
        toast({
          title: "Configuration Modified",
          description: "AI has updated the configuration based on your prompt",
        });
      }
    } catch (error) {
      console.error("AI modification error:", error);
      toast({
        title: "Modification Failed",
        description: error instanceof Error ? error.message : "Failed to modify configuration",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = () => {
    const validation = validateJson(jsonText);
    if (!validation.valid) {
      toast({
        title: "Invalid JSON",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    onSave(validation.parsed);
    onOpenChange(false);
    toast({
      title: "Configuration Updated",
      description: "Your changes have been applied",
    });
  };

  const handleCancel = () => {
    setJsonText(JSON.stringify(currentConfig, null, 2));
    setValidationError(null);
    setAiPrompt("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>JSON Configuration Editor</DialogTitle>
          <DialogDescription>
            Edit the form configuration manually or use AI to modify it with natural language
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="manual" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual" className="gap-2">
              <Code className="h-4 w-4" />
              Manual Edit
            </TabsTrigger>
            <TabsTrigger value="ai" className="gap-2">
              <Sparkles className="h-4 w-4" />
              AI Assistant
            </TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="flex-1 flex flex-col space-y-3 overflow-hidden">
            <div className="flex-1 overflow-hidden">
              <Textarea
                value={jsonText}
                onChange={(e) => handleManualChange(e.target.value)}
                className="font-mono text-xs h-full resize-none"
                placeholder="Paste your JSON configuration here..."
              />
            </div>
            
            {validationError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{validationError}</AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="ai" className="flex-1 flex flex-col space-y-4 overflow-hidden">
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="ai-prompt">Instructions for AI</Label>
                <Textarea
                  id="ai-prompt"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="E.g., 'Add a new email field to the Personal Information section' or 'Make all phone number fields optional'"
                  className="h-24"
                  disabled={isProcessing}
                />
              </div>
              
              <Button 
                onClick={handleAiModify} 
                disabled={isProcessing || !aiPrompt.trim()}
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Modifying with AI...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Modify Configuration
                  </>
                )}
              </Button>
            </div>

            <div className="flex-1 overflow-hidden border rounded-md">
              <div className="p-2 bg-muted text-xs font-medium">Preview</div>
              <Textarea
                value={jsonText}
                readOnly
                className="font-mono text-xs h-[calc(100%-2rem)] resize-none border-0 rounded-none"
              />
            </div>

            {validationError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{validationError}</AlertDescription>
              </Alert>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-3 border-t">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!!validationError}>
            Apply Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
