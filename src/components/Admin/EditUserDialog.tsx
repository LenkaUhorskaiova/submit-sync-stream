
import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const formSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  role: z.enum(["admin", "user"], {
    required_error: "Please select a role",
  }),
});

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  created_at: string;
  last_sign_in_at: string | null;
}

interface EditUserDialogProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserUpdated: (user: User) => void;
}

const EditUserDialog = ({ user, open, onOpenChange, onUserUpdated }: EditUserDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: user?.email || "",
      role: (user?.role as "admin" | "user") || "user",
    },
  });

  // Update form values when the user changes
  useEffect(() => {
    if (user) {
      form.reset({
        email: user.email,
        role: user.role as "admin" | "user",
      });
    }
  }, [user, form]);

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) return;

    try {
      setIsLoading(true);

      // Update profile in the database
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          role: values.role,
          email: values.email 
        })
        .eq('id', user.id);

      if (profileError) {
        throw new Error(profileError.message);
      }

      // Update email in auth.users via an admin API
      if (values.email !== user.email) {
        const { error: authError } = await supabase.auth.admin.updateUserById(
          user.id,
          { email: values.email }
        );

        if (authError) {
          throw new Error(authError.message);
        }
      }

      toast.success(`User ${user.username || values.email} updated successfully`);
      
      // Update the local state with the new values
      onUserUpdated({
        ...user,
        email: values.email,
        role: values.role
      });
      
      onOpenChange(false);
    } catch (error: any) {
      toast.error(`Failed to update user: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditUserDialog;
