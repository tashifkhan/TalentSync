import { apiClient } from "./api-client";
import { ResumeData, PdfGenerationRequest } from "@/types/resume";

export const resumeGenService = {
  tailorResume: (formData: FormData) => 
    apiClient.post<{ success: boolean; resume_data?: ResumeData; data?: ResumeData }>("/api/tailored-resume", formData),

  generateLatex: (data: PdfGenerationRequest) => 
    apiClient.post<{ latex: string; error?: string }>("/api/generate-latex", data),

  downloadPdf: (data: PdfGenerationRequest) => 
    // We need to return the raw response for Blob handling, so we can't use the standard apiClient wrapper easily
    // Or we can add a method to apiClient for blob responses.
    fetch("/api/download-resume", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
};
