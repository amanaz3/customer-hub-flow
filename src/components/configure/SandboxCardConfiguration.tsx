import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, Box, ChevronDown, ChevronRight } from "lucide-react";
import { useSandboxCardSettings, useUpdateSandboxCardVisibility, SandboxCardSetting } from "@/hooks/useSandboxCardSettings";
import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

export function SandboxCardConfiguration() {
  const { data: cardSettings, isLoading } = useSandboxCardSettings();
  const updateVisibility = useUpdateSandboxCardVisibility();
  const [expandedParents, setExpandedParents] = useState<Set<string>>(new Set());

  const handleToggle = (cardKey: string, currentValue: boolean) => {
    updateVisibility.mutate({ cardKey, isVisible: !currentValue });
  };

  const toggleExpanded = (cardKey: string) => {
    setExpandedParents(prev => {
      const next = new Set(prev);
      if (next.has(cardKey)) {
        next.delete(cardKey);
      } else {
        next.add(cardKey);
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <Card className="hover:shadow-lg transition-shadow border-2">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Box className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>Sandbox Cards</CardTitle>
              <CardDescription>Configure which cards appear in Sandbox</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group cards by parent
  const parentCards = cardSettings?.filter(s => !s.parent_key) || [];
  const childCardsByParent = cardSettings?.reduce((acc, card) => {
    if (card.parent_key) {
      if (!acc[card.parent_key]) {
        acc[card.parent_key] = [];
      }
      acc[card.parent_key].push(card);
    }
    return acc;
  }, {} as Record<string, SandboxCardSetting[]>) || {};

  return (
    <Card className="hover:shadow-lg transition-shadow border-2 md:col-span-2 lg:col-span-3">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Box className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle>Sandbox Cards</CardTitle>
            <CardDescription>Show or hide cards at all hierarchy levels in Sandbox</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {parentCards.map((parent) => {
            const children = childCardsByParent[parent.card_key] || [];
            const hasChildren = children.length > 0;
            const isExpanded = expandedParents.has(parent.card_key);

            return (
              <div key={parent.id} className="border rounded-lg overflow-hidden">
                <Collapsible open={isExpanded} onOpenChange={() => hasChildren && toggleExpanded(parent.card_key)}>
                  <div className="flex items-center justify-between p-3 bg-muted/30">
                    <div className="flex items-center gap-2">
                      {hasChildren && (
                        <CollapsibleTrigger asChild>
                          <button className="p-0.5 hover:bg-muted rounded">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                          </button>
                        </CollapsibleTrigger>
                      )}
                      <Label 
                        htmlFor={parent.card_key} 
                        className={cn("cursor-pointer font-medium text-sm", !hasChildren && "ml-5")}
                      >
                        {parent.card_name}
                      </Label>
                    </div>
                    <Switch
                      id={parent.card_key}
                      checked={parent.is_visible}
                      onCheckedChange={() => handleToggle(parent.card_key, parent.is_visible)}
                      disabled={updateVisibility.isPending}
                    />
                  </div>
                  
                  {hasChildren && (
                    <CollapsibleContent>
                      <div className="border-t">
                        {children.map((child) => (
                          <div
                            key={child.id}
                            className="flex items-center justify-between p-3 pl-8 hover:bg-muted/50 transition-colors border-b last:border-b-0"
                          >
                            <Label htmlFor={child.card_key} className="cursor-pointer text-sm text-muted-foreground">
                              {child.card_name}
                            </Label>
                            <Switch
                              id={child.card_key}
                              checked={child.is_visible}
                              onCheckedChange={() => handleToggle(child.card_key, child.is_visible)}
                              disabled={updateVisibility.isPending}
                            />
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  )}
                </Collapsible>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
