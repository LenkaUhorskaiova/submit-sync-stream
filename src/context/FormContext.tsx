
import { createContext, useContext, useState, ReactNode } from "react";
import { Form, FormField, FormStatus, Submission, SubmissionStatus, forms as initialForms, submissions as initialSubmissions, auditLogs as initialAuditLogs, AuditLog } from "../utils/dummyData";
import { useAuth } from "./AuthContext";
import { useFormOperations } from "../hooks/useFormOperations";
import { useSubmissionOperations } from "../hooks/useSubmissionOperations";
import { useAuditLog } from "../hooks/useAuditLog";
import { useFormData } from "../hooks/useFormData";

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
  
  // Initialize audit log system
  const { addAuditLog, getAuditLogsByEntityId: getAuditLogsFn } = useAuditLog(
    currentUser?.id, 
    (updater) => setAuditLogs(updater)
  );

  // Initialize form operations
  const { createForm, updateForm, updateFormStatus } = useFormOperations(
    currentUser?.id, 
    addAuditLog, 
    (updater) => setForms(updater)
  );

  // Initialize submission operations
  const { createSubmission, updateSubmissionStatus } = useSubmissionOperations(
    currentUser?.id,
    addAuditLog,
    (updater) => setSubmissions(updater),
    (updater) => setForms(updater),
    forms
  );

  // Load data from Supabase
  useFormData(currentUser?.id, setForms, setSubmissions, setAuditLogs);

  // Getter utility functions
  const getFormById = (id: string): Form | undefined => {
    return forms.find(form => form.id === id);
  };

  const getFormBySlug = (slug: string): Form | undefined => {
    return forms.find(form => form.slug === slug);
  };

  const getSubmissionsByFormId = (formId: string): Submission[] => {
    return submissions.filter(sub => sub.formId === formId);
  };

  const getSubmissionById = (id: string): Submission | undefined => {
    return submissions.find(sub => sub.id === id);
  };

  const getAuditLogsByEntityId = (entityId: string): AuditLog[] => {
    return auditLogs.filter(log => log.entityId === entityId);
  };

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
