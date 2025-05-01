
import { useCallback } from "react";
import { Form, Submission, SubmissionStatus } from "../utils/dummyData";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useSubmissionOperations = (
  currentUserId: string | undefined,
  addAuditLog: (entityId: string, entityType: "form" | "submission", action: string, previousValue?: string, newValue?: string) => Promise<void>,
  updateSubmissionsState: (updater: (prev: Submission[]) => Submission[]) => void,
  updateFormsState: (updater: (prev: Form[]) => Form[]) => void,
  forms: Form[]
) => {
  // Create submission
  const createSubmission = useCallback(async (formId: string, values: Record<string, any>) => {
    if (!currentUserId) return;
    
    try {
      const form = forms.find(f => f.id === formId);
      if (!form) {
        toast.error("Form not found");
        return;
      }
      
      // Insert submission into Supabase
      const { data: submissionResult, error } = await supabase
        .from('submissions')
        .insert({
          form_id: formId,
          user_id: currentUserId,
          status: 'pending',
          values: values
        })
        .select()
        .single();
        
      if (error) throw error;
      
      // Update form submission count
      const { error: countError } = await supabase
        .from('forms')
        .update({ 
          submission_count: form.submissionCount + 1 
        })
        .eq('id', formId);
        
      if (countError) throw countError;
      
      const newSubmission: Submission = {
        id: submissionResult.id,
        formId,
        userId: currentUserId,
        status: "pending",
        values,
        createdAt: submissionResult.created_at,
        updatedAt: submissionResult.updated_at,
      };
      
      updateSubmissionsState(prev => [...prev, newSubmission]);
      
      // Update submission count on form
      updateFormsState(prev => 
        prev.map(form => 
          form.id === formId 
            ? { ...form, submissionCount: form.submissionCount + 1 } 
            : form
        )
      );
      
      await addAuditLog(newSubmission.id, "submission", "create", undefined, "pending");
      toast.success("Form submitted successfully");
    } catch (error) {
      console.error('Error creating submission:', error);
      toast.error('Failed to create submission');
    }
  }, [currentUserId, forms, addAuditLog, updateSubmissionsState, updateFormsState]);

  // Update submission status
  const updateSubmissionStatus = useCallback(async (submissionId: string, status: SubmissionStatus) => {
    if (!currentUserId) return;
    
    try {
      const now = new Date().toISOString();
      let updateData: any = { status, updated_at: now };
      
      if (status === "approved") {
        updateData.approved_by = currentUserId;
        updateData.approved_at = now;
      } else if (status === "rejected") {
        updateData.rejected_by = currentUserId;
        updateData.rejected_at = now;
      }
      
      // Update submission status in Supabase
      const { error } = await supabase
        .from('submissions')
        .update(updateData)
        .eq('id', submissionId);
        
      if (error) throw error;
      
      // Update local state
      updateSubmissionsState(prev => {
        return prev.map(sub => {
          if (sub.id === submissionId) {
            const prevStatus = sub.status;
            const updates: Partial<Submission> = { 
              status, 
              updatedAt: now 
            };
            
            if (status === "approved") {
              updates.approvedBy = currentUserId;
              updates.approvedAt = now;
            } else if (status === "rejected") {
              updates.rejectedBy = currentUserId;
              updates.rejectedAt = now;
            }
            
            addAuditLog(submissionId, "submission", "status_update", prevStatus, status);
            
            return { ...sub, ...updates };
          }
          return sub;
        });
      });
      
      toast.success(`Submission status updated to ${status}`);
    } catch (error) {
      console.error('Error updating submission status:', error);
      toast.error('Failed to update submission status');
    }
  }, [currentUserId, addAuditLog, updateSubmissionsState]);

  return {
    createSubmission,
    updateSubmissionStatus
  };
};
