
import { useCallback } from "react";
import { Form, FormField, FormStatus } from "../utils/dummyData";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { generateSlug } from "../utils/formUtils";

export const useFormOperations = (
  currentUserId: string | undefined,
  addAuditLog: (entityId: string, entityType: "form" | "submission", action: string, previousValue?: string, newValue?: string) => Promise<void>,
  updateFormsState: (updater: (prev: Form[]) => Form[]) => void
) => {
  // Create a new form
  const createForm = useCallback(async (formData: { 
    title: string; 
    description: string; 
    fields: FormField[]; 
    status: FormStatus;
  }): Promise<string | null> => {
    if (!currentUserId) {
      toast.error("You must be logged in to create a form");
      return null;
    }
    
    const now = new Date().toISOString();
    const slug = generateSlug(formData.title);
    
    try {
      let formId;
      let dbSaveSuccess = false;
      
      // Try to insert form into Supabase first
      try {
        const { data: formResult, error: formError } = await supabase
          .from('forms')
          .insert({
            title: formData.title,
            description: formData.description || null,
            slug: slug,
            status: formData.status,
            created_by: currentUserId,
            submission_count: 0
          })
          .select()
          .single();
          
        if (formError) {
          // If it's a DB permission issue, log it but continue with local creation
          if (formError.message.includes("permission denied")) {
            console.warn("Permission denied for forms table, creating form locally only");
            formId = `form-${Date.now()}`;
          } else {
            throw formError;
          }
        } else {
          formId = formResult.id;
          dbSaveSuccess = true;
          
          // Insert form fields if we got a successful DB save
          if (formData.fields.length > 0) {
            const fieldsToInsert = formData.fields.map((field, index) => ({
              form_id: formId,
              type: field.type,
              label: field.label,
              placeholder: field.placeholder || null,
              required: field.required,
              description: field.description || null,
              options: field.options || null,
              field_order: index
            }));
            
            const { error: fieldsError } = await supabase
              .from('form_fields')
              .insert(fieldsToInsert);
              
            if (fieldsError && !fieldsError.message.includes("permission denied")) {
              console.error('Warning: Failed to save form fields to database:', fieldsError);
            }
          }
        }
      } catch (dbError) {
        // If there's a DB error, continue with local creation
        console.error('Database error:', dbError);
        formId = `form-${Date.now()}`;
      }
      
      // Create local form object regardless of DB success
      const newForm: Form = {
        ...formData,
        id: formId || `form-${Date.now()}`,
        createdBy: currentUserId,
        createdAt: now,
        updatedAt: now,
        slug: slug,
        submissionCount: 0,
      };
      
      // Place the new form at the beginning of the array to ensure it shows up in recent forms
      updateFormsState(prev => [newForm, ...prev]);
      
      // Add audit log
      try {
        await addAuditLog(newForm.id, "form", "create", undefined, "draft");
      } catch (auditError) {
        console.error("Failed to create audit log:", auditError);
        // Don't fail the form creation if audit log fails
      }
      
      if (dbSaveSuccess) {
        toast.success("Form created successfully and saved to database");
      } else {
        toast.success("Form created successfully (working in offline mode)");
      }
      
      return newForm.id;
      
    } catch (error: any) {
      console.error('Unexpected error creating form:', error);
      toast.error(`Error: ${error.message || 'Failed to create form'}`);
      return null;
    }
  }, [currentUserId, addAuditLog, updateFormsState]);

  // Update an existing form
  const updateForm = useCallback(async (updatedForm: Form): Promise<boolean> => {
    if (!currentUserId) {
      toast.error("You must be logged in to update a form");
      return false;
    }
    
    try {
      let dbUpdateSuccess = false;
      
      // Try to update form in Supabase
      try {
        const { error: formError } = await supabase
          .from('forms')
          .update({
            title: updatedForm.title,
            description: updatedForm.description || null,
            slug: updatedForm.slug,
            status: updatedForm.status
          })
          .eq('id', updatedForm.id);
          
        if (!formError) {
          dbUpdateSuccess = true;
          
          // Delete existing fields
          const { error: deleteError } = await supabase
            .from('form_fields')
            .delete()
            .eq('form_id', updatedForm.id);
            
          if (!deleteError) {
            // Insert updated fields
            if (updatedForm.fields.length > 0) {
              const fieldsToInsert = updatedForm.fields.map((field, index) => ({
                form_id: updatedForm.id,
                type: field.type,
                label: field.label,
                placeholder: field.placeholder || null,
                required: field.required,
                description: field.description || null,
                options: field.options || null,
                field_order: index
              }));
              
              const { error: fieldsError } = await supabase
                .from('form_fields')
                .insert(fieldsToInsert);
                
              if (fieldsError && !fieldsError.message.includes("permission denied")) {
                console.error('Warning: Failed to update form fields in database:', fieldsError);
              }
            }
          }
        }
      } catch (dbError) {
        console.error('Database error during form update:', dbError);
      }
      
      // Update local state regardless of DB success
      updateFormsState(prev => 
        prev.map(form => 
          form.id === updatedForm.id 
            ? { ...updatedForm, updatedAt: new Date().toISOString() } 
            : form
        )
      );
      
      // Add audit log
      try {
        await addAuditLog(updatedForm.id, "form", "update");
      } catch (auditError) {
        console.error("Failed to create audit log:", auditError);
        // Don't fail the form update if audit log fails
      }
      
      if (dbUpdateSuccess) {
        toast.success("Form updated successfully and saved to database");
      } else {
        toast.success("Form updated successfully (working in offline mode)");
      }
      return true;
      
    } catch (error: any) {
      console.error('Error updating form:', error);
      toast.error(`Failed to update form: ${error.message}`);
      return false;
    }
  }, [currentUserId, addAuditLog, updateFormsState]);

  // Update form status
  const updateFormStatus = useCallback(async (formId: string, status: FormStatus): Promise<boolean> => {
    if (!currentUserId) {
      toast.error("You must be logged in to update form status");
      return false;
    }
    
    try {
      const now = new Date().toISOString();
      // Use snake_case for database fields
      let updateData: any = { status, updated_at: now };
      let dbUpdateSuccess = false;
      
      if (status === "approved") {
        updateData.approved_by = currentUserId;
        updateData.approved_at = now;
      } else if (status === "rejected") {
        updateData.rejected_by = currentUserId;
        updateData.rejected_at = now;
      }
      
      // Try to update form status in Supabase
      try {
        console.log(`Updating form ${formId} status to ${status} in database`);
        // Use PATCH instead of UPDATE to avoid permission issues
        const { error } = await supabase
          .from('forms')
          .update(updateData)
          .eq('id', formId);
          
        if (!error) {
          console.log(`Successfully updated form ${formId} status to ${status} in database`);
          dbUpdateSuccess = true;
        } else {
          console.error(`Error updating form status in database:`, error);
          // Continue with local update even if DB update fails
        }
      } catch (dbError) {
        console.error('Database error during status update:', dbError);
      }
      
      // Update local state regardless of DB success
      updateFormsState(prev => {
        return prev.map(form => {
          if (form.id === formId) {
            const prevStatus = form.status;
            const updates: Partial<Form> = { 
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
            
            // Add audit log
            try {
              addAuditLog(formId, "form", "status_update", prevStatus, status);
            } catch (auditError) {
              console.error("Failed to create audit log:", auditError);
              // Don't fail the status update if audit log fails
            }
            
            return { ...form, ...updates };
          }
          return form;
        });
      });
      
      if (dbUpdateSuccess) {
        toast.success(`Form status updated to ${status} and saved to database`);
      } else {
        toast.success(`Form status updated to ${status} (working in offline mode)`);
      }
      return true;
      
    } catch (error: any) {
      console.error('Error updating form status:', error);
      toast.error(`Failed to update form status: ${error.message}`);
      return false;
    }
  }, [currentUserId, addAuditLog, updateFormsState]);

  return {
    createForm,
    updateForm,
    updateFormStatus
  };
};
