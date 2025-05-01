
import { supabase } from "@/integrations/supabase/client";
import { Form, Submission } from "../utils/dummyData";

// Send form invitation email
export const sendFormInvitation = async (
  email: string, 
  formSlug: string, 
  formTitle: string
): Promise<boolean> => {
  try {
    // Call the Supabase function to send email
    const { error } = await supabase.functions.invoke('send-form-invitation', {
      body: {
        email,
        formSlug,
        formTitle
      }
    });
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error sending form invitation:", error);
    return false;
  }
};

// Send form submission confirmation
export const sendSubmissionConfirmation = async (
  email: string, 
  form: Form, 
  submission: Submission
): Promise<boolean> => {
  try {
    // Call the Supabase function to send email
    const { error } = await supabase.functions.invoke('send-submission-confirmation', {
      body: {
        email,
        formTitle: form.title,
        submissionId: submission.id,
        submissionData: submission.values
      }
    });
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error sending submission confirmation:", error);
    return false;
  }
};
