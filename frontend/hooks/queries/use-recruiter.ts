import { useQuery } from "@tanstack/react-query";
import { recruiterService } from "@/services";

export const useRecruiterResumes = (search?: string) => {
  return useQuery({
    queryKey: ["recruiterResumes", search],
    queryFn: async () => {
      const response = await recruiterService.getAllResumes(search);
      return response.data.resumes;
    },
  });
};
