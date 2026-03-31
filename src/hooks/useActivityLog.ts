import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export const useActivityLog = () => {
  const { user, profile } = useAuth();

  const log = async (
    action: string,
    entityType?: string,
    entityId?: string,
    details?: Record<string, any>
  ) => {
    if (!user) return;
    try {
      await supabase.from("activity_logs").insert({
        user_id: user.id,
        company_id: profile?.company_id || null,
        action,
        entity_type: entityType,
        entity_id: entityId,
        details: details || {},
      });
    } catch (err) {
      console.error("Failed to log activity:", err);
    }
  };

  return { log };
};
