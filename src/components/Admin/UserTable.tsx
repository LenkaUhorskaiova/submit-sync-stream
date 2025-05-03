
import { useState } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import EditUserDialog from "./EditUserDialog";
import DeleteUserDialog from "./DeleteUserDialog";

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  created_at: string;
  last_sign_in_at: string | null;
}

interface UserTableProps {
  users: User[];
  onUserDeleted: (userId: string) => void;
  onUserUpdated: (user: User) => void;
}

const UserTable = ({ users, onUserDeleted, onUserUpdated }: UserTableProps) => {
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (e) {
      return "Invalid date";
    }
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Username</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Created On</TableHead>
            <TableHead>Last Seen</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.username || "-"}</TableCell>
              <TableCell>
                <span className={`px-2 py-1 rounded text-xs ${
                  user.role === "admin" 
                    ? "bg-primary/20 text-primary" 
                    : "bg-muted text-muted-foreground"
                }`}>
                  {user.role}
                </span>
              </TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{formatDate(user.created_at)}</TableCell>
              <TableCell>{formatDate(user.last_sign_in_at)}</TableCell>
              <TableCell className="text-right">
                <Button 
                  variant="outline" 
                  size="icon"
                  className="mr-2"
                  onClick={() => setEditingUser(user)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon"
                  className="text-destructive hover:bg-destructive/10"
                  onClick={() => setDeletingUser(user)}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <EditUserDialog
        user={editingUser}
        open={!!editingUser}
        onOpenChange={(open) => {
          if (!open) setEditingUser(null);
        }}
        onUserUpdated={onUserUpdated}
      />

      <DeleteUserDialog
        user={deletingUser}
        open={!!deletingUser}
        onOpenChange={(open) => {
          if (!open) setDeletingUser(null);
        }}
        onUserDeleted={onUserDeleted}
      />
    </>
  );
};

export default UserTable;
