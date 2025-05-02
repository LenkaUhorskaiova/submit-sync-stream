
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "../utils/dummyData";
import { toast } from "sonner";
import { Session } from "@supabase/supabase-js";

type UserRole = "admin" | "user";

interface Profile {
  id: string;
  name: string;
  email: string;
  username: string;
  role: UserRole;
}

interface AuthUser extends Omit<User, "role"> {
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

  // Check for existing session and set up auth state listener
  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        setSession(newSession);
        if (newSession?.user) {
          const userData = {
            id: newSession.user.id,
            name: newSession.user.user_metadata?.name || "User",
            email: newSession.user.email || "",
            username: newSession.user.user_metadata?.username || newSession.user.email?.split('@')[0] || "",
            role: newSession.user.user_metadata?.role || "user"
          };
          setCurrentUser(userData);
          
          // Fetch profile data separately to avoid recursive auth calls
          setTimeout(() => {
            fetchUserProfile(newSession.user.id);
          }, 0);
        } else {
          setCurrentUser(null);
          setProfile(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      setSession(existingSession);
      setIsLoading(false);
      
      if (existingSession?.user) {
        const userData = {
          id: existingSession.user.id,
          name: existingSession.user.user_metadata?.name || "User",
          email: existingSession.user.email || "",
          username: existingSession.user.user_metadata?.username || existingSession.user.email?.split('@')[0] || "",
          role: existingSession.user.user_metadata?.role || "user"
        };
        setCurrentUser(userData);
        
        // Fetch profile data
        fetchUserProfile(existingSession.user.id);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        return;
      }

      if (data) {
        setProfile(data as Profile);
        // Update role from profile if available
        if (currentUser && data.role) {
          setCurrentUser({
            ...currentUser,
            role: data.role as UserRole
          });
        }
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
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

  const isAdmin = profile?.role === "admin" || currentUser?.role === "admin";

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
