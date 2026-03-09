import { apiClient } from "./api-client";
import {
  ColdMailSession,
  ColdMailResponseData,
  UserResume,
  ApiResponse,
} from "@/types";

export const coldMailService = {
  getColdMails: () =>
    apiClient.get<{ success: boolean; data: ColdMailSession[] }>(
      "/api/cold-mails",
    ),

  deleteColdMail: (id: string) =>
    apiClient.delete<{ success: boolean; message: string }>(`/api/cold-mails`, {
      params: { id },
    }),

  getUserResumes: () =>
    apiClient.get<{ success: boolean; data: { resumes: UserResume[] } }>(
      "/api/cold-mail",
    ),

  generateColdMail: (formData: FormData) =>
    apiClient.post<
      { success: boolean; message: string } & ColdMailResponseData
    >("/api/cold-mail", formData),

  editColdMail: (formData: FormData) =>
    apiClient.post<{
      success: boolean;
      message: string;
      data: ColdMailResponseData;
    }>("/api/cold-mail/edit", formData),
};
