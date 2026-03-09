import { useMutation } from "@tanstack/react-query";
import { jdEditorService, type JDEditRequest } from "@/services";
import { useToast } from "@/hooks/use-toast";
import type { JDEditResponse } from "@/types/jd-editor";

/**
 * Hook for editing a resume against a job description.
 * Returns field-level diffs, before/after ATS scores, and keyword analysis.
 */
export const useJDEditResume = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (params: JDEditRequest) =>
      jdEditorService.editResumeForJD(params),
    onError: (error: Error) => {
      toast({
        title: "JD Edit Failed",
        description:
          error.message || "Failed to edit resume for this job description. Please try again.",
        variant: "destructive",
      });
    },
  });
};
