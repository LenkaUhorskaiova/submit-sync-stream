
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "../context/FormContext";
import { FormField } from "../utils/dummyData";
import { RenderField } from "../components/FormBuilder/FieldTypes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

const PublicForm = () => {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const { getFormBySlug, createSubmission } = useForm();
  
  const [values, setValues] = useState<Record<string, any>>({});
  const [submitted, setSubmitted] = useState(false);
  
  const form = getFormBySlug(slug || "");
  
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
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    const missingRequired = form.fields
      .filter(field => field.required)
      .find(field => !values[field.id]);
      
    if (missingRequired) {
      toast.error(`Please fill in the required field: ${missingRequired.label}`);
      return;
    }
    
    createSubmission(form.id, values);
    setSubmitted(true);
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
            }}>
              Submit Another Response
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
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
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent>
              <div className="space-y-6">
                {form.fields.map((field) => (
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
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full">Submit</Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default PublicForm;
