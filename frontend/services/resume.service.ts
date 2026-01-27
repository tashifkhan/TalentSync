import { apiClient } from "./api-client";
import { ResumeData, ApiResponse } from "@/types";

export interface ResumeResponseData {
  resume: {
    id: string;
    customName: string;
    rawText: string;
    uploadDate: string;
    showInCentral: boolean;
    user: {
      id: string;
      name: string | null;
      email: string | null;
    };
  };
  analysis: any;
}

export const resumeService = {
  getResume: (id: string) =>
    apiClient.get<ApiResponse<ResumeResponseData>>(`/api/resumes/${id}`),

  deleteResume: (id: string) =>
    apiClient.delete<{ success: boolean; message: string }>(`/api/resumes`, {
      params: { id },
    }),

  renameResume: (id: string, customName: string) =>
    apiClient.patch<{ success: boolean; message: string }>(
      `/api/resumes`,
      {
        customName,
      },
      {
        params: { id },
      },
    ),

  uploadResume: (file: File, customName: string) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("customName", customName.trim());

    return apiClient.post<ApiResponse<{ resumeId: string; analysis: ResumeData; cleanedText: string }>>("/api/analysis", formData);
  },
};
