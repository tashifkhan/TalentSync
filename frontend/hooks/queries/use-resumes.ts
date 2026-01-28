import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { resumeService } from "@/services";
import { useToast } from "@/hooks/use-toast";

export const useResume = (id: string) => {
  return useQuery({
    queryKey: ["resume", id],
    queryFn: async () => {
      const response = await resumeService.getResume(id);
      return response.data;
    },
    enabled: !!id,
  });
};

export const useDeleteResume = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: resumeService.deleteResume,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast({
        title: "Success",
        description: "Resume deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete resume",
        variant: "destructive",
      });
    },
  });
};

export const useRenameResume = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => 
      resumeService.renameResume(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast({
        title: "Success",
        description: "Resume renamed successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to rename resume",
        variant: "destructive",
      });
    },
  });
};

export const useUploadResume = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ file, customName }: { file: File; customName: string }) =>
      resumeService.uploadResume(file, customName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      // We don't show toast here as usually the UI redirects or shows success in a different way
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to upload resume",
        variant: "destructive",
      });
    },
  });
};
