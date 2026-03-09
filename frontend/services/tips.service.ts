import { apiClient } from "./api-client";

export interface Tip {
  category: string;
  advice: string;
}

export interface TipsData {
  resume_tips: Tip[];
  interview_tips: Tip[];
}

export interface TipsResponse {
  success: boolean;
  message?: string;
  data: TipsData;
}

export const tipsService = {
  getTips: (job_category: string, skills: string) => {
    const params = new URLSearchParams();
    if (job_category) params.append("job_category", job_category);
    if (skills) params.append("skills", skills);
    
    // Using explicit string for URL to handle query params correctly
    return apiClient.get<TipsResponse>(`/api/tips/?${params.toString()}`);
  },
};
