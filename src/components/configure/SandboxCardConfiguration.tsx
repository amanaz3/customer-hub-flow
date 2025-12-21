import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, Box, ChevronDown, ChevronRight } from "lucide-react";
import { useSandboxCardSettings, useUpdateSandboxCardVisibility, SandboxCardSetting } from "@/hooks/useSandboxCardSettings";
import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface CardItemProps {
  card: SandboxCardSetting;
  childCardsByParent: Record<string, SandboxCardSetting[]>;
  expandedCards: Set<string>;
  toggleExpanded: (cardKey: string) => void;
  handleToggle: (cardKey: string, currentValue: boolean) => void;
  isPending: boolean;
  depth: number;
}

function CardItem({ 
  card, 
  childCardsByParent, 
  expandedCards, 
  toggleExpanded, 
  handleToggle, 
  isPending,
  depth 
}: CardItemProps) {
  const children = childCardsByParent[card.card_key] || [];
  const hasChildren = children.length > 0;
  const isExpanded = expandedCards.has(card.card_key);
  const paddingLeft = depth === 0 ? 'pl-3' : `pl-${3 + depth * 5}`;

  return (
    <Collapsible open={isExpanded} onOpenChange={() => hasChildren && toggleExpanded(card.card_key)}>
      <div 
        className={cn(
          "flex items-center justify-between p-3 transition-colors",
          depth === 0 ? "bg-muted/30" : "hover:bg-muted/50 border-t",
          depth > 0 && "border-b last:border-b-0"
        )}
        style={{ paddingLeft: `${12 + depth * 20}px` }}
      >
        <div className="flex items-center gap-2">
          {hasChildren ? (
            <CollapsibleTrigger asChild>
              <button className="p-0.5 hover:bg-muted rounded">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            </CollapsibleTrigger>
          ) : (
            <div className="w-5" /> 
          )}
          <Label 
            htmlFor={card.card_key} 
            className={cn(
              "cursor-pointer text-sm",
              depth === 0 ? "font-medium" : "text-muted-foreground"
            )}
          >
            {card.card_name}
          </Label>
        </div>
        <Switch
          id={card.card_key}
          checked={card.is_visible}
          onCheckedChange={() => handleToggle(card.card_key, card.is_visible)}
          disabled={isPending}
        />
      </div>
      
      {hasChildren && (
        <CollapsibleContent>
          <div>
            {children.map((child) => (
              <CardItem
                key={child.id}
                card={child}
                childCardsByParent={childCardsByParent}
                expandedCards={expandedCards}
                toggleExpanded={toggleExpanded}
                handleToggle={handleToggle}
                isPending={isPending}
                depth={depth + 1}
              />
            ))}
          </div>
        </CollapsibleContent>
      )}
    </Collapsible>
  );
}

export function SandboxCardConfiguration() {
  const { data: cardSettings, isLoading } = useSandboxCardSettings();
  const updateVisibility = useUpdateSandboxCardVisibility();
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const handleToggle = (cardKey: string, currentValue: boolean) => {
    updateVisibility.mutate({ cardKey, isVisible: !currentValue });
  };

  const toggleExpanded = (cardKey: string) => {
    setExpandedCards(prev => {
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

  // Get root cards (no parent) and build child lookup
  const rootCards = cardSettings?.filter(s => !s.parent_key) || [];
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
          {rootCards.map((card) => (
            <div key={card.id} className="border rounded-lg overflow-hidden">
              <CardItem
                card={card}
                childCardsByParent={childCardsByParent}
                expandedCards={expandedCards}
                toggleExpanded={toggleExpanded}
                handleToggle={handleToggle}
                isPending={updateVisibility.isPending}
                depth={0}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
