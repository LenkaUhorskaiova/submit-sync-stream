
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useForm } from "../context/FormContext";
import { Form as FormType } from "../utils/dummyData";
import FormBuilder from "../components/FormBuilder/DragDropField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ArrowLeft, Eye, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const FormBuilderPage = () => {
  const navigate = useNavigate();
  const { formId } = useParams<{ formId: string }>();
  const { isAuthenticated, currentUser } = useAuth();
  const { forms, getFormById, createForm, updateForm, updateFormStatus } = useForm();
  
  const [formData, setFormData] = useState<Partial<FormType>>({
    title: "",
    description: "",
    fields: [],
    status: "draft",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
      return;
    }
    
    if (formId) {
      const existingForm = getFormById(formId);
      if (existingForm) {
        // If editing an existing form, populate the form data
        setFormData(existingForm);
      } else {
        // If form not found, redirect to the dashboard
        toast.error("Form not found");
        navigate("/dashboard");
      }
    }
  }, [isAuthenticated, navigate, formId, getFormById]);
  
  const handleFieldsUpdate = (updatedFields: FormType["fields"]) => {
    setFormData((prev) => ({ ...prev, fields: updatedFields }));
    setError(null);
  };
  
  const handleSave = async () => {
    if (!formData.title) {
      setError("Please provide a form title");
      toast.error("Please provide a form title");
      return;
    }
    
    if (formData.fields && formData.fields.length === 0) {
      setError("Please add at least one field to your form");
      toast.error("Please add at least one field to your form");
      return;
    }
    
    setIsSaving(true);
    setError(null);
    
    try {
      if (formId && getFormById(formId)) {
        // Update existing form
        await updateForm(formData as FormType);
        toast.success("Form saved successfully");
      } else {
        // Create new form
        const newFormId = await createForm({
          title: formData.title,
          description: formData.description || "", 
          fields: formData.fields || [], 
          status: "draft",
        });
        
        if (newFormId) {
          toast.success("New form created successfully");
          navigate(`/form-builder/${newFormId}`);
        } else {
          setError("Failed to create form. Please try again.");
        }
      }
    } catch (error: any) {
      setError(`Error: ${error.message || "An unexpected error occurred"}`);
      toast.error(`Error: ${error.message || "An unexpected error occurred"}`);
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleSubmitForApproval = async () => {
    if (!formId) return;
    
    setIsSaving(true);
    try {
      await updateFormStatus(formId, "pending");
      toast.success("Form submitted for approval");
      navigate("/dashboard");
    } catch (error: any) {
      setError(`Error: ${error.message || "An unexpected error occurred"}`);
      toast.error(`Error: ${error.message || "An unexpected error occurred"}`);
    } finally {
      setIsSaving(false);
    }
  };
  
  const isFormEditable = formData.status === "draft";
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <h1 className="text-2xl font-bold">
          {formId ? "Edit Form" : "Create New Form"}
        </h1>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!isFormEditable && (
        <Card className="mb-6 border-warning/50 bg-warning/10">
          <CardContent className="py-4">
            <p className="text-warning">
              This form is currently in "{formData.status}" status and cannot be edited. 
              To make changes, please create a new version.
            </p>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="builder" className="space-y-4">
        <TabsList>
          <TabsTrigger value="builder">Form Builder</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>
        
        <TabsContent value="builder">
          <div className="grid gap-6 md:grid-cols-4">
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>Form Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Form Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => {
                        setFormData({ ...formData, title: e.target.value });
                        if (e.target.value) setError(null);
                      }}
                      placeholder="Enter form title"
                      disabled={!isFormEditable || isSaving}
                      className={!formData.title && error ? "border-red-500" : ""}
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description (optional)</Label>
                    <Textarea
                      id="description"
                      value={formData.description || ""}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Enter form description"
                      disabled={!isFormEditable || isSaving}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-2">
                {isFormEditable && (
                  <>
                    <Button 
                      onClick={handleSave} 
                      className="w-full" 
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Form"
                      )}
                    </Button>
                    {formId && (
                      <Button 
                        onClick={handleSubmitForApproval} 
                        variant="secondary" 
                        className="w-full"
                        disabled={formData.fields?.length === 0 || isSaving}
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          "Submit for Approval"
                        )}
                      </Button>
                    )}
                  </>
                )}
                {!isFormEditable && formId && (
                  <Button 
                    onClick={() => navigate(`/forms/${formId}`)} 
                    className="w-full"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View Form
                  </Button>
                )}
              </CardFooter>
            </Card>
            
            <div className="md:col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle>Form Fields</CardTitle>
                </CardHeader>
                <CardContent>
                  {isFormEditable ? (
                    <FormBuilder
                      fields={formData.fields || []}
                      onFieldsUpdate={handleFieldsUpdate}
                    />
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        This form is in {formData.status} status and cannot be edited.
                      </p>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => {
                          // Clone the form
                          const newForm = {
                            title: `${formData.title} (Copy)`,
                            description: formData.description || "", 
                            fields: formData.fields || [],
                            status: "draft" as const,
                          };
                          
                          setIsSaving(true);
                          createForm(newForm).then((newFormId) => {
                            if (newFormId) {
                              toast.success("Form cloned successfully");
                              navigate(`/form-builder/${newFormId}`);
                            } else {
                              setError("Failed to clone form");
                              toast.error("Failed to clone form");
                            }
                          }).catch(error => {
                            setError(`Error cloning form: ${error.message || "An unexpected error occurred"}`);
                            toast.error(`Error cloning form: ${error.message || "An unexpected error occurred"}`);
                          }).finally(() => {
                            setIsSaving(false);
                          });
                        }}
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Cloning...
                          </>
                        ) : (
                          "Clone Form to Edit"
                        )}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="preview">
          <Card>
            <CardHeader>
              <CardTitle>{formData.title || "Untitled Form"}</CardTitle>
              {formData.description && (
                <p className="text-muted-foreground">{formData.description}</p>
              )}
            </CardHeader>
            <CardContent>
              {formData.fields && formData.fields.length > 0 ? (
                <div className="space-y-6">
                  {formData.fields.map((field) => (
                    <div key={field.id} className="space-y-2">
                      <Label htmlFor={field.id}>
                        {field.label} {field.required && <span className="text-destructive">*</span>}
                      </Label>
                      {field.description && (
                        <p className="text-sm text-muted-foreground">{field.description}</p>
                      )}
                      <div className="pointer-events-none">
                        {/* This is just a preview, so we use disabled fields */}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No fields added to this form yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FormBuilderPage;
