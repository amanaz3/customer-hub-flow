import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SandboxCardSetting {
  id: string;
  card_key: string;
  card_name: string;
  is_visible: boolean;
  card_order: number;
  parent_key: string | null;
  created_at: string;
  updated_at: string;
}

export function useSandboxCardSettings() {
  return useQuery({
    queryKey: ["sandbox-card-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sandbox_card_settings")
        .select("*")
        .order("card_order", { ascending: true });

      if (error) throw error;
      return data as SandboxCardSetting[];
    },
  });
}

export function useUpdateSandboxCardVisibility() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ cardKey, isVisible }: { cardKey: string; isVisible: boolean }) => {
      const { error } = await supabase
        .from("sandbox_card_settings")
        .update({ is_visible: isVisible, updated_at: new Date().toISOString() })
        .eq("card_key", cardKey);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sandbox-card-settings"] });
      toast.success("Card visibility updated");
    },
    onError: (error) => {
      console.error("Error updating card visibility:", error);
      toast.error("Failed to update card visibility");
    },
  });
}

// Helper hook to check if a specific card is visible
export function useIsCardVisible(cardKey: string): boolean {
  const { data: cardSettings } = useSandboxCardSettings();
  if (!cardSettings) return true;
  const setting = cardSettings.find(s => s.card_key === cardKey);
  return setting?.is_visible ?? true;
}
