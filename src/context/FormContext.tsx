
import { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { Form, FormField, FormStatus, Submission, SubmissionStatus, forms as initialForms, submissions as initialSubmissions, auditLogs as initialAuditLogs, AuditLog, FieldValue } from "../utils/dummyData";
import { useAuth } from "./AuthContext";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Json } from "@/integrations/supabase/types";

interface FormContextType {
  forms: Form[];
  submissions: Submission[];
  auditLogs: AuditLog[];
  createForm: (form: { 
    title: string; 
    description: string; 
    fields: FormField[]; 
    status: FormStatus;
  }) => void;
  updateForm: (form: Form) => void;
  updateFormStatus: (formId: string, status: FormStatus) => void;
  getFormById: (id: string) => Form | undefined;
  getFormBySlug: (slug: string) => Form | undefined;
  createSubmission: (formId: string, values: Record<string, any>) => void;
  getSubmissionsByFormId: (formId: string) => Submission[];
  getSubmissionById: (id: string) => Submission | undefined;
  updateSubmissionStatus: (submissionId: string, status: SubmissionStatus) => void;
  getAuditLogsByEntityId: (entityId: string) => AuditLog[];
}

const FormContext = createContext<FormContextType | undefined>(undefined);

export const FormProvider = ({ children }: { children: ReactNode }) => {
  const [forms, setForms] = useState<Form[]>(initialForms);
  const [submissions, setSubmissions] = useState<Submission[]>(initialSubmissions);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(initialAuditLogs);
  const { currentUser } = useAuth();

  // Helper function to generate slug
  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^\w ]+/g, '')
      .replace(/ +/g, '-');
  };

  // Helper function to add audit log
  const addAuditLog = useCallback(async (entityId: string, entityType: "form" | "submission", action: string, previousValue?: string, newValue?: string) => {
    if (!currentUser) return;
    
    const newLog: AuditLog = {
      id: `log${Date.now()}`,
      entityId,
      entityType,
      userId: currentUser.id,
      action,
      previousValue,
      newValue: newValue || "",
      timestamp: new Date().toISOString(),
    };
    
    setAuditLogs(prev => [...prev, newLog]);
    
    // Store audit log in Supabase
    try {
      const { error } = await supabase
        .from('audit_logs')
        .insert({
          entity_id: entityId,
          entity_type: entityType,
          user_id: currentUser.id,
          action: action,
          previous_value: previousValue || null,
          new_value: newValue || null
        });
        
      if (error) throw error;
    } catch (error) {
      console.error('Error adding audit log to Supabase:', error);
      toast.error('Failed to record audit log');
    }
  }, [currentUser]);

  // Create a new form
  const createForm = useCallback(async (formData: { 
    title: string; 
    description: string; 
    fields: FormField[]; 
    status: FormStatus;
  }) => {
    if (!currentUser) return;
    
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
          created_by: currentUser.id,
          submission_count: 0
        })
        .select()
        .single();
        
      if (formError) throw formError;
      
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
          
        if (fieldsError) throw fieldsError;
      }
      
      // Create local form object
      const newForm: Form = {
        ...formData,
        id: formResult.id,
        createdBy: currentUser.id,
        createdAt: formResult.created_at,
        updatedAt: formResult.updated_at,
        slug: slug,
        submissionCount: 0,
      };
      
      // Place the new form at the beginning of the array to ensure it shows up in recent forms
      setForms(prev => [newForm, ...prev]);
      await addAuditLog(newForm.id, "form", "create", undefined, "draft");
      toast.success("Form created successfully");
      
    } catch (error) {
      console.error('Error creating form:', error);
      toast.error('Failed to create form');
    }
  }, [currentUser, addAuditLog]);

  // Update an existing form
  const updateForm = useCallback(async (updatedForm: Form) => {
    if (!currentUser) return;
    
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
      setForms(prev => 
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
  }, [currentUser, addAuditLog]);

  // Update form status
  const updateFormStatus = useCallback(async (formId: string, status: FormStatus) => {
    if (!currentUser) return;
    
    try {
      const existingForm = forms.find(form => form.id === formId);
      if (!existingForm) throw new Error('Form not found');
      
      const now = new Date().toISOString();
      let updateData: any = { status, updated_at: now };
      
      if (status === "approved") {
        updateData.approved_by = currentUser.id;
        updateData.approved_at = now;
      } else if (status === "rejected") {
        updateData.rejected_by = currentUser.id;
        updateData.rejected_at = now;
      }
      
      // Update form status in Supabase
      const { error } = await supabase
        .from('forms')
        .update(updateData)
        .eq('id', formId);
        
      if (error) throw error;
      
      // Update local state
      setForms(prev => {
        return prev.map(form => {
          if (form.id === formId) {
            const prevStatus = form.status;
            const updates: Partial<Form> = { 
              status, 
              updatedAt: now 
            };
            
            if (status === "approved") {
              updates.approvedBy = currentUser.id;
              updates.approvedAt = now;
            } else if (status === "rejected") {
              updates.rejectedBy = currentUser.id;
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
  }, [currentUser, forms, addAuditLog]);

  // Get form by ID
  const getFormById = useCallback((id: string): Form | undefined => {
    return forms.find(form => form.id === id);
  }, [forms]);

  // Get form by slug
  const getFormBySlug = useCallback((slug: string): Form | undefined => {
    return forms.find(form => form.slug === slug);
  }, [forms]);

  // Create submission
  const createSubmission = useCallback(async (formId: string, values: Record<string, any>) => {
    if (!currentUser) return;
    
    try {
      const form = forms.find(f => f.id === formId);
      if (!form) {
        toast.error("Form not found");
        return;
      }
      
      const now = new Date().toISOString();
      
      // Insert submission into Supabase
      const { data: submissionResult, error } = await supabase
        .from('submissions')
        .insert({
          form_id: formId,
          user_id: currentUser.id,
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
        userId: currentUser.id,
        status: "pending",
        values,
        createdAt: submissionResult.created_at,
        updatedAt: submissionResult.updated_at,
      };
      
      setSubmissions(prev => [...prev, newSubmission]);
      
      // Update submission count on form
      setForms(prev => 
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
  }, [currentUser, forms, addAuditLog]);

  // Get submissions by form ID
  const getSubmissionsByFormId = useCallback((formId: string): Submission[] => {
    return submissions.filter(sub => sub.formId === formId);
  }, [submissions]);

  // Get submission by ID
  const getSubmissionById = useCallback((id: string): Submission | undefined => {
    return submissions.find(sub => sub.id === id);
  }, [submissions]);

  // Update submission status
  const updateSubmissionStatus = useCallback(async (submissionId: string, status: SubmissionStatus) => {
    if (!currentUser) return;
    
    try {
      const now = new Date().toISOString();
      let updateData: any = { status, updated_at: now };
      
      if (status === "approved") {
        updateData.approved_by = currentUser.id;
        updateData.approved_at = now;
      } else if (status === "rejected") {
        updateData.rejected_by = currentUser.id;
        updateData.rejected_at = now;
      }
      
      // Update submission status in Supabase
      const { error } = await supabase
        .from('submissions')
        .update(updateData)
        .eq('id', submissionId);
        
      if (error) throw error;
      
      // Update local state
      setSubmissions(prev => {
        return prev.map(sub => {
          if (sub.id === submissionId) {
            const prevStatus = sub.status;
            const updates: Partial<Submission> = { 
              status, 
              updatedAt: now 
            };
            
            if (status === "approved") {
              updates.approvedBy = currentUser.id;
              updates.approvedAt = now;
            } else if (status === "rejected") {
              updates.rejectedBy = currentUser.id;
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
  }, [currentUser, addAuditLog]);

  // Get audit logs by entity ID
  const getAuditLogsByEntityId = useCallback((entityId: string): AuditLog[] => {
    return auditLogs.filter(log => log.entityId === entityId);
  }, [auditLogs]);

  // Helper function to safely convert Json to Record<string, FieldValue>
  const convertJsonToFieldValues = (jsonData: Json): Record<string, FieldValue> => {
    if (typeof jsonData === 'object' && jsonData !== null) {
      return jsonData as Record<string, FieldValue>;
    }
    // Return empty object as fallback
    return {};
  };

  // Fetch forms from Supabase
  useQuery({
    queryKey: ['forms'],
    queryFn: async () => {
      if (!currentUser) return [];
      
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
        const transformedForms: Form[] = formsData.map(form => {
          const formFields = fieldsData
            .filter(field => field.form_id === form.id)
            .sort((a, b) => a.field_order - b.field_order)
            .map(field => ({
              id: field.id,
              type: field.type as any,
              label: field.label,
              placeholder: field.placeholder || undefined,
              required: field.required,
              options: field.options || undefined,
              description: field.description || undefined
            }));
            
          return {
            id: form.id,
            title: form.title,
            description: form.description || "",
            fields: formFields,
            status: form.status as FormStatus,
            slug: form.slug,
            createdBy: form.created_by,
            createdAt: form.created_at,
            updatedAt: form.updated_at,
            approvedBy: form.approved_by || undefined,
            approvedAt: form.approved_at || undefined,
            rejectedBy: form.rejected_by || undefined,
            rejectedAt: form.rejected_at || undefined,
            submissionCount: form.submission_count
          };
        });
        
        setForms(transformedForms);
        return transformedForms;
      } catch (error) {
        console.error('Error fetching forms:', error);
        toast.error('Failed to load forms');
        return [];
      }
    },
    enabled: !!currentUser
  });
  
  // Fetch submissions from Supabase
  useQuery({
    queryKey: ['submissions'],
    queryFn: async () => {
      if (!currentUser) return [];
      
      try {
        const { data, error } = await supabase
          .from('submissions')
          .select('*');
          
        if (error) throw error;
        
        const transformedSubmissions: Submission[] = data.map(sub => ({
          id: sub.id,
          formId: sub.form_id,
          userId: sub.user_id || "",
          status: sub.status as SubmissionStatus,
          values: convertJsonToFieldValues(sub.values),
          createdAt: sub.created_at,
          updatedAt: sub.updated_at,
          approvedBy: sub.approved_by || undefined,
          approvedAt: sub.approved_at || undefined,
          rejectedBy: sub.rejected_by || undefined,
          rejectedAt: sub.rejected_at || undefined
        }));
        
        setSubmissions(transformedSubmissions);
        return transformedSubmissions;
      } catch (error) {
        console.error('Error fetching submissions:', error);
        toast.error('Failed to load submissions');
        return [];
      }
    },
    enabled: !!currentUser
  });

  // Fetch audit logs from Supabase
  useQuery({
    queryKey: ['audit_logs'],
    queryFn: async () => {
      if (!currentUser) return [];
      
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
    enabled: !!currentUser
  });

  const value = {
    forms,
    submissions,
    auditLogs,
    createForm,
    updateForm,
    updateFormStatus,
    getFormById,
    getFormBySlug,
    createSubmission,
    getSubmissionsByFormId,
    getSubmissionById,
    updateSubmissionStatus,
    getAuditLogsByEntityId,
  };

  return <FormContext.Provider value={value}>{children}</FormContext.Provider>;
};

export const useForm = () => {
  const context = useContext(FormContext);
  if (context === undefined) {
    throw new Error("useForm must be used within a FormProvider");
  }
  return context;
};
