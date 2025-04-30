
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
              <Route path="/" element={<Index />} />
              <Route element={<Layout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/form-builder" element={<FormBuilder />} />
                <Route path="/form-builder/:formId" element={<FormBuilder />} />
                <Route path="/forms/:formId" element={<FormView />} />
                <Route path="/submissions" element={<SubmissionList />} />
                <Route path="/submissions/:submissionId" element={<SubmissionView />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </FormProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
