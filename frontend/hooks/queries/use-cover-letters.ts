import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { coverLetterService } from "@/services";
import { useToast } from "@/hooks/use-toast";

export const useCoverLetters = () => {
  return useQuery({
    queryKey: ["coverLetters"],
    queryFn: async () => {
      const response = await coverLetterService.getCoverLetters();
      return response.data;
    },
  });
};

export const useDeleteCoverLetter = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: coverLetterService.deleteCoverLetter,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["coverLetters"] });
      toast({
        title: "Success",
        description: "Cover letter session deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete cover letter",
        variant: "destructive",
      });
    },
  });
};

export const useGenerateCoverLetter = () => {
  return useMutation({
    mutationFn: coverLetterService.generateCoverLetter,
  });
};

export const useEditCoverLetter = () => {
  return useMutation({
    mutationFn: coverLetterService.editCoverLetter,
  });
};
