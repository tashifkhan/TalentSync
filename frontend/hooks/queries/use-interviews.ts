import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { interviewService } from "@/services";
import { useToast } from "@/hooks/use-toast";

export const useInterviews = () => {
  return useQuery({
    queryKey: ["interviews"],
    queryFn: async () => {
      const response = await interviewService.getInterviews();
      return response.data;
    },
  });
};

export const useDeleteInterview = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: interviewService.deleteInterview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["interviews"] });
      toast({
        title: "Success",
        description: "Interview session deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete interview",
        variant: "destructive",
      });
    },
  });
};

export const useGenerateAnswer = () => {
  return useMutation({
    mutationFn: interviewService.generateAnswer,
  });
};
