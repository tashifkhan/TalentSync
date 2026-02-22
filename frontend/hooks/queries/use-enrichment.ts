import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  enrichmentService,
  type AnalyzeResumeParams,
  type EnhanceResumeParams,
  type ApplyEnhancementsParams,
  type RefineEnhancementsParams,
  type RegenerateItemsParams,
  type ApplyRegeneratedParams,
} from "@/services";
import { useToast } from "@/hooks/use-toast";

/**
 * Hook for analyzing a resume to find enrichment opportunities.
 */
export const useAnalyzeResume = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (params: AnalyzeResumeParams) => enrichmentService.analyzeResume(params),
    onError: (error: Error) => {
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze resume. Please try again.",
        variant: "destructive",
      });
    },
  });
};

/**
 * Hook for generating enhanced descriptions based on user answers.
 */
export const useEnhanceResume = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (params: EnhanceResumeParams) => enrichmentService.enhanceResume(params),
    onError: (error: Error) => {
      toast({
        title: "Enhancement Failed",
        description: error.message || "Failed to generate enhancements. Please try again.",
        variant: "destructive",
      });
    },
  });
};

/**
 * Hook for applying enhancements to the master resume.
 */
export const useApplyEnhancements = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (params: ApplyEnhancementsParams) => enrichmentService.applyEnhancements(params),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["resume", variables.resumeId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast({
        title: "Enhancements Applied",
        description: `Successfully applied ${data.appliedCount} enhancement(s) to your resume.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Apply Failed",
        description: error.message || "Failed to apply enhancements. Please try again.",
        variant: "destructive",
      });
    },
  });
};

/**
 * Hook for refining rejected enhancements with user feedback.
 */
export const useRefineEnhancements = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (params: RefineEnhancementsParams) =>
      enrichmentService.refineEnhancements(params),
    onError: (error: Error) => {
      toast({
        title: "Refinement Failed",
        description:
          error.message || "Failed to refine enhancements. Please try again.",
        variant: "destructive",
      });
    },
  });
};

/**
 * Hook for regenerating specific resume items with custom instructions.
 */
export const useRegenerateItems = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (params: RegenerateItemsParams) => enrichmentService.regenerateItems(params),
    onError: (error: Error) => {
      toast({
        title: "Regeneration Failed",
        description: error.message || "Failed to regenerate items. Please try again.",
        variant: "destructive",
      });
    },
  });
};

/**
 * Hook for applying regenerated items to the master resume.
 */
export const useApplyRegeneratedItems = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (params: ApplyRegeneratedParams) => enrichmentService.applyRegeneratedItems(params),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["resume", variables.resumeId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast({
        title: "Changes Applied",
        description: `Successfully applied ${data.appliedCount} regenerated item(s) to your resume.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Apply Failed",
        description: error.message || "Failed to apply changes. Please try again.",
        variant: "destructive",
      });
    },
  });
};
