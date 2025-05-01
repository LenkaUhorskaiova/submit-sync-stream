
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
  return {
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
  };
};
