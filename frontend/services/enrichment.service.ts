import { apiClient, ApiError } from "./api-client";
import type {
  AnalysisResponse,
  EnhancementPreview,
  EnhancedDescription,
  AnswerInput,
  RegenerateItemInput,
  RegenerateResponse,
  RegeneratedItem,
} from "@/types/enrichment";

// Response wrappers for API responses
interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

interface ApiErrorResponse {
  success: false;
  message: string;
}

type EnrichmentApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface AnalyzeResumeParams {
  resumeId: string;
}

export interface EnhanceResumeParams {
  resumeId: string;
  answers: AnswerInput[];
}

export interface ApplyEnhancementsParams {
  resumeId: string;
  enhancements: EnhancedDescription[];
}

export interface RegenerateItemsParams {
  resumeId: string;
  items: RegenerateItemInput[];
  instruction: string;
  outputLanguage?: string;
}

export interface ApplyRegeneratedParams {
  resumeId: string;
  items: RegeneratedItem[];
}

export const enrichmentService = {
  /**
   * Analyze a resume to identify items that could be enriched.
   * Returns weak items and clarifying questions.
   */
  analyzeResume: async (params: AnalyzeResumeParams): Promise<AnalysisResponse> => {
    const response = await apiClient.post<EnrichmentApiResponse<AnalysisResponse>>(
      "/api/resume-enrichment/analyze",
      { resumeId: params.resumeId }
    );

    if (!response.success) {
      throw new ApiError((response as ApiErrorResponse).message, 400);
    }

    return (response as ApiSuccessResponse<AnalysisResponse>).data;
  },

  /**
   * Generate enhanced descriptions based on user answers.
   * Returns preview of enhancements before applying.
   */
  enhanceResume: async (params: EnhanceResumeParams): Promise<EnhancementPreview> => {
    const response = await apiClient.post<EnrichmentApiResponse<EnhancementPreview>>(
      "/api/resume-enrichment/enhance",
      {
        resumeId: params.resumeId,
        answers: params.answers,
      }
    );

    if (!response.success) {
      throw new ApiError((response as ApiErrorResponse).message, 400);
    }

    return (response as ApiSuccessResponse<EnhancementPreview>).data;
  },

  /**
   * Apply enhancements to the master resume.
   * Updates the resume in the database.
   */
  applyEnhancements: async (
    params: ApplyEnhancementsParams
  ): Promise<{ appliedCount: number }> => {
    const response = await apiClient.post<{
      success: boolean;
      message: string;
      appliedCount: number;
    }>("/api/resume-enrichment/apply", {
      resumeId: params.resumeId,
      enhancements: params.enhancements,
    });

    if (!response.success) {
      throw new ApiError(response.message, 400);
    }

    return { appliedCount: response.appliedCount };
  },

  /**
   * Regenerate specific resume items with custom instructions.
   * Allows targeted rewriting of experiences, projects, or skills.
   */
  regenerateItems: async (params: RegenerateItemsParams): Promise<RegenerateResponse> => {
    const response = await apiClient.post<EnrichmentApiResponse<RegenerateResponse>>(
      "/api/resume-enrichment/regenerate",
      {
        resumeId: params.resumeId,
        items: params.items,
        instruction: params.instruction,
        outputLanguage: params.outputLanguage,
      }
    );

    if (!response.success) {
      throw new ApiError((response as ApiErrorResponse).message, 400);
    }

    return (response as ApiSuccessResponse<RegenerateResponse>).data;
  },

  /**
   * Apply regenerated items to the master resume.
   * Updates the resume in the database.
   */
  applyRegeneratedItems: async (
    params: ApplyRegeneratedParams
  ): Promise<{ appliedCount: number }> => {
    const response = await apiClient.post<{
      success: boolean;
      message: string;
      appliedCount: number;
    }>("/api/resume-enrichment/apply-regenerated", {
      resumeId: params.resumeId,
      items: params.items,
    });

    if (!response.success) {
      throw new ApiError(response.message, 400);
    }

    return { appliedCount: response.appliedCount };
  },
};
