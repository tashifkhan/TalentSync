import { apiClient } from "./api-client";
import {
  CoverLetterSession,
  CoverLetterResponseData,
  UserResume,
} from "@/types";

export const coverLetterService = {
  getCoverLetters: () =>
    apiClient.get<{ success: boolean; data: CoverLetterSession[] }>(
      "/api/cover-letters",
    ),

  deleteCoverLetter: (id: string) =>
    apiClient.delete<{ success: boolean; message: string }>(
      `/api/cover-letters`,
      {
        params: { id },
      },
    ),

  generateCoverLetter: (formData: FormData) =>
    apiClient.post<
      { success: boolean; message: string } & CoverLetterResponseData
    >("/api/cover-letter", formData),

  editCoverLetter: (formData: FormData) =>
    apiClient.post<{
      success: boolean;
      message: string;
      data: CoverLetterResponseData;
    }>("/api/cover-letter/edit", formData),
};
