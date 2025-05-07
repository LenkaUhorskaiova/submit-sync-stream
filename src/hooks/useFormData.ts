
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { transformFormFromSupabase } from "../utils/formUtils";
import { transformSubmissionFromSupabase } from "../utils/supabaseUtils";
import { AuditLog, forms as dummyForms, submissions as dummySubmissions, auditLogs as dummyAuditLogs } from "../utils/dummyData";

export const useFormData = (
  currentUserId: string | undefined,
  setForms: React.Dispatch<React.SetStateAction<any[]>>,
  setSubmissions: React.Dispatch<React.SetStateAction<any[]>>,
  setAuditLogs: React.Dispatch<React.SetStateAction<AuditLog[]>>
) => {
  // Set initial data to ensure the app has something to display while loading
  useEffect(() => {
    // We'll only use dummy data if we haven't loaded real data yet
    setForms(prevForms => prevForms.length === 0 ? dummyForms : prevForms);
    setSubmissions(prevSubmissions => prevSubmissions.length === 0 ? dummySubmissions : prevSubmissions);
    setAuditLogs(prevLogs => prevLogs.length === 0 ? dummyAuditLogs : prevLogs);
  }, [setForms, setSubmissions, setAuditLogs]);

  // Fetch forms from Supabase
  const formsQuery = useQuery({
    queryKey: ['forms'],
    queryFn: async () => {
      if (!currentUserId) return dummyForms;
      
      try {
        // Fetch forms
        const { data: formsData, error: formsError } = await supabase
          .from('forms')
          .select('*');
          
        if (formsError) {
          throw formsError;
        }
        
        // Fetch form fields - with improved error handling
        const { data: fieldsData, error: fieldsError } = await supabase
          .from('form_fields')
          .select('*');
          
        if (fieldsError) {
          console.error('Error fetching form fields:', fieldsError);
          toast.error('Failed to load form fields');
          // Continue with empty fields but don't fail the whole operation
          const transformedForms = formsData.map(form => 
            transformFormFromSupabase(form, [])
          );
          
          if (transformedForms && transformedForms.length > 0) {
            setForms(transformedForms);
            return transformedForms;
          }
          
          return dummyForms;
        }
        
        // Transform to local format with fields
        const transformedForms = formsData.map(form => 
          transformFormFromSupabase(form, fieldsData || [])
        );
        
        // Only update state if we got valid data
        if (transformedForms && transformedForms.length > 0) {
          console.log("Forms loaded from database:", transformedForms.length);
          console.log("Form fields loaded:", fieldsData?.length || 0);
          setForms(transformedForms);
          return transformedForms;
        } else if (formsData && formsData.length > 0) {
          // If we have forms data but transformation failed for some reason
          console.log("Forms found in database but couldn't be properly transformed:", formsData.length);
        } else {
          console.log("No forms found in database, keeping existing forms");
        }
        
        return dummyForms;
      } catch (error) {
        console.error('Error fetching forms:', error);
        toast.error('Failed to load forms');
        return dummyForms;
      }
    },
    enabled: !!currentUserId,
    // Avoid refetching too often
    staleTime: 30000,
  });
  
  // Fetch submissions from Supabase
  const submissionsQuery = useQuery({
    queryKey: ['submissions'],
    queryFn: async () => {
      if (!currentUserId) return dummySubmissions;
      
      try {
        const { data, error } = await supabase
          .from('submissions')
          .select('*');
          
        if (error) {
          throw error;
        }
        
        const transformedSubmissions = data.map(sub => 
          transformSubmissionFromSupabase(sub)
        );
        
        if (transformedSubmissions && transformedSubmissions.length > 0) {
          setSubmissions(transformedSubmissions);
          return transformedSubmissions;
        }
        
        return dummySubmissions;
      } catch (error) {
        console.error('Error fetching submissions:', error);
        toast.error('Failed to load submissions');
        return dummySubmissions;
      }
    },
    enabled: !!currentUserId,
    staleTime: 30000,
  });

  // Fetch audit logs from Supabase
  const auditLogsQuery = useQuery({
    queryKey: ['audit_logs'],
    queryFn: async () => {
      if (!currentUserId) return dummyAuditLogs;
      
      try {
        const { data, error } = await supabase
          .from('audit_logs')
          .select('*');
          
        if (error) {
          throw error;
        }
        
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
        
        if (transformedLogs && transformedLogs.length > 0) {
          setAuditLogs(transformedLogs);
          return transformedLogs;
        }
        
        return dummyAuditLogs;
      } catch (error) {
        console.error('Error fetching audit logs:', error);
        toast.error('Failed to load audit logs');
        return dummyAuditLogs;
      }
    },
    enabled: !!currentUserId,
    staleTime: 30000,
  });

  return {
    formsQuery,
    submissionsQuery,
    auditLogsQuery
  };
};
