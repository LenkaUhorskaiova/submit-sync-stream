
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Loader2 } from "lucide-react";

const AdminRoute = () => {
  const { isAdmin, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // First check if user is authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // Then check if the user is an admin
  if (!isAdmin) {
    console.log("Access denied: User is not an admin");
    return <Navigate to="/dashboard" />;
  }

  console.log("Admin access granted");
  return <Outlet />;
};

export default AdminRoute;
