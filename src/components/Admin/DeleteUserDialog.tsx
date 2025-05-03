
import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  created_at: string;
  last_sign_in_at: string | null;
}

interface DeleteUserDialogProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserDeleted: (userId: string) => void;
}

const DeleteUserDialog = ({ 
  user, 
  open, 
  onOpenChange, 
  onUserDeleted 
}: DeleteUserDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      // Delete the user from auth.users - this will cascade delete the profile
      const { error } = await supabase.auth.admin.deleteUser(user.id);

      if (error) {
        throw new Error(error.message);
      }

      toast.success(`User ${user.username || user.email} deleted successfully`);
      onUserDeleted(user.id);
      onOpenChange(false);
    } catch (error: any) {
      toast.error(`Failed to delete user: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete User</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete {user?.username || user?.email}? 
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteUserDialog;
