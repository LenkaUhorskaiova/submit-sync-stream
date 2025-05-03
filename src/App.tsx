
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

import { AuthProvider } from "./context/AuthContext";
import { FormProvider } from "./context/FormContext";
import Layout from "./components/Layout/Layout";

import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import FormBuilder from "./pages/FormBuilder";
import FormView from "./pages/FormView";
import SubmissionList from "./pages/SubmissionList";
import SubmissionView from "./pages/SubmissionView";
import NotFound from "./pages/NotFound";
import PublicForm from "./pages/PublicForm";
import Login from "./pages/Auth/Login";
import ResetPassword from "./pages/Auth/ResetPassword";
import UserManagement from "./pages/UserManagement";
import ProtectedRoute from "./components/Auth/ProtectedRoute";
import AdminRoute from "./components/Auth/AdminRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <FormProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              
              <Route element={<ProtectedRoute />}>
                <Route element={<Layout />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/forms/:formId" element={<FormView />} />
                  <Route path="/submissions" element={<SubmissionList />} />
                  <Route path="/submissions/:submissionId" element={<SubmissionView />} />
                  
                  {/* Admin-only routes */}
                  <Route element={<AdminRoute />}>
                    <Route path="/form-builder" element={<FormBuilder />} />
                    <Route path="/form-builder/:formId" element={<FormBuilder />} />
                    <Route path="/users" element={<UserManagement />} /> {/* New route for user management */}
                  </Route>
                </Route>
              </Route>
              
              <Route path="/form/:slug" element={<PublicForm />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </FormProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
