
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../ui/button";
import { LogOut } from "lucide-react";

const Header = () => {
  const { isAuthenticated, logout } = useAuth();

  return (
    <header className="bg-white border-b border-border">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <div className="flex items-center">
          <Link to={isAuthenticated ? "/dashboard" : "/"}>
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
        
        {isAuthenticated && (
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={logout} className="flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </Button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
