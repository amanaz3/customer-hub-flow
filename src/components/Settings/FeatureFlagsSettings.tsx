import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Info } from 'lucide-react';

interface FeatureFlag {
  id: string;
  feature_key: string;
  feature_name: string;
  feature_description: string | null;
  is_enabled: boolean;
}

export const FeatureFlagsSettings = () => {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchFlags();
  }, []);

  const fetchFlags = async () => {
    try {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('*')
        .order('feature_key');

      if (error) throw error;
      setFlags(data || []);
    } catch (error) {
      console.error('Error fetching feature flags:', error);
      toast({
        title: "Error",
        description: "Failed to load feature flags",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleFlag = async (flagId: string, currentValue: boolean) => {
    setUpdating(flagId);
    try {
      const { error } = await supabase
        .from('feature_flags')
        .update({ is_enabled: !currentValue })
        .eq('id', flagId);

      if (error) throw error;

      setFlags(flags.map(f => 
        f.id === flagId ? { ...f, is_enabled: !currentValue } : f
      ));

      toast({
        title: "Success",
        description: "Feature flag updated successfully",
      });
    } catch (error) {
      console.error('Error updating feature flag:', error);
      toast({
        title: "Error",
        description: "Failed to update feature flag",
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Control advanced features for application workflow management. Disable any feature if you encounter issues.
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        {flags.map((flag) => (
          <div 
            key={flag.id} 
            className="flex items-start justify-between p-4 border rounded-lg bg-card"
          >
            <div className="space-y-1 flex-1">
              <Label 
                htmlFor={flag.feature_key}
                className="text-base font-medium"
              >
                {flag.feature_name}
              </Label>
              {flag.feature_description && (
                <p className="text-sm text-muted-foreground">
                  {flag.feature_description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {updating === flag.id && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
              <Switch
                id={flag.feature_key}
                checked={flag.is_enabled}
                onCheckedChange={() => toggleFlag(flag.id, flag.is_enabled)}
                disabled={updating === flag.id}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
