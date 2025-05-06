
import { Form, FormField } from "./dummyData";

// Helper function to transform Supabase data to our app format
export const transformFormFromSupabase = (form: any, fieldsData: any[] = []): Form => {
  // Filter fields related to this form
  const formFields: FormField[] = fieldsData
    .filter(field => field.form_id === form.id)
    .map(field => ({
      id: field.id,
      type: field.type,
      label: field.label,
      placeholder: field.placeholder || undefined,
      required: field.required || false,
      options: field.options || undefined,
      fieldOrder: field.field_order,
      description: field.description || undefined
    }))
    .sort((a, b) => a.fieldOrder - b.fieldOrder);
  
  // Return the transformed form object
  return {
    id: form.id,
    title: form.title,
    description: form.description || "",
    slug: form.slug,
    fields: formFields, // This might be empty if we couldn't fetch form fields
    status: form.status,
    createdBy: form.created_by,
    createdAt: form.created_at,
    updatedAt: form.updated_at,
    approvedBy: form.approved_by || undefined,
    approvedAt: form.approved_at || undefined,
    rejectedBy: form.rejected_by || undefined,
    rejectedAt: form.rejected_at || undefined,
    submissionCount: form.submission_count || 0
  };
};

// Generate a slug from a title
export const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .substring(0, 50); // Truncate to reasonable length
};

// Validates form data before saving
export const validateForm = (form: Partial<Form>): string | null => {
  if (!form.title || form.title.trim().length === 0) {
    return "Title is required";
  }
  
  if (!form.status) {
    return "Status is required";
  }
  
  if (!form.fields || form.fields.length === 0) {
    return "At least one form field is required";
  }
  
  // Check for required field properties
  for (let i = 0; i < form.fields.length; i++) {
    const field = form.fields[i];
    if (!field.type) {
      return `Field #${i+1} is missing a type`;
    }
    if (!field.label) {
      return `Field #${i+1} is missing a label`;
    }
  }
  
  return null;
};
