
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "../../context/FormContext";
import { useAuth } from "../../context/AuthContext";
import { FormStatus } from "../../utils/dummyData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Pagination, 
  PaginationContent, 
  PaginationEllipsis, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";

const FormsTab = () => {
  const navigate = useNavigate();
  const { searchForms, forms } = useForm();
  const { currentUser } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<FormStatus | "all">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 10;
  
  // Get recent forms (10 most recent)
  const recentForms = forms
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);
  
  // Search results with pagination
  const searchResults = searchForms(
    searchQuery,
    statusFilter === "all" ? undefined : statusFilter,
    undefined, // createdBy filter not used here
    currentPage,
    perPage
  );
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft": return "form-status-draft";
      case "pending": return "form-status-pending";
      case "approved": return "form-status-approved";
      case "rejected": return "form-status-rejected";
      default: return "bg-muted text-muted-foreground";
    }
  };
  
  // Generate pagination numbers
  const generatePagination = () => {
    const pages = [];
    const { totalPages } = searchResults;
    
    // Always show first page
    pages.push(1);
    
    // Calculate range of pages to show
    let startPage = Math.max(2, currentPage - 1);
    let endPage = Math.min(totalPages - 1, currentPage + 1);
    
    // Add ellipsis after first page if needed
    if (startPage > 2) {
      pages.push("ellipsis1");
    }
    
    // Add pages in range
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    // Add ellipsis before last page if needed
    if (endPage < totalPages - 1 && totalPages > 1) {
      pages.push("ellipsis2");
    }
    
    // Add last page if there are multiple pages
    if (totalPages > 1) {
      pages.push(totalPages);
    }
    
    return pages;
  };

  return (
    <div className="space-y-8">
      {/* Recent Forms Section */}
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
            <div className="text-center py-8">
              <p className="text-muted-foreground">No forms created yet</p>
              <Button 
                onClick={() => navigate("/form-builder")}
                className="mt-4"
              >
                Create Your First Form
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Find a Form Section */}
      <Card>
        <CardHeader>
          <CardTitle>Find a Form</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Search filters */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="search">Search by name</Label>
                <Input
                  id="search"
                  placeholder="Search forms..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1); // Reset to first page on new search
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={statusFilter} 
                  onValueChange={(value) => {
                    setStatusFilter(value as FormStatus | "all");
                    setCurrentPage(1); // Reset to first page on new filter
                  }}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Search results */}
            {searchResults.forms.length > 0 ? (
              <div className="space-y-4">
                {searchResults.forms.map(form => (
                  <div key={form.id} className="flex justify-between items-center p-4 border rounded-md bg-card">
                    <div className="flex-1">
                      <h3 className="font-medium">{form.title}</h3>
                      <div className="flex flex-wrap gap-2 mt-1">
                        <p className="text-xs text-muted-foreground">Created: {new Date(form.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Badge className={getStatusColor(form.status)}>{form.status}</Badge>
                      <Button variant="outline" size="sm" onClick={() => navigate(`/forms/${form.id}`)}>
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No forms found. Try adjusting your search criteria.</p>
              </div>
            )}
            
            {/* Pagination */}
            {searchResults.totalPages > 1 && (
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      aria-disabled={currentPage === 1}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                  
                  {generatePagination().map((page, index) => {
                    if (page === "ellipsis1" || page === "ellipsis2") {
                      return (
                        <PaginationItem key={`ellipsis-${index}`}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    }
                    
                    return (
                      <PaginationItem key={`page-${page}`}>
                        <PaginationLink 
                          isActive={currentPage === page}
                          onClick={() => setCurrentPage(page as number)}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, searchResults.totalPages))}
                      aria-disabled={currentPage === searchResults.totalPages}
                      className={currentPage === searchResults.totalPages ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FormsTab;
