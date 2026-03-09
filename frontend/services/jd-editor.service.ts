import { apiClient } from "./api-client";
import type { JDEditRequest, JDEditResponse } from "@/types/jd-editor";

export type { JDEditRequest };

export const jdEditorService = {
  /**
   * Edit a resume against a specific job description.
   * Returns field-level diffs, before/after ATS scores, and keyword analysis.
   */
  editResumeForJD: (params: JDEditRequest) =>
    apiClient.post<JDEditResponse>("/api/resume-edit-by-jd", {
      resumeId: params.resumeId,
      jobDescription: params.jobDescription,
      jdUrl: params.jdUrl,
      companyName: params.companyName,
    }),
};
