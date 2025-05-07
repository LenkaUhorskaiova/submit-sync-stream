
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useForm } from "../context/FormContext";
import { RenderField } from "../components/FormBuilder/FieldTypes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Check, X, FileDown, Mail } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const FormView = () => {
  const navigate = useNavigate();
  const { formId } = useParams<{ formId: string }>();
  const { isAuthenticated, currentUser } = useAuth();
  const { getFormById, updateFormStatus, getAuditLogsByEntityId } = useForm();
  
  const [form, setForm] = useState<ReturnType<typeof getFormById>>();
  const [auditLogs, setAuditLogs] = useState<ReturnType<typeof getAuditLogsByEntityId>>([]);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [emailList, setEmailList] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [canEdit, setCanEdit] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
      return;
    }
    
    if (!formId) {
      navigate("/dashboard");
      return;
    }
    
    const formData = getFormById(formId);
    if (!formData) {
      toast.error("Form not found");
      navigate("/dashboard");
      return;
    }
    
    setForm(formData);
    setAuditLogs(getAuditLogsByEntityId(formId));
    
    // Check if user is admin
    const isUserAdmin = currentUser?.role === "admin";
    setIsAdmin(isUserAdmin);
    
    // Check if user can edit this form
    // A form is editable if:
    // 1. It is in draft or pending status AND
    // 2. User is either the creator or an admin
    const isCreator = formData.createdBy === currentUser?.id;
    const isFormEditable = formData.status === "draft" || formData.status === "pending";
    setCanEdit(isFormEditable && (isCreator || isUserAdmin));

    // Pre-fill email fields when form data is loaded
    if (formData) {
      setEmailSubject(`Please complete the ${formData.title} form`);
      setEmailMessage(`Hello,\n\nPlease complete the ${formData.title} form using the link below:\n\n[Form Link]\n\nThank you!`);
    }
  }, [formId, isAuthenticated, navigate, getFormById, getAuditLogsByEntityId, currentUser]);

  const handleApprove = async () => {
    if (!formId || !isAdmin) {
      toast.error("You do not have permission to approve this form");
      return;
    }
    
    if (form?.status !== "pending") {
      toast.error("Only forms in pending status can be approved");
      return;
    }
    
    const success = await updateFormStatus(formId, "approved");
    if (success) {
      toast.success("Form approved successfully");
      setShowApprovalDialog(false);
      
      // Refresh form data
      const updatedForm = getFormById(formId);
      setForm(updatedForm);
      setAuditLogs(getAuditLogsByEntityId(formId));
    } else {
      toast.error("Failed to approve form");
    }
  };

  const handleReject = async () => {
    if (!formId || !isAdmin) {
      toast.error("You do not have permission to reject this form");
      return;
    }
    
    if (form?.status !== "pending") {
      toast.error("Only forms in pending status can be rejected");
      return;
    }
    
    const success = await updateFormStatus(formId, "rejected");
    if (success) {
      toast.success("Form rejected");
      setShowRejectDialog(false);
      
      // Refresh form data
      const updatedForm = getFormById(formId);
      setForm(updatedForm);
      setAuditLogs(getAuditLogsByEntityId(formId));
    } else {
      toast.error("Failed to reject form");
    }
  };

  const handleSendEmails = () => {
    if (!form) return;
    
    // Split the email list by commas or new lines
    const emails = emailList.split(/[\s,]+/).filter(email => email.trim().length > 0);
    
    if (emails.length === 0) {
      toast.error("Please enter at least one email address");
      return;
    }
    
    // Generate form URL to include in the email
    const formUrl = `${window.location.origin}/form/${form.slug}`;
    
    // In a real application, this would send an API request
    // Here we'll just show a success message
    toast.success(`Email invitation sent to ${emails.length} recipients`);
    console.log("Sending form link to emails:", emails);
    console.log("Form URL:", formUrl);
    console.log("Subject:", emailSubject);
    console.log("Message:", emailMessage.replace("[Form Link]", formUrl));
    
    setShowEmailDialog(false);
  };

  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case "draft": return "form-status-draft";
      case "pending": return "form-status-pending";
      case "approved": return "form-status-approved";
      case "rejected": return "form-status-rejected";
      default: return "bg-muted text-muted-foreground";
    }
  };

  if (!form) {
    return null;
  }
  
  // Only admins can approve/reject forms that are in pending status
  const canApproveOrReject = isAdmin && form.status === "pending";
  
  // Determine if the form is editable
  const isFormEditable = (form.status === "draft" || form.status === "pending") && 
                        (form.createdBy === currentUser?.id || isAdmin);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 space-y-4 md:space-y-0">
        <div className="flex items-center">
          <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-2xl font-bold">Form Details</h1>
        </div>
        <div className="flex items-center space-x-4">
          <Badge className={getStatusColor(form.status)}>{form.status}</Badge>
          {isFormEditable && (
            <Button variant="outline" onClick={() => navigate(`/form-builder/${form.id}`)}>
              Edit Form
            </Button>
          )}
          {canApproveOrReject && (
            <>
              <Button variant="outline" className="border-success text-success hover:bg-success/10" onClick={() => setShowApprovalDialog(true)}>
                <Check className="mr-2 h-4 w-4" />
                Approve
              </Button>
              <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive/10" onClick={() => setShowRejectDialog(true)}>
                <X className="mr-2 h-4 w-4" />
                Reject
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{form.title}</CardTitle>
              {form.description && <p className="text-muted-foreground">{form.description}</p>}
            </CardHeader>
            <CardContent>
              {form.fields.length > 0 ? (
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
                        disabled={true} 
                        value={undefined} 
                        onChange={() => {}} 
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-muted-foreground">This form has no fields</p>
                </div>
              )}
            </CardContent>
            {form.status === "approved" && (
              <CardFooter className="flex justify-end gap-4">
                <Button variant="outline" onClick={() => {
                  // Generate form URL
                  const formUrl = `${window.location.origin}/form/${form.slug}`;
                  navigator.clipboard.writeText(formUrl);
                  toast.success("Form URL copied to clipboard");
                }}>
                  Copy Form URL
                </Button>
                <Button variant="outline" onClick={() => setShowEmailDialog(true)}>
                  <Mail className="h-4 w-4 mr-2" />
                  Email Form Link
                </Button>
              </CardFooter>
            )}
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Form Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium">Submission Count</p>
                  <p>{form.submissionCount}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Created By</p>
                  <p>{form.createdBy}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Created At</p>
                  <p>{new Date(form.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Last Updated</p>
                  <p>{new Date(form.updatedAt).toLocaleString()}</p>
                </div>
                {form.status === "approved" && form.approvedBy && (
                  <div>
                    <p className="text-sm font-medium">Approved By</p>
                    <p>{form.approvedBy}</p>
                  </div>
                )}
                {form.status === "rejected" && form.rejectedBy && (
                  <div>
                    <p className="text-sm font-medium">Rejected By</p>
                    <p>{form.rejectedBy}</p>
                  </div>
                )}
                {form.status === "approved" && (
                  <div>
                    <p className="text-sm font-medium">Form URL</p>
                    <p className="text-sm break-all">/form/{form.slug}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {auditLogs.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Audit Log</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="text-sm border-b pb-2 last:border-0 last:pb-0">
                      <p className="font-medium">{log.action.replace("_", " ")}</p>
                      {log.previousValue && log.newValue && (
                        <p>
                          <span className="text-muted-foreground">From:</span> {log.previousValue}
                          <span className="text-muted-foreground"> To:</span> {log.newValue}
                        </p>
                      )}
                      <p className="text-muted-foreground">
                        {new Date(log.timestamp).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Form</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve this form? Once approved, it will be published and accessible to students.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApprovalDialog(false)}>Cancel</Button>
            <Button onClick={handleApprove} className="bg-success hover:bg-success/90">
              <Check className="mr-2 h-4 w-4" />
              Approve Form
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Form</DialogTitle>
            <DialogDescription>
              Are you sure you want to reject this form? It will need to be revised and resubmitted for approval.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>Cancel</Button>
            <Button onClick={handleReject} variant="destructive">
              <X className="mr-2 h-4 w-4" />
              Reject Form
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Email Dialog */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Email Form Link</DialogTitle>
            <DialogDescription>
              Send the form link to multiple email addresses. Enter email addresses separated by commas or new lines.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="emails">Email Addresses</Label>
              <Textarea
                id="emails"
                placeholder="email1@example.com, email2@example.com"
                value={emailList}
                onChange={(e) => setEmailList(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Email Subject</Label>
              <Input
                id="subject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Email Message</Label>
              <Textarea
                id="message"
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                className="min-h-[120px]"
                placeholder="Include [Form Link] where you want the form URL to appear."
              />
              <p className="text-xs text-muted-foreground">Use [Form Link] as a placeholder for the form URL.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEmailDialog(false)}>Cancel</Button>
            <Button onClick={handleSendEmails}>
              <Mail className="mr-2 h-4 w-4" />
              Send Emails
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FormView;
