import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, Box } from "lucide-react";
import { useSandboxCardSettings, useUpdateSandboxCardVisibility } from "@/hooks/useSandboxCardSettings";

export function SandboxCardConfiguration() {
  const { data: cardSettings, isLoading } = useSandboxCardSettings();
  const updateVisibility = useUpdateSandboxCardVisibility();

  const handleToggle = (cardKey: string, currentValue: boolean) => {
    updateVisibility.mutate({ cardKey, isVisible: !currentValue });
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

  return (
    <Card className="hover:shadow-lg transition-shadow border-2">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Box className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle>Sandbox Cards</CardTitle>
            <CardDescription>Show or hide cards in Sandbox page</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {cardSettings?.map((setting) => (
            <div
              key={setting.id}
              className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <Label htmlFor={setting.card_key} className="cursor-pointer font-medium text-sm">
                {setting.card_name}
              </Label>
              <Switch
                id={setting.card_key}
                checked={setting.is_visible}
                onCheckedChange={() => handleToggle(setting.card_key, setting.is_visible)}
                disabled={updateVisibility.isPending}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
