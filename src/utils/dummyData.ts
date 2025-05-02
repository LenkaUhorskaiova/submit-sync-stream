
export type User = {
  id: string;
  username: string;
  name: string;
  role: "admin" | "staff" | "student";
  avatar?: string;
};

export type FormField = {
  id: string;
  type: "text" | "textarea" | "select" | "checkbox" | "radio" | "date" | "email" | "number";
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  description?: string;
  defaultValue?: string | string[] | boolean;
};

export type FormStatus = "draft" | "pending" | "approved" | "rejected";

export type Form = {
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
  status: FormStatus;
  slug: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  submissionCount: number;
};

export type SubmissionStatus = "pending" | "approved" | "rejected";

export type FieldValue = string | string[] | boolean | Date | null;

export type Submission = {
  id: string;
  formId: string;
  userId: string;
  status: SubmissionStatus;
  values: Record<string, FieldValue>;
  metadata: Record<string, any>; // Added metadata field
  createdAt: string;
  updatedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
};

export type AuditLog = {
  id: string;
  entityId: string;
  entityType: "form" | "submission";
  userId: string;
  action: string;
  previousValue?: string;
  newValue: string;
  timestamp: string;
};

// Dummy Users
export const users: User[] = [
  {
    id: "user1",
    username: "admin",
    name: "Admin User",
    role: "admin",
    avatar: "https://i.pravatar.cc/150?u=admin",
  },
  {
    id: "user2",
    username: "staff",
    name: "Staff Member",
    role: "staff",
    avatar: "https://i.pravatar.cc/150?u=staff",
  },
  {
    id: "user3",
    username: "student",
    name: "John Student",
    role: "student",
    avatar: "https://i.pravatar.cc/150?u=student",
  },
];

// Dummy Forms
export const forms: Form[] = [
  {
    id: "form1",
    title: "Course Registration Form",
    description: "Register for courses for the upcoming semester",
    fields: [
      {
        id: "field1",
        type: "text",
        label: "Full Name",
        placeholder: "Enter your full name",
        required: true,
      },
      {
        id: "field2",
        type: "email",
        label: "Email Address",
        placeholder: "Enter your email address",
        required: true,
      },
      {
        id: "field3",
        type: "select",
        label: "Preferred Course",
        required: true,
        options: ["Mathematics", "Computer Science", "Physics", "Literature"],
      },
      {
        id: "field4",
        type: "checkbox",
        label: "I agree to the terms and conditions",
        required: true,
      },
    ],
    status: "approved",
    slug: "course-registration",
    createdBy: "user1",
    createdAt: "2023-01-15T12:00:00Z",
    updatedAt: "2023-01-15T15:30:00Z",
    approvedBy: "user1",
    approvedAt: "2023-01-16T09:00:00Z",
    submissionCount: 56,
  },
  {
    id: "form2",
    title: "Financial Aid Application",
    description: "Apply for financial assistance for the upcoming academic year",
    fields: [
      {
        id: "field1",
        type: "text",
        label: "Full Name",
        placeholder: "Enter your full name",
        required: true,
      },
      {
        id: "field2",
        type: "email",
        label: "Email Address",
        placeholder: "Enter your email address",
        required: true,
      },
      {
        id: "field3",
        type: "number",
        label: "Annual Family Income",
        placeholder: "Enter annual household income",
        required: true,
      },
      {
        id: "field4",
        type: "textarea",
        label: "Financial Need Statement",
        placeholder: "Describe your financial situation and needs",
        required: true,
      },
    ],
    status: "pending",
    slug: "financial-aid",
    createdBy: "user2",
    createdAt: "2023-02-20T10:00:00Z",
    updatedAt: "2023-02-20T14:15:00Z",
    submissionCount: 12,
  },
  {
    id: "form3",
    title: "Student Feedback",
    description: "Share your feedback about your courses and instructors",
    fields: [
      {
        id: "field1",
        type: "select",
        label: "Course",
        required: true,
        options: ["Mathematics 101", "Computer Science 202", "Physics 150", "Literature 120"],
      },
      {
        id: "field2",
        type: "select",
        label: "Instructor",
        required: true,
        options: ["Dr. Smith", "Prof. Johnson", "Dr. Williams", "Prof. Davis"],
      },
      {
        id: "field3",
        type: "radio",
        label: "Overall Rating",
        required: true,
        options: ["Excellent", "Good", "Average", "Poor"],
      },
      {
        id: "field4",
        type: "textarea",
        label: "Comments",
        placeholder: "Share your thoughts here",
        required: false,
      },
    ],
    status: "draft",
    slug: "student-feedback",
    createdBy: "user2",
    createdAt: "2023-03-10T09:30:00Z",
    updatedAt: "2023-03-10T11:45:00Z",
    submissionCount: 0,
  },
];

