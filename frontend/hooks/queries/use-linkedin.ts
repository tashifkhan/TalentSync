import { useMutation } from "@tanstack/react-query";
import { linkedinService } from "@/services";

export const useGenerateLinkedInPosts = () => {
  return useMutation({
    mutationFn: linkedinService.generatePosts,
  });
};
