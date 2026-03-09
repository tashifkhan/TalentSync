import { apiClient } from "./api-client";
import { InterviewSession, ApiResponse } from "@/types";

export const interviewService = {
  getInterviews: () =>
    apiClient.get<{ success: boolean; data: InterviewSession[] }>(
      "/api/interviews",
    ),

  deleteInterview: (id: string) =>
    apiClient.delete<{ success: boolean; message: string }>(`/api/interviews`, {
      params: { id },
    }),

  generateAnswer: (formData: FormData) =>
    apiClient.post<any>("/api/gen-answer", formData),
};