// Dummy Submissions
export const submissions: Submission[] = [
  {
    id: "sub1",
    formId: "form1",
    userId: "user3",
    status: "approved",
    values: {
      field1: "John Student",
      field2: "john@example.com",
      field3: "Computer Science",
      field4: true,
    },
    metadata: {}, // Added empty metadata
    createdAt: "2023-01-20T14:30:00Z",
    updatedAt: "2023-01-21T10:15:00Z",
    approvedBy: "user1",
    approvedAt: "2023-01-21T10:15:00Z",
  },
  {
    id: "sub2",
    formId: "form1",
    userId: "user3",
    status: "pending",
    values: {
      field1: "Jane Student",
      field2: "jane@example.com",
      field3: "Literature",
      field4: true,
    },
    metadata: {}, // Added empty metadata
    createdAt: "2023-01-22T09:45:00Z",
    updatedAt: "2023-01-22T09:45:00Z",
  },
  {
    id: "sub3",
    formId: "form2",
    userId: "user3",
    status: "rejected",
    values: {
      field1: "Alice Student",
      field2: "alice@example.com",
      field3: "45000",
      field4: "I need financial assistance due to my family's current economic situation.",
    },
    metadata: {}, // Added empty metadata
    createdAt: "2023-02-25T16:20:00Z",
    updatedAt: "2023-02-26T11:10:00Z",
    rejectedBy: "user1",
    rejectedAt: "2023-02-26T11:10:00Z",
  },
];

// Dummy Audit Logs
export const auditLogs: AuditLog[] = [
  {
    id: "log1",
    entityId: "form1",
    entityType: "form",
    userId: "user1",
    action: "status_update",
    previousValue: "pending",
    newValue: "approved",
    timestamp: "2023-01-16T09:00:00Z",
  },
  {
    id: "log2",
    entityId: "sub1",
    entityType: "submission",
    userId: "user1",
    action: "status_update",
    previousValue: "pending",
    newValue: "approved",
    timestamp: "2023-01-21T10:15:00Z",
  },
  {
    id: "log3",
    entityId: "sub3",
    entityType: "submission",
    userId: "user1",
    action: "status_update",
    previousValue: "pending",
    newValue: "rejected",
    timestamp: "2023-02-26T11:10:00Z",
  },
];

// Helper functions
export const getFormById = (id: string): Form | undefined => {
  return forms.find((form) => form.id === id);
};

export const getFormBySlug = (slug: string): Form | undefined => {
  return forms.find((form) => form.slug === slug);
};

export const getSubmissionsByFormId = (formId: string): Submission[] => {
  return submissions.filter((sub) => sub.formId === formId);
};

export const getSubmissionById = (id: string): Submission | undefined => {
  return submissions.find((sub) => sub.id === id);
};

export const getUserById = (id: string): User | undefined => {
  return users.find((user) => user.id === id);
};

export const getAuditLogsByEntityId = (entityId: string): AuditLog[] => {
  return auditLogs.filter((log) => log.entityId === entityId);
};
