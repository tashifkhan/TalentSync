export interface DashboardStats {
  totalResumes: number;
  totalColdMails: number;
  totalInterviews: number;
}

export interface DashboardUser {
  name: string;
  email: string;
  image?: string;
}

export type ActivityType = "resume" | "cold_mail" | "interview";

export interface RecentActivity {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  date: string;
}

export interface DashboardResume {
  id: string;
  customName: string;
  uploadDate: string;
  predictedField?: string;
  candidateName?: string;
  source?: "UPLOADED" | "MANUAL";
  isMaster?: boolean;
}

export interface DashboardData {
  user: DashboardUser;
  stats: DashboardStats;
  recentActivity: RecentActivity[];
  resumes: DashboardResume[];
}
