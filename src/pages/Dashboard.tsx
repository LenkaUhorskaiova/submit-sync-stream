import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useForm } from "../context/FormContext";
import Stats from "../components/Dashboard/Stats";
import Charts from "../components/Dashboard/Charts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Dashboard = () => {
  const { currentUser, isAuthenticated, logout } = useAuth();
  const { forms, submissions } = useForm();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated || !currentUser) {
    return null; // Will redirect via useEffect
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft": return "form-status-draft";
      case "pending": return "form-status-pending";
      case "approved": return "form-status-approved";
      case "rejected": return "form-status-rejected";
      default: return "bg-muted text-muted-foreground";
    }
  };

  // Make sure forms are sorted by most recently updated
  const sortedForms = [...forms].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  const recentForms = sortedForms.slice(0, 5);
  
  const pendingSubmissions = submissions
    .filter(sub => sub.status === "pending")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {currentUser.name}</p>
        </div>
        <div className="flex space-x-4">
          <Button onClick={() => navigate("/form-builder")}>Create New Form</Button>
          <Button variant="outline" onClick={logout}>Logout</Button>
        </div>
      </header>

      <div className="space-y-8">
        <Stats forms={forms} submissions={submissions} />

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="forms">Forms</TabsTrigger>
            <TabsTrigger value="submissions">Pending Submissions</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <Charts forms={forms} submissions={submissions} />
          </TabsContent>
          
          <TabsContent value="forms">
            <Card>
              <CardHeader>
                <CardTitle>Recent Forms</CardTitle>
              </CardHeader>
              <CardContent>
                {recentForms.length > 0 ? (
                  <div className="space-y-4">
                    {recentForms.map(form => (
                      <div key={form.id} className="flex justify-between items-center p-4 border rounded-md bg-card">
                        <div className="flex-1">
                          <h3 className="font-medium">{form.title}</h3>
                          <p className="text-sm text-muted-foreground">{form.description || "No description"}</p>
                        </div>
                        <div className="flex items-center space-x-4">
                          <Badge className={getStatusColor(form.status)}>{form.status}</Badge>
                          <p className="text-sm text-muted-foreground">{form.submissionCount} submissions</p>
                          <Button variant="outline" size="sm" onClick={() => navigate(`/forms/${form.id}`)}>
                            View
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No forms created yet</p>
                )}
                
                {forms.length > 5 && (
                  <div className="flex justify-center mt-4">
                    <Button variant="outline" onClick={() => navigate("/forms")}>View All Forms</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="submissions">
            <Card>
              <CardHeader>
                <CardTitle>Pending Submissions</CardTitle>
              </CardHeader>
              <CardContent>
                {pendingSubmissions.length > 0 ? (
                  <div className="space-y-4">
                    {pendingSubmissions.map(submission => {
                      const form = forms.find(f => f.id === submission.formId);
                      return (
                        <div key={submission.id} className="flex justify-between items-center p-4 border rounded-md bg-card">
                          <div className="flex-1">
                            <h3 className="font-medium">{form?.title || "Unknown Form"}</h3>
                            <p className="text-sm text-muted-foreground">Submitted {new Date(submission.createdAt).toLocaleDateString()}</p>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => navigate(`/submissions/${submission.id}`)}>
                            Review
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No pending submissions</p>
                )}
                
                <div className="flex justify-center mt-4">
                  <Button variant="outline" onClick={() => navigate("/submissions")}>View All Submissions</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
