
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
  }) => {
    if (!currentUserId) {
      toast.error("You must be logged in to create a form");
      return null;
    }
    
    const now = new Date().toISOString();
    const slug = generateSlug(formData.title);
    
    try {
      // Insert form into Supabase
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
        console.error('Error creating form:', formError);
        toast.error(`Failed to create form: ${formError.message}`);
        return null;
      }
      
      // Insert form fields
      if (formData.fields.length > 0) {
        const fieldsToInsert = formData.fields.map((field, index) => ({
          form_id: formResult.id,
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
          
        if (fieldsError) {
          console.error('Error creating form fields:', fieldsError);
          toast.error(`Failed to create form fields: ${fieldsError.message}`);
          
          // Clean up the partially created form
          await supabase
            .from('forms')
            .delete()
            .eq('id', formResult.id);
            
          return null;
        }
      }
      
      // Create local form object
      const newForm: Form = {
        ...formData,
        id: formResult.id,
        createdBy: currentUserId,
        createdAt: formResult.created_at,
        updatedAt: formResult.updated_at,
        slug: slug,
        submissionCount: 0,
      };
      
      // Place the new form at the beginning of the array to ensure it shows up in recent forms
      updateFormsState(prev => [newForm, ...prev]);
      await addAuditLog(newForm.id, "form", "create", undefined, "draft");
      toast.success("Form created successfully");
      return newForm.id;
      
    } catch (error: any) {
      console.error('Unexpected error creating form:', error);
      toast.error(`Unexpected error: ${error.message || 'Failed to create form'}`);
      return null;
    }
  }, [currentUserId, addAuditLog, updateFormsState]);

  // Update an existing form
  const updateForm = useCallback(async (updatedForm: Form) => {
    if (!currentUserId) return;
    
    try {
      // Update form in Supabase
      const { error: formError } = await supabase
        .from('forms')
        .update({
          title: updatedForm.title,
          description: updatedForm.description || null,
          slug: updatedForm.slug,
          status: updatedForm.status
        })
        .eq('id', updatedForm.id);
        
      if (formError) throw formError;
      
      // Delete existing fields
      const { error: deleteError } = await supabase
        .from('form_fields')
        .delete()
        .eq('form_id', updatedForm.id);
        
      if (deleteError) throw deleteError;
      
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
          
        if (fieldsError) throw fieldsError;
      }
      
      // Update local state
      updateFormsState(prev => 
        prev.map(form => 
          form.id === updatedForm.id 
            ? { ...updatedForm, updatedAt: new Date().toISOString() } 
            : form
        )
      );
      
      await addAuditLog(updatedForm.id, "form", "update");
      toast.success("Form updated successfully");
      
    } catch (error) {
      console.error('Error updating form:', error);
      toast.error('Failed to update form');
    }
  }, [currentUserId, addAuditLog, updateFormsState]);

  // Update form status
  const updateFormStatus = useCallback(async (formId: string, status: FormStatus) => {
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
      
      // Update form status in Supabase
      const { error } = await supabase
        .from('forms')
        .update(updateData)
        .eq('id', formId);
        
      if (error) throw error;
      
      // Update local state
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
            
            addAuditLog(formId, "form", "status_update", prevStatus, status);
            
            return { ...form, ...updates };
          }
          return form;
        });
      });
      
      toast.success(`Form status updated to ${status}`);
      
    } catch (error) {
      console.error('Error updating form status:', error);
      toast.error('Failed to update form status');
    }
  }, [currentUserId, addAuditLog, updateFormsState]);

  return {
    createForm,
    updateForm,
    updateFormStatus
  };
};
