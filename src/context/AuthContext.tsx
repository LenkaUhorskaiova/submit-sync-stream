
import { createContext, useContext, useState, ReactNode } from "react";
import { User, users } from "../utils/dummyData";
import { toast } from "sonner";

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Check for existing session
  useState(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('currentUser');
      }
    }
  });

  const login = async (username: string, password: string): Promise<boolean> => {
    // In a real app, this would be an API call to validate credentials
    // For this demo, we'll just check against our dummy data
    // Note: In a real app, NEVER store passwords in plain text like this
    const user = users.find((u) => u.username === username);
    
    // Simple authentication for demo purposes
    // In a real app, you would check hashed passwords
    if (user && password === "password") {
      setCurrentUser(user);
      localStorage.setItem('currentUser', JSON.stringify(user));
      toast.success(`Welcome back, ${user.name}!`);
      return true;
    }
    
    toast.error("Invalid username or password");
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    toast.info("You have been logged out");
  };

  const value = {
    currentUser,
    isAuthenticated: !!currentUser,
    login,
    logout,
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
