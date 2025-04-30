
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useForm } from "../context/FormContext";
import { FormField } from "../utils/dummyData";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Check, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const SubmissionView = () => {
  const navigate = useNavigate();
  const { submissionId } = useParams<{ submissionId: string }>();
  const { isAuthenticated, currentUser } = useAuth();
  const { getSubmissionById, getFormById, getAuditLogsByEntityId, updateSubmissionStatus } = useForm();
  
  const [submission, setSubmission] = useState<ReturnType<typeof getSubmissionById>>();
  const [form, setForm] = useState<ReturnType<typeof getFormById>>();
  const [auditLogs, setAuditLogs] = useState<ReturnType<typeof getAuditLogsByEntityId>>([]);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
      return;
    }
    
    if (!submissionId) {
      navigate("/submissions");
      return;
    }
    
    const submissionData = getSubmissionById(submissionId);
    if (!submissionData) {
      toast.error("Submission not found");
      navigate("/submissions");
      return;
    }
    
    setSubmission(submissionData);
    const formData = getFormById(submissionData.formId);
    setForm(formData);
    setAuditLogs(getAuditLogsByEntityId(submissionId));
    setIsAdmin(currentUser?.role === "admin");
  }, [submissionId, isAuthenticated, navigate, getSubmissionById, getFormById, getAuditLogsByEntityId, currentUser]);

  const handleApprove = () => {
    if (!submissionId) return;
    
    updateSubmissionStatus(submissionId, "approved");
    toast.success("Submission approved");
    setShowApproveDialog(false);
    
    // Refresh submission data
    const updatedSubmission = getSubmissionById(submissionId);
    setSubmission(updatedSubmission);
    setAuditLogs(getAuditLogsByEntityId(submissionId));
  };

  const handleReject = () => {
    if (!submissionId) return;
    
    updateSubmissionStatus(submissionId, "rejected");
    toast.success("Submission rejected");
    setShowRejectDialog(false);
    
    // Refresh submission data
    const updatedSubmission = getSubmissionById(submissionId);
    setSubmission(updatedSubmission);
    setAuditLogs(getAuditLogsByEntityId(submissionId));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "submission-status-pending";
      case "approved": return "submission-status-approved";
      case "rejected": return "submission-status-rejected";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const formatValue = (field: FormField, value: any) => {
    if (value === undefined || value === null) return "—";
    
    if (field.type === "date" && value instanceof Date) {
      return value.toLocaleDateString();
    }
    
    if (field.type === "checkbox") {
      return value ? "Yes" : "No";
    }
    
    return value.toString();
  };

  if (!submission || !form) {
    return null;
  }
  
  const canApproveOrReject = isAdmin && submission.status === "pending";

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 space-y-4 md:space-y-0">
        <div className="flex items-center">
          <Button variant="ghost" onClick={() => navigate("/submissions")} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Submissions
          </Button>
          <h1 className="text-2xl font-bold">Submission Details</h1>
        </div>
        <div className="flex items-center space-x-4">
          <Badge className={getStatusColor(submission.status)}>{submission.status}</Badge>
          {canApproveOrReject && (
            <>
              <Button variant="outline" className="border-success text-success hover:bg-success/10" onClick={() => setShowApproveDialog(true)}>
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Field</TableHead>
                    <TableHead>Response</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {form.fields.map((field) => (
                    <TableRow key={field.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{field.label}</p>
                          {field.description && (
                            <p className="text-xs text-muted-foreground">{field.description}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatValue(field, submission.values[field.id])}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Submission Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium">Submitted By</p>
                  <p>{submission.userId}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Submitted At</p>
                  <p>{new Date(submission.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Last Updated</p>
                  <p>{new Date(submission.updatedAt).toLocaleString()}</p>
                </div>
                {submission.status === "approved" && submission.approvedBy && (
                  <div>
                    <p className="text-sm font-medium">Approved By</p>
                    <p>{submission.approvedBy}</p>
                  </div>
                )}
                {submission.status === "rejected" && submission.rejectedBy && (
                  <div>
                    <p className="text-sm font-medium">Rejected By</p>
                    <p>{submission.rejectedBy}</p>
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

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Submission</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve this submission?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>Cancel</Button>
            <Button onClick={handleApprove} className="bg-success hover:bg-success/90">
              <Check className="mr-2 h-4 w-4" />
              Approve Submission
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Submission</DialogTitle>
            <DialogDescription>
              Are you sure you want to reject this submission?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>Cancel</Button>
            <Button onClick={handleReject} variant="destructive">
              <X className="mr-2 h-4 w-4" />
              Reject Submission
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubmissionView;
