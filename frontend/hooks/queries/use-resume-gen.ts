import { useMutation } from "@tanstack/react-query";
import { resumeGenService } from "@/services";

export const useTailorResume = () => {
  return useMutation({
    mutationFn: resumeGenService.tailorResume,
  });
};

export const useGenerateLatex = () => {
  return useMutation({
    mutationFn: resumeGenService.generateLatex,
  });
};

export const useDownloadPdf = () => {
  return useMutation({
    mutationFn: resumeGenService.downloadPdf,
  });
};
