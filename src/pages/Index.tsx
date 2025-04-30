
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoginForm from "../components/Auth/LoginForm";

const Index = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <img 
            src="/lovable-uploads/dc000b79-1594-460f-b769-b3aae0560016.png" 
            alt="FLOE Logo" 
            className="mx-auto h-12 mb-4"
          />
          <h1 className="text-4xl font-bold text-primary">Form Builder</h1>
          <p className="text-muted-foreground mt-2">
            Create, manage, and approve forms and submissions
          </p>
        </div>
        
        <LoginForm />
      </div>
    </div>
  );
};

export default Index;
