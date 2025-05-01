
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { transformFormFromSupabase } from "../utils/formUtils";
import { transformSubmissionFromSupabase } from "../utils/supabaseUtils";
import { AuditLog } from "../utils/dummyData";

export const useFormData = (
  currentUserId: string | undefined,
  setForms: React.Dispatch<React.SetStateAction<any[]>>,
  setSubmissions: React.Dispatch<React.SetStateAction<any[]>>,
  setAuditLogs: React.Dispatch<React.SetStateAction<AuditLog[]>>
) => {
  // Fetch forms from Supabase
  const formsQuery = useQuery({
    queryKey: ['forms'],
    queryFn: async () => {
      if (!currentUserId) return [];
      
      try {
        // Fetch forms
        const { data: formsData, error: formsError } = await supabase
          .from('forms')
          .select('*');
          
        if (formsError) throw formsError;
        
        // Fetch form fields
        const { data: fieldsData, error: fieldsError } = await supabase
          .from('form_fields')
          .select('*');
          
        if (fieldsError) throw fieldsError;
        
        // Transform to local format
        const transformedForms = formsData.map(form => 
          transformFormFromSupabase(form, fieldsData)
        );
        
        setForms(transformedForms);
        return transformedForms;
      } catch (error) {
        console.error('Error fetching forms:', error);
        toast.error('Failed to load forms');
        return [];
      }
    },
    enabled: !!currentUserId
  });
  
  // Fetch submissions from Supabase
  const submissionsQuery = useQuery({
    queryKey: ['submissions'],
    queryFn: async () => {
      if (!currentUserId) return [];
      
      try {
        const { data, error } = await supabase
          .from('submissions')
          .select('*');
          
        if (error) throw error;
        
        const transformedSubmissions = data.map(sub => 
          transformSubmissionFromSupabase(sub)
        );
        
        setSubmissions(transformedSubmissions);
        return transformedSubmissions;
      } catch (error) {
        console.error('Error fetching submissions:', error);
        toast.error('Failed to load submissions');
        return [];
      }
    },
    enabled: !!currentUserId
  });

  // Fetch audit logs from Supabase
  const auditLogsQuery = useQuery({
    queryKey: ['audit_logs'],
    queryFn: async () => {
      if (!currentUserId) return [];
      
      try {
        const { data, error } = await supabase
          .from('audit_logs')
          .select('*');
          
        if (error) throw error;
        
        const transformedLogs: AuditLog[] = data.map(log => ({
          id: log.id,
          entityId: log.entity_id,
          entityType: log.entity_type as "form" | "submission",
          userId: log.user_id,
          action: log.action,
          previousValue: log.previous_value || undefined,
          newValue: log.new_value || "",
          timestamp: log.timestamp
        }));
        
        setAuditLogs(transformedLogs);
        return transformedLogs;
      } catch (error) {
        console.error('Error fetching audit logs:', error);
        toast.error('Failed to load audit logs');
        return [];
      }
    },
    enabled: !!currentUserId
  });

  return {
    formsQuery,
    submissionsQuery,
    auditLogsQuery
  };
};
