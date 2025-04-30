
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormStatus, Submission, SubmissionStatus } from "@/utils/dummyData";

interface StatsProps {
  forms: Form[];
  submissions: Submission[];
}

const Stats = ({ forms, submissions }: StatsProps) => {
  // Calculate form statistics
  const totalForms = forms.length;
  const formsByStatus: Record<FormStatus, number> = {
    draft: forms.filter(form => form.status === "draft").length,
    pending: forms.filter(form => form.status === "pending").length,
    approved: forms.filter(form => form.status === "approved").length,
    rejected: forms.filter(form => form.status === "rejected").length,
  };
  
  // Calculate submission statistics
  const totalSubmissions = submissions.length;
  const submissionsByStatus: Record<SubmissionStatus, number> = {
    pending: submissions.filter(sub => sub.status === "pending").length,
    approved: submissions.filter(sub => sub.status === "approved").length,
    rejected: submissions.filter(sub => sub.status === "rejected").length,
  };
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Forms</CardTitle>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            className="h-4 w-4 text-muted-foreground"
          >
            <path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3" />
          </svg>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalForms}</div>
          <p className="text-xs text-muted-foreground">Forms created</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Forms</CardTitle>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            className="h-4 w-4 text-muted-foreground"
          >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formsByStatus.approved}</div>
          <p className="text-xs text-muted-foreground">
            <span className="text-success">
              {Math.round((formsByStatus.approved / totalForms) * 100) || 0}%
            </span>{" "}
            of forms approved
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            className="h-4 w-4 text-muted-foreground"
          >
            <rect width="20" height="14" x="2" y="5" rx="2" />
            <path d="M2 10h20" />
          </svg>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalSubmissions}</div>
          <p className="text-xs text-muted-foreground">
            Across {forms.filter(form => form.submissionCount > 0).length} forms
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Approval Rate</CardTitle>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            className="h-4 w-4 text-muted-foreground"
          >
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          </svg>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {totalSubmissions ? Math.round((submissionsByStatus.approved / totalSubmissions) * 100) : 0}%
          </div>
          <p className="text-xs text-muted-foreground">
            <span className={submissionsByStatus.pending > 0 ? "text-warning" : "text-muted-foreground"}>
              {submissionsByStatus.pending} pending
            </span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Stats;
