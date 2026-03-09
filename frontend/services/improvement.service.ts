import { apiClient } from "./api-client";
import type {
  ResumeImproveResponse,
  ResumeRefineResponse,
  RefinementConfig,
} from "@/types/improvement";

export interface ImproveResumeParams {
  resumeId: string;
  jobDescription: string;
  jobKeywords?: Record<string, unknown>;
  refinementConfig?: RefinementConfig;
}

export interface RefineResumeParams {
  resumeId: string;
  tailoredResume: Record<string, unknown>;
  jobDescription: string;
  jobKeywords?: Record<string, unknown>;
  refinementConfig?: RefinementConfig;
}

export const improvementService = {
  /**
   * Improve a resume for a specific job description.
   * Uses AI to optimize the resume content while maintaining truthfulness.
   */
  improveResume: (params: ImproveResumeParams) =>
    apiClient.post<ResumeImproveResponse>("/api/resume-improve", {
      resumeId: params.resumeId,
      jobDescription: params.jobDescription,
      jobKeywords: params.jobKeywords,
      refinementConfig: params.refinementConfig,
    }),

  /**
   * Refine an already tailored resume with additional optimization passes.
   * Used for post-tailoring refinement to improve keyword matching.
   */
  refineResume: (params: RefineResumeParams) =>
    apiClient.post<ResumeRefineResponse>("/api/resume-refine", {
      resumeId: params.resumeId,
      tailoredResume: params.tailoredResume,
      jobDescription: params.jobDescription,
      jobKeywords: params.jobKeywords,
      refinementConfig: params.refinementConfig,
    }),
};
