import { apiClient } from "./api-client";
import { DashboardData } from "@/types";

export const dashboardService = {
  getDashboard: () =>
    apiClient.get<{ success: boolean; data: DashboardData }>("/api/dashboard"),
};
