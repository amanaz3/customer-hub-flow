import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Zap, ZapOff } from 'lucide-react';
import { useAgentRuleEngine } from '@/hooks/useAgentRuleEngine';

interface AgentRuleEngineToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function AgentRuleEngineToggle({ className = '', showLabel = true }: AgentRuleEngineToggleProps) {
  const { isFeatureEnabled, isAgentEnabled, isActive, loading, toggleAgentPreference } = useAgentRuleEngine();

  // Don't render anything if admin hasn't enabled the feature
  if (!isFeatureEnabled) {
    return null;
  }

  if (loading) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showLabel && (
        <Label 
          htmlFor="agent-rule-engine-toggle" 
          className="text-sm flex items-center gap-1.5 cursor-pointer"
        >
          {isActive ? (
            <Zap className="h-4 w-4 text-amber-500" />
          ) : (
            <ZapOff className="h-4 w-4 text-muted-foreground" />
          )}
          <span>Rule Engine</span>
        </Label>
      )}
      <Switch
        id="agent-rule-engine-toggle"
        checked={isAgentEnabled}
        onCheckedChange={toggleAgentPreference}
        aria-label="Toggle rule engine assistance"
      />
      {isActive && (
        <Badge variant="secondary" className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/20">
          Active
        </Badge>
      )}
    </div>
  );
}
