
import { useCallback } from "react";
import { AuditLog } from "../utils/dummyData";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useAuditLog = (
  currentUserId: string | undefined,
  updateAuditLogsState: (updater: (prev: AuditLog[]) => AuditLog[]) => void
) => {
  // Helper function to add audit log
  const addAuditLog = useCallback(async (
    entityId: string, 
    entityType: "form" | "submission", 
    action: string, 
    previousValue?: string, 
    newValue?: string
  ) => {
    if (!currentUserId) return;
    
    const newLog: AuditLog = {
      id: `log${Date.now()}`,
      entityId,
      entityType,
      userId: currentUserId,
      action,
      previousValue,
      newValue: newValue || "",
      timestamp: new Date().toISOString(),
    };
    
    updateAuditLogsState(prev => [...prev, newLog]);
    
    // Store audit log in Supabase
    try {
      const { error } = await supabase
        .from('audit_logs')
        .insert({
          entity_id: entityId,
          entity_type: entityType,
          user_id: currentUserId,
          action: action,
          previous_value: previousValue || null,
          new_value: newValue || null
        });
        
      if (error) throw error;
    } catch (error) {
      console.error('Error adding audit log to Supabase:', error);
      toast.error('Failed to record audit log');
    }
  }, [currentUserId, updateAuditLogsState]);

  const getAuditLogsByEntityId = useCallback((entityId: string): AuditLog[] => {
    // This will be implemented in the main context file that uses this hook
    // and will filter the audit logs from state
    return [];
  }, []);

  return {
    addAuditLog,
    getAuditLogsByEntityId
  };
};
