
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../ui/button";
import { LogOut, User, Shield } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import UserManagement from "../Admin/UserManagement";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const Header = () => {
  const { currentUser, isAuthenticated, isAdmin, logout } = useAuth();

  return (
    <header className="bg-white border-b border-border">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <div className="flex items-center">
          <Link to={isAuthenticated ? "/dashboard" : "/login"}>
            <div className="flex items-center gap-2">
              <img 
                src="/lovable-uploads/dc000b79-1594-460f-b769-b3aae0560016.png" 
                alt="FLOE Logo" 
                className="h-8"
              />
              <span className="text-xl font-semibold text-primary hidden sm:inline">Form Builder</span>
            </div>
          </Link>
        </div>
        
        {isAuthenticated && currentUser && (
          <div className="flex items-center gap-4">
            {isAdmin && (
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="hidden sm:flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>Invite Users</span>
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>User Management</SheetTitle>
                    <SheetDescription>
                      Invite new users to the system
                    </SheetDescription>
                  </SheetHeader>
                  <div className="mt-6">
                    <UserManagement />
                  </div>
                </SheetContent>
              </Sheet>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="max-w-[100px] truncate">{currentUser.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel className="flex items-center gap-2">
                  {isAdmin && <Shield className="h-4 w-4 text-primary" />}
                  <span>{currentUser.email}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => logout()}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
