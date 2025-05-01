
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "../context/FormContext";
import { FormField } from "../utils/dummyData";
import { RenderField } from "../components/FormBuilder/FieldTypes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight } from "lucide-react";

const STEPS_PER_PAGE = 3; // Number of fields to show per step

const PublicForm = () => {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const { getFormBySlug, createSubmission } = useForm();
  
  const [values, setValues] = useState<Record<string, any>>({});
  const [submitted, setSubmitted] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [startTime, setStartTime] = useState<string>(new Date().toISOString());
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const form = getFormBySlug(slug || "");
  
  // Calculate total steps
  const totalSteps = form ? Math.ceil(form.fields.length / STEPS_PER_PAGE) : 1;
  
  // Get current fields for the step
  const getCurrentFields = () => {
    if (!form) return [];
    
    const start = (currentStep - 1) * STEPS_PER_PAGE;
    const end = start + STEPS_PER_PAGE;
    
    return form.fields.slice(start, end);
  };
  
  // Save form data to local storage
  useEffect(() => {
    if (!form) return;
    
    const formKey = `form_${form.id}_values`;
    
    // Load values from local storage if they exist
    const savedValues = localStorage.getItem(formKey);
    if (savedValues && Object.keys(values).length === 0) {
      const parsedValues = JSON.parse(savedValues);
      setValues(parsedValues.values || {});
      if (parsedValues.startTime) {
        setStartTime(parsedValues.startTime);
      }
      if (parsedValues.lastSaved) {
        setLastSaved(parsedValues.lastSaved);
      }
    }
    
    // Save to local storage whenever values change
    const saveToLocalStorage = () => {
      const now = new Date().toISOString();
      const dataToSave = {
        values,
        startTime,
        lastSaved: now
      };
      localStorage.setItem(formKey, JSON.stringify(dataToSave));
      setLastSaved(now);
    };
    
    // Save with a debounce
    const timeoutId = setTimeout(saveToLocalStorage, 1000);
    return () => clearTimeout(timeoutId);
    
  }, [values, form, startTime]);
  
  if (!form) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Form Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">
              The form you're looking for doesn't exist or has been removed.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={() => navigate("/")} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Return to Home
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  if (form.status !== "approved") {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Form Not Available</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">
              This form is not yet available for submissions.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={() => navigate("/")} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Return to Home
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  const handleChange = (field: FormField, value: any) => {
    setValues(prev => ({
      ...prev,
      [field.id]: value
    }));
    
    // Clear error if field is now valid
    if (errors[field.id]) {
      validateField(field, value);
    }
  };
  
  const validateField = (field: FormField, value: any): boolean => {
    // Skip validation if field is not required and value is empty
    if (!field.required && (value === undefined || value === null || value === "")) {
      setErrors(prev => {
        const newErrors = {...prev};
        delete newErrors[field.id];
        return newErrors;
      });
      return true;
    }
    
    // Validate required fields
    if (field.required && (value === undefined || value === null || value === "")) {
      setErrors(prev => ({
        ...prev,
        [field.id]: `${field.label} is required`
      }));
      return false;
    }
    
    // Add type-specific validation here if needed
    // For example, email validation, number range validation, etc.
    
    // Clear error if valid
    setErrors(prev => {
      const newErrors = {...prev};
      delete newErrors[field.id];
      return newErrors;
    });
    
    return true;
  };
  
  const validateCurrentStep = (): boolean => {
    const currentFields = getCurrentFields();
    let isValid = true;
    
    for (const field of currentFields) {
      const value = values[field.id];
      if (!validateField(field, value)) {
        isValid = false;
      }
    }
    
    return isValid;
  };
  
  const handleNext = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
      window.scrollTo(0, 0);
    } else {
      toast.error("Please fix the errors before proceeding");
    }
  };
  
  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    window.scrollTo(0, 0);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    let isValid = true;
    for (const field of form.fields) {
      const value = values[field.id];
      if (!validateField(field, value)) {
        isValid = false;
      }
    }
    
    if (!isValid) {
      toast.error("Please fix all errors before submitting");
      return;
    }
    
    // Add metadata to submission
    const submissionData = {
      ...values,
      __meta: {
        startTime,
        submitTime: new Date().toISOString(),
        lastSaved
      }
    };
    
    createSubmission(form.id, submissionData);
    setSubmitted(true);
    
    // Clear local storage
    localStorage.removeItem(`form_${form.id}_values`);
  };
  
  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Submission Received</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">
              Thank you for your submission. It has been received successfully.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={() => {
              setValues({});
              setSubmitted(false);
              setCurrentStep(1);
              setStartTime(new Date().toISOString());
              setLastSaved(null);
            }}>
              Submit Another Response
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  const currentFields = getCurrentFields();
  
  return (
    <div className="min-h-screen flex flex-col py-12 bg-gray-50">
      <div className="container max-w-3xl mx-auto px-4">
        <div className="flex items-center mb-6">
          <div className="flex-1 text-center">
            <img 
              src="/lovable-uploads/dc000b79-1594-460f-b769-b3aae0560016.png" 
              alt="FLOE Logo" 
              className="mx-auto h-10 mb-2"
            />
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>{form.title}</CardTitle>
            {form.description && <p className="text-muted-foreground">{form.description}</p>}
            
            {/* Progress indicator */}
            <div className="mt-4">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium">Step {currentStep} of {totalSteps}</span>
                <span className="text-sm text-muted-foreground">{Math.round((currentStep / totalSteps) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-primary h-2.5 rounded-full transition-all" 
                  style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                ></div>
              </div>
            </div>
          </CardHeader>
          
          <form onSubmit={(e) => e.preventDefault()}>
            <CardContent>
              <div className="space-y-6">
                {currentFields.map((field) => (
                  <div key={field.id} className="space-y-2">
                    <label className="text-sm font-medium">
                      {field.label} {field.required && <span className="text-destructive">*</span>}
                    </label>
                    {field.description && (
                      <p className="text-xs text-muted-foreground">{field.description}</p>
                    )}
                    <RenderField 
                      field={field} 
                      value={values[field.id]} 
                      onChange={(value) => handleChange(field, value)} 
                    />
                    {errors[field.id] && (
                      <p className="text-sm text-destructive mt-1">{errors[field.id]}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-between">
              {currentStep > 1 ? (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handlePrevious}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" /> Previous
                </Button>
              ) : (
                <div></div> // Empty div to maintain layout with justify-between
              )}
              
              {currentStep < totalSteps ? (
                <Button 
                  type="button" 
                  onClick={handleNext}
                  className="flex items-center gap-2"
                >
                  Next <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button type="button" onClick={handleSubmit}>Submit</Button>
              )}
            </CardFooter>
          </form>
        </Card>
        
        {lastSaved && (
          <p className="text-center text-xs text-muted-foreground mt-4">
            Last saved: {new Date(lastSaved).toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
};

export default PublicForm;
