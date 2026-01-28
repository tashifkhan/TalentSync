import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { coldMailService } from "@/services";
import { useToast } from "@/hooks/use-toast";

export const useColdMails = () => {
  return useQuery({
    queryKey: ["coldMails"],
    queryFn: async () => {
      const response = await coldMailService.getColdMails();
      return response.data;
    },
  });
};

export const useUserResumes = () => {
  return useQuery({
    queryKey: ["userResumes"],
    queryFn: async () => {
      const response = await coldMailService.getUserResumes();
      return response.data.resumes;
    },
  });
};

export const useDeleteColdMail = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: coldMailService.deleteColdMail,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["coldMails"] });
      toast({
        title: "Success",
        description: "Cold mail session deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete cold mail",
        variant: "destructive",
      });
    },
  });
};

export const useGenerateColdMail = () => {
  return useMutation({
    mutationFn: coldMailService.generateColdMail,
  });
};

export const useEditColdMail = () => {
  return useMutation({
    mutationFn: coldMailService.editColdMail,
  });
};
