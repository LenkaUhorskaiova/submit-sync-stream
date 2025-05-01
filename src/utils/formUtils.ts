
import { Form, FormField, FormStatus } from "../utils/dummyData";

// Helper function to generate slug
export const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-');
};

// Helper for transforming Supabase form data to our app's format
export const transformFormFromSupabase = (
  form: any, 
  formFields: any[]
): Form => {
  const fields = formFields
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
    fields: fields,
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
};
