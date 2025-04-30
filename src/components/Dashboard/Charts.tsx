
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, Submission } from "@/utils/dummyData";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";

interface ChartsProps {
  forms: Form[];
  submissions: Submission[];
}

const Charts = ({ forms, submissions }: ChartsProps) => {
  // Prepare data for form status chart
  const formStatusData = [
    { name: "Draft", value: forms.filter(form => form.status === "draft").length, color: "#94a3b8" },
    { name: "Pending", value: forms.filter(form => form.status === "pending").length, color: "#f59e0b" },
    { name: "Approved", value: forms.filter(form => form.status === "approved").length, color: "#10b981" },
    { name: "Rejected", value: forms.filter(form => form.status === "rejected").length, color: "#ef4444" },
  ].filter(item => item.value > 0);

  // Prepare data for submission status chart
  const submissionStatusData = [
    { name: "Pending", value: submissions.filter(sub => sub.status === "pending").length, color: "#f59e0b" },
    { name: "Approved", value: submissions.filter(sub => sub.status === "approved").length, color: "#10b981" },
    { name: "Rejected", value: submissions.filter(sub => sub.status === "rejected").length, color: "#ef4444" },
  ].filter(item => item.value > 0);

  // Prepare data for top forms by submission chart
  const topFormsBySubmission = forms
    .filter(form => form.submissionCount > 0)
    .sort((a, b) => b.submissionCount - a.submissionCount)
    .slice(0, 5)
    .map(form => ({
      name: form.title.length > 20 ? form.title.substring(0, 20) + "..." : form.title,
      submissions: form.submissionCount,
    }));

  // Prepare data for submissions over time
  // Group by month for demo purposes
  const submissionsByMonth: Record<string, number> = {};
  
  submissions.forEach(submission => {
    const date = new Date(submission.createdAt);
    const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
    
    if (!submissionsByMonth[monthYear]) {
      submissionsByMonth[monthYear] = 0;
    }
    
    submissionsByMonth[monthYear]++;
  });
  
  const submissionsOverTime = Object.entries(submissionsByMonth)
    .map(([month, count]) => ({ month, submissions: count }))
    .sort((a, b) => {
      const [aMonth, aYear] = a.month.split('/').map(Number);
      const [bMonth, bYear] = b.month.split('/').map(Number);
      
      if (aYear !== bYear) return aYear - bYear;
      return aMonth - bMonth;
    });

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Form Status</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={formStatusData}
                cx="50%"
                cy="50%"
                labelLine={true}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {formStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value} forms`, 'Count']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Submission Status</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={submissionStatusData}
                cx="50%"
                cy="50%"
                labelLine={true}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {submissionStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value} submissions`, 'Count']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top Forms by Submission Volume</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topFormsBySubmission}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="submissions" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Submissions Over Time</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={submissionsOverTime}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="submissions" stroke="#3b82f6" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default Charts;
