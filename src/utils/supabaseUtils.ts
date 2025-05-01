
import { Json } from "@/integrations/supabase/types";
import { FieldValue, Submission, SubmissionStatus } from "../utils/dummyData";

// Helper function to safely convert Json to Record<string, FieldValue>
export const convertJsonToFieldValues = (jsonData: Json): Record<string, FieldValue> => {
  if (typeof jsonData === 'object' && jsonData !== null) {
    return jsonData as Record<string, FieldValue>;
  }
  // Return empty object as fallback
  return {};
};

// Helper for transforming Supabase submission data to our app's format
export const transformSubmissionFromSupabase = (sub: any): Submission => {
  const values = convertJsonToFieldValues(sub.values);
  
  // Extract metadata if it exists
  let metadata = {};
  if (values.__meta) {
    metadata = values.__meta;
    // Remove metadata from values to avoid exposing it directly in the UI
    delete values.__meta;
  }
  
  return {
    id: sub.id,
    formId: sub.form_id,
    userId: sub.user_id || "",
    status: sub.status as SubmissionStatus,
    values: values,
    metadata: metadata as Record<string, any>,
    createdAt: sub.created_at,
    updatedAt: sub.updated_at,
    approvedBy: sub.approved_by || undefined,
    approvedAt: sub.approved_at || undefined,
    rejectedBy: sub.rejected_by || undefined,
    rejectedAt: sub.rejected_at || undefined
  };
};

// Helper to format audit logs
export const formatAuditLogEvent = (action: string, entityType: string): string => {
  switch (action) {
    case 'create':
      return `${entityType === 'form' ? 'Form' : 'Submission'} created`;
    case 'update':
      return `${entityType === 'form' ? 'Form' : 'Submission'} updated`;
    case 'status_update':
      return `${entityType === 'form' ? 'Form' : 'Submission'} status changed`;
    default:
      return action;
  }
};

// Helper to get human-readable timestamp
export const formatTimestamp = (timestamp: string): string => {
  return new Date(timestamp).toLocaleString();
};
