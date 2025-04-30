
import { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { Form, FormField, FormStatus, Submission, SubmissionStatus, forms as initialForms, submissions as initialSubmissions, auditLogs as initialAuditLogs, AuditLog } from "../utils/dummyData";
import { useAuth } from "./AuthContext";
import { toast } from "sonner";

interface FormContextType {
  forms: Form[];
  submissions: Submission[];
  auditLogs: AuditLog[];
  createForm: (form: Omit<Form, "id" | "createdBy" | "createdAt" | "updatedAt" | "slug" | "submissionCount">) => void;
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
  const addAuditLog = useCallback((entityId: string, entityType: "form" | "submission", action: string, previousValue?: string, newValue?: string) => {
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
  }, [currentUser]);

  // Create a new form
  const createForm = useCallback((formData: Omit<Form, "id" | "createdBy" | "createdAt" | "updatedAt" | "slug" | "submissionCount">) => {
    if (!currentUser) return;
    
    const now = new Date().toISOString();
    const newForm: Form = {
      ...formData,
      id: `form${Date.now()}`,
      createdBy: currentUser.id,
      createdAt: now,
      updatedAt: now,
      slug: generateSlug(formData.title),
      submissionCount: 0,
    };
    
    setForms(prev => [...prev, newForm]);
    addAuditLog(newForm.id, "form", "create", undefined, "draft");
    toast.success("Form created successfully");
  }, [currentUser, addAuditLog]);

  // Update an existing form
  const updateForm = useCallback((updatedForm: Form) => {
    if (!currentUser) return;
    
    setForms(prev => 
      prev.map(form => 
        form.id === updatedForm.id 
          ? { ...updatedForm, updatedAt: new Date().toISOString() } 
          : form
      )
    );
    addAuditLog(updatedForm.id, "form", "update");
    toast.success("Form updated successfully");
  }, [currentUser, addAuditLog]);

  // Update form status
  const updateFormStatus = useCallback((formId: string, status: FormStatus) => {
    if (!currentUser) return;
    
    setForms(prev => {
      return prev.map(form => {
        if (form.id === formId) {
          const prevStatus = form.status;
          const now = new Date().toISOString();
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
  }, [currentUser, addAuditLog]);

  // Get form by ID
  const getFormById = useCallback((id: string): Form | undefined => {
    return forms.find(form => form.id === id);
  }, [forms]);

  // Get form by slug
  const getFormBySlug = useCallback((slug: string): Form | undefined => {
    return forms.find(form => form.slug === slug);
  }, [forms]);

  // Create submission
  const createSubmission = useCallback((formId: string, values: Record<string, any>) => {
    if (!currentUser) return;
    
    const form = forms.find(f => f.id === formId);
    if (!form) {
      toast.error("Form not found");
      return;
    }
    
    const now = new Date().toISOString();
    const newSubmission: Submission = {
      id: `sub${Date.now()}`,
      formId,
      userId: currentUser.id,
      status: "pending",
      values,
      createdAt: now,
      updatedAt: now,
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
    
    addAuditLog(newSubmission.id, "submission", "create", undefined, "pending");
    toast.success("Form submitted successfully");
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
  const updateSubmissionStatus = useCallback((submissionId: string, status: SubmissionStatus) => {
    if (!currentUser) return;
    
    setSubmissions(prev => {
      return prev.map(sub => {
        if (sub.id === submissionId) {
          const prevStatus = sub.status;
          const now = new Date().toISOString();
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
  }, [currentUser, addAuditLog]);

  // Get audit logs by entity ID
  const getAuditLogsByEntityId = useCallback((entityId: string): AuditLog[] => {
    return auditLogs.filter(log => log.entityId === entityId);
  }, [auditLogs]);

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
