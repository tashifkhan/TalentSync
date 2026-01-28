import { useQuery, useMutation } from "@tanstack/react-query";
import { atsService } from "@/services";

export const useAtsUserResumes = () => {
  return useQuery({
    queryKey: ["atsUserResumes"],
    queryFn: async () => {
      const response = await atsService.getUserResumes();
      return response.data.resumes;
    },
  });
};

export const useEvaluateResume = () => {
  return useMutation({
    mutationFn: atsService.evaluateResume,
  });
};
