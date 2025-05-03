
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Plus, RefreshCcw } from "lucide-react";
import UserTable from "@/components/Admin/UserTable";
import AddUserDialog from "@/components/Admin/AddUserDialog";

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  created_at: string;
  last_sign_in_at: string | null;
}

const UserManagement = () => {
  const { isAdmin, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    } else if (!isAdmin) {
      navigate("/dashboard");
    } else {
      fetchUsers();
    }
  }, [isAuthenticated, isAdmin, navigate]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, email, role, created_at");

      if (error) {
        throw error;
      }

      // Get auth data for each user to get last_sign_in_at
      const enhancedUsers = await Promise.all(
        data.map(async (user) => {
          const { data: authData } = await supabase.auth.admin.getUserById(user.id);
          return {
            ...user,
            last_sign_in_at: authData?.user?.last_sign_in_at || null,
          };
        })
      );

      setUsers(enhancedUsers);
    } catch (error: any) {
      toast.error(`Error fetching users: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUserDeleted = (userId: string) => {
    setUsers(users.filter(user => user.id !== userId));
  };

  const handleUserUpdated = (updatedUser: User) => {
    setUsers(users.map(user => 
      user.id === updatedUser.id ? updatedUser : user
    ));
  };

  const handleUserAdded = () => {
    fetchUsers();
    setIsAddUserOpen(false);
  };

  if (!isAdmin) {
    return null; // Will be redirected via useEffect
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => fetchUsers()}
            disabled={loading}
          >
            <RefreshCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setIsAddUserOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add a User
          </Button>
        </div>
      </div>

      <Card className="p-6">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              Please add your first user by clicking: Add a User
            </p>
            <Button onClick={() => setIsAddUserOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add a User
            </Button>
          </div>
        ) : (
          <UserTable 
            users={users} 
            onUserDeleted={handleUserDeleted}
            onUserUpdated={handleUserUpdated}
          />
        )}
      </Card>

      <AddUserDialog 
        open={isAddUserOpen} 
        onOpenChange={setIsAddUserOpen} 
        onUserAdded={handleUserAdded} 
      />
    </div>
  );
};

export default UserManagement;
