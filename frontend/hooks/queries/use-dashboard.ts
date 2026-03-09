import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "@/services";

export const useDashboard = () => {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const response = await dashboardService.getDashboard();
      return response.data;
    },
  });
};
