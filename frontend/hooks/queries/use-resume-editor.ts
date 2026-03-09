import { useMutation, useQueryClient } from "@tanstack/react-query";
import { resumeService } from "@/services";
import { useToast } from "@/hooks/use-toast";
import type { ResumeData } from "@/types/resume";

export const useCreateManualResume = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      customName,
      data,
    }: {
      customName: string;
      data: ResumeData;
    }) => resumeService.createManualResume(customName, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast({
        title: "Success",
        description: "Resume created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create resume",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateResumeAnalysis = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ResumeData> }) =>
      resumeService.updateResumeAnalysis(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["resume", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast({
        title: "Saved",
        description: "Resume updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update resume",
        variant: "destructive",
      });
    },
  });
};

export const useSetMasterResume = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => resumeService.setMasterResume(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast({
        title: "Success",
        description: "Master resume updated",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to set master resume",
        variant: "destructive",
      });
    },
  });
};
