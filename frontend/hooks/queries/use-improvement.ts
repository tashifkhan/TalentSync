import { useMutation, useQueryClient } from "@tanstack/react-query";
import { improvementService, type ImproveResumeParams, type RefineResumeParams } from "@/services";
import { useToast } from "@/hooks/use-toast";

/**
 * Hook for improving a resume with AI optimization.
 */
export const useImproveResume = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (params: ImproveResumeParams) => improvementService.improveResume(params),
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ["resume"] });
        toast({
          title: "Resume Improved",
          description: data.message || "Your resume has been optimized for the job description.",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Improvement Failed",
        description: error.message || "Failed to improve resume. Please try again.",
        variant: "destructive",
      });
    },
  });
};

/**
 * Hook for refining an already tailored resume.
 */
export const useRefineResume = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (params: RefineResumeParams) => improvementService.refineResume(params),
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ["resume"] });
        toast({
          title: "Resume Refined",
          description: data.message || "Your resume has been refined with additional optimization.",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Refinement Failed",
        description: error.message || "Failed to refine resume. Please try again.",
        variant: "destructive",
      });
    },
  });
};
