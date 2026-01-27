import { useQuery } from "@tanstack/react-query";
import { tipsService } from "@/services";

export const useTips = (category: string, skills: string) => {
  return useQuery({
    queryKey: ["tips", category, skills],
    queryFn: async () => {
      const response = await tipsService.getTips(category, skills);
      return response.data;
    },
    enabled: !!category || !!skills,
  });
};
