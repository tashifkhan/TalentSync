export interface Skill {
  skill_name: string;
  percentage: number;
}

export interface Language {
  language: string;
}

export interface Education {
  education_detail: string;
}

export interface WorkExperience {
  role: string;
  company_and_duration: string;
  bullet_points: string[];
}

export interface Project {
  title: string;
  technologies_used: string[];
  description: string;
  live_link?: string;
  repo_link?: string;
}

export interface Publication {
  title: string;
  authors?: string;
  journal_conference?: string;
  year?: string;
  doi?: string;
  url?: string;
}

export interface PositionOfResponsibility {
  title: string;
  organization: string;
  duration?: string;
  description?: string;
}

export interface Certification {
  name: string;
  issuing_organization: string;
  issue_date?: string;
  expiry_date?: string;
  credential_id?: string;
  url?: string;
}

export interface Achievement {
  title: string;
  description?: string;
  year?: string;
  category?: string;
}

export interface ResumeData {
  skills_analysis: Skill[];
  recommended_roles: string[];
  languages: Language[];
  education: Education[];
  work_experience: WorkExperience[];
  projects: Project[];
  publications: Publication[];
  positions_of_responsibility: PositionOfResponsibility[];
  certifications: Certification[];
  achievements: Achievement[];
  name: string;
  email: string;
  contact: string;
  linkedin?: string;
  github?: string;
  blog?: string | null;
  portfolio?: string;
  predicted_field: string;
}

export interface UserResume {
  id: string;
  customName: string;
  uploadDate: string;
  candidateName?: string;
  predictedField?: string;
  source?: "UPLOADED" | "MANUAL";
  isMaster?: boolean;
  parentId?: string | null;
}

export interface SectionMeta {
  key: string;
  displayName: string;
  isVisible: boolean;
  order: number;
}

export const DEFAULT_SECTION_ORDER: SectionMeta[] = [
  { key: "personalInfo", displayName: "Personal Information", isVisible: true, order: 0 },
  { key: "work_experience", displayName: "Work Experience", isVisible: true, order: 1 },
  { key: "education", displayName: "Education", isVisible: true, order: 2 },
  { key: "skills_analysis", displayName: "Skills", isVisible: true, order: 3 },
  { key: "projects", displayName: "Projects", isVisible: true, order: 4 },
  { key: "publications", displayName: "Publications", isVisible: true, order: 5 },
  { key: "certifications", displayName: "Certifications", isVisible: true, order: 6 },
  { key: "achievements", displayName: "Achievements", isVisible: true, order: 7 },
  { key: "positions_of_responsibility", displayName: "Positions of Responsibility", isVisible: true, order: 8 },
  { key: "languages", displayName: "Languages", isVisible: true, order: 9 },
  { key: "recommended_roles", displayName: "Recommended Roles", isVisible: true, order: 10 },
];

export interface ResumeTemplate {
  id: string;
  name: string;
  description: string;
  preview?: string;
}

export interface PdfGenerationRequest {
  resumeData: ResumeData;
  template?: string;
  options?: {
    fontSize?: number;
    margins?: {
      top: number;
      bottom: number;
      left: number;
      right: number;
    };
    colorScheme?: "default" | "blue" | "green" | "red";
  };
}
