import { apiClient } from "./api-client";
import { UserResume } from "@/types";

export interface ATSEvaluationResponse {
  success: boolean;
  message: string;
  score: number;
  reasons_for_the_score: string[];
  suggestions: string[];
}

export const atsService = {
  getUserResumes: () => apiClient.get<{ success: boolean; data: { resumes: UserResume[] } }>("/api/ats"),

  evaluateResume: (formData: FormData) => 
    apiClient.post<ATSEvaluationResponse>("/api/ats", formData),
};
