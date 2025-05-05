
import { supabase } from "@/integrations/supabase/client";

/**
 * Gets the user's role directly with a SQL query to avoid RLS policy recursion issues
 * @param userId The user's ID
 * @returns The user's role or null if not found
 */
export async function getUserRoleDirectly(userId: string): Promise<"admin" | "user" | null> {
  try {
    // Use direct query instead of RPC to avoid TypeScript errors
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error("Error getting user role:", error);
      return null;
    }
    
    return data?.role as "admin" | "user" | null;
  } catch (error) {
    console.error("Failed to get user role:", error);
    return null;
  }
}

/**
 * Manually sets a user as admin (helper for development)
 * @param email Email to check against for admin status
 * @returns True if the user should be considered an admin
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  
  const adminEmails = [
    "lenka.uhorskaiova@kineticsoftware.com",
    "admin@example.com"
  ];
  
  return adminEmails.includes(email.toLowerCase());
}
