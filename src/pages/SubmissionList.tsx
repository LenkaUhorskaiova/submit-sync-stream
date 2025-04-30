
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useForm } from "../context/FormContext";
import { Form, Submission } from "../utils/dummyData";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ArrowLeft } from "lucide-react";

const SubmissionList = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { forms, submissions } = useForm();
  
  const [filteredSubmissions, setFilteredSubmissions] = useState<Submission[]>([]);
  const [selectedForm, setSelectedForm] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
      return;
    }
    
    // Apply filters
    let filtered = [...submissions];
    
    // Filter by form
    if (selectedForm !== "all") {
      filtered = filtered.filter(sub => sub.formId === selectedForm);
    }
    
    // Filter by status
    if (selectedStatus !== "all") {
      filtered = filtered.filter(sub => sub.status === selectedStatus);
    }
    
    // Filter by search query (user ID for now, could extend to form names)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(sub => 
        sub.userId.toLowerCase().includes(query) ||
        getFormTitle(sub.formId).toLowerCase().includes(query)
      );
    }
    
    // Sort by most recent
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    setFilteredSubmissions(filtered);
  }, [isAuthenticated, navigate, submissions, selectedForm, selectedStatus, searchQuery]);

  const getFormTitle = (formId: string): string => {
    const form = forms.find(f => f.id === formId);
    return form?.title || "Unknown Form";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "submission-status-pending";
      case "approved": return "submission-status-approved";
      case "rejected": return "submission-status-rejected";
      default: return "bg-muted text-muted-foreground";
    }
  };

  if (!isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <h1 className="text-2xl font-bold">Submissions</h1>
      </div>

      <Card className="p-6 mb-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="text-sm font-medium mb-1 block">Filter by Form</label>
            <Select value={selectedForm} onValueChange={setSelectedForm}>
              <SelectTrigger>
                <SelectValue placeholder="Select form" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Forms</SelectItem>
                {forms.map(form => (
                  <SelectItem key={form.id} value={form.id}>{form.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-1 block">Filter by Status</label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-1 block">Search</label>
            <Input
              placeholder="Search by user or form"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {filteredSubmissions.length > 0 ? (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Form</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubmissions.map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell>{getFormTitle(submission.formId)}</TableCell>
                  <TableCell>{submission.userId}</TableCell>
                  <TableCell>{new Date(submission.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(submission.status)}>
                      {submission.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate(`/submissions/${submission.id}`)}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No submissions found matching the current filters.</p>
        </Card>
      )}
    </div>
  );
};

export default SubmissionList;
