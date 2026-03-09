import { apiClient } from "./api-client";

export interface RecruiterResume {
  id: string;
  customName: string;
  uploadDate: string;
  showInCentral: boolean;
  rawText: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  analysis: any; // Using any for now as Analysis structure is complex and defined elsewhere
}

export interface RecruiterResponse {
  success: boolean;
  message: string;
  data: {
    resumes: RecruiterResume[];
    total: number;
  };
}

export const recruiterService = {
  getAllResumes: (search?: string) => {
    const params: Record<string, string> = { centralOnly: "true" };
    if (search) {
      params.search = search;
    }
    return apiClient.get<RecruiterResponse>("/api/recruter/show-all", { params });
  },
};
