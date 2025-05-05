import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Session } from "@supabase/supabase-js";
import { getUserRoleDirectly, isAdminEmail } from "@/utils/authHelpers";

type UserRole = "admin" | "user";

interface Profile {
  id: string;
  name: string;
  email: string;
  username: string;
  role: UserRole;
  created_at?: string;
  updated_at?: string;
}

interface AuthUser {
  id: string;
  name: string;
  email: string;
  username: string;
  role: UserRole;
}

interface AuthContextType {
  currentUser: AuthUser | null;
  profile: Profile | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<boolean>;
  inviteUser: (email: string, role?: UserRole) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  // Check for existing session and set up auth state listener
  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        console.log("Auth state change event:", event);
        setSession(newSession);
        
        if (newSession?.user) {
          // Initialize with basic user data
          const userData: AuthUser = {
            id: newSession.user.id,
            name: newSession.user.user_metadata?.name || "User",
            email: newSession.user.email || "",
            username: newSession.user.user_metadata?.username || newSession.user.email?.split('@')[0] || "",
            // Preserve existing role if available, otherwise default to user
            role: currentUser?.role || "user" 
          };
          
          setCurrentUser(userData);
          
          // Check if email should grant admin access as a backup
          const shouldBeAdmin = isAdminEmail(newSession.user.email);
          if (shouldBeAdmin) {
            setIsAdmin(true);
            // Update the user role to admin
            setCurrentUser(prev => prev ? {
              ...prev,
              role: "admin"
            } : null);
          }
          
          // Fetch profile data separately to avoid recursive auth calls
          setTimeout(() => {
            fetchUserProfile(newSession.user.id);
          }, 0);
        } else {
          setCurrentUser(null);
          setProfile(null);
          setIsAdmin(false);
          setIsLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      console.log("Existing session check:", existingSession ? "Found session" : "No session");
      setSession(existingSession);
      
      if (existingSession?.user) {
        // Initialize with basic user data
        const userData: AuthUser = {
          id: existingSession.user.id,
          name: existingSession.user.user_metadata?.name || "User",
          email: existingSession.user.email || "",
          username: existingSession.user.user_metadata?.username || existingSession.user.email?.split('@')[0] || "",
          // Default role until we fetch from profile
          role: "user"
        };
        setCurrentUser(userData);
        
        // Check if email should grant admin access as a backup
        if (isAdminEmail(existingSession.user.email)) {
          setIsAdmin(true);
          // Update the user role to admin based on email
          setCurrentUser(prev => prev ? {
            ...prev,
            role: "admin"
          } : null);
        }
        
        // Fetch profile data
        fetchUserProfile(existingSession.user.id);
      } else {
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log("Fetching profile for user:", userId);

      // First try to get the role using our security-definer function
      const role = await getUserRoleDirectly(userId);
      
      if (role) {
        console.log("Got user role from security definer function:", role);
        setIsAdmin(role === "admin");
        
        // Update current user with the role we found
        setCurrentUser(prev => prev ? {
          ...prev,
          role: role
        } : null);
        
        // Continue with trying to fetch full profile data
      } else {
        console.log("Could not get role from function, checking email");
        // Fallback: Check if user should be admin based on email domain
        if (currentUser?.email && isAdminEmail(currentUser.email)) {
          console.log("Admin access granted based on email domain");
          setIsAdmin(true);
          
          // Update the user role to admin since we can't get the profile
          setCurrentUser(prev => prev ? {
            ...prev,
            role: "admin"
          } : null);
        }
      }

      // Try to fetch the full profile
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (error) {
          console.error("Error fetching profile:", error);
          // We've already set admin status based on the getUserRoleDirectly function above
          setIsLoading(false);
          return;
        }

        if (data) {
          console.log("Profile data received:", data);
          const profileData = data as Profile;
          setProfile(profileData);
          
          // Update user with additional data from profile
          setCurrentUser(prev => {
            if (!prev) return null;
            return {
              ...prev,
              name: profileData.name || prev.name,
              username: profileData.username || prev.username,
              role: profileData.role as UserRole
            };
          });
          
          // Set admin status based on profile role
          setIsAdmin(profileData.role === "admin");
          
          console.log("User profile loaded:", profileData);
          console.log("User role:", profileData.role);
          console.log("isAdmin set to:", profileData.role === "admin");
        } else {
          console.log("No profile data found for user:", userId);
        }
      } catch (profileError) {
        console.error("Error fetching user profile details:", profileError);
      }
    } catch (error) {
      console.error("Error in profile fetching process:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        toast.error(error.message);
        return false;
      }
      
      if (data.user) {
        // After login success, we'll let the auth state listener handle updating the user
        toast.success(`Welcome back, ${data.user.email}!`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Failed to login. Please try again.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
      toast.info("You have been logged out");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to log out. Please try again.");
    }
  };

  const resetPassword = async (email: string): Promise<boolean> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password',
      });
      
      if (error) {
        toast.error(error.message);
        return false;
      }
      
      toast.success("Password reset instructions sent to your email");
      return true;
    } catch (error) {
      console.error("Password reset error:", error);
      toast.error("Failed to send reset instructions. Please try again.");
      return false;
    }
  };

  const inviteUser = async (email: string, role: UserRole = "user"): Promise<boolean> => {
    try {
      if (!isAdmin) {
        toast.error("Only administrators can invite users");
        return false;
      }

      const { error } = await supabase.functions.invoke("invite-user", {
        body: { email, role },
      });

      if (error) {
        console.error("Error inviting user:", error);
        toast.error(`Failed to invite user: ${error.message}`);
        return false;
      }

      toast.success(`Invitation sent to ${email}`);
      return true;
    } catch (error) {
      console.error("Error inviting user:", error);
      toast.error("Failed to send invitation. Please try again.");
      return false;
    }
  };

  // Add additional debugging
  console.log("Auth Context - isAdmin:", isAdmin, "currentUser:", currentUser);

  const value = {
    currentUser,
    profile,
    isAuthenticated: !!session,
    isAdmin,
    isLoading,
    login,
    logout,
    resetPassword,
    inviteUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
