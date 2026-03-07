"use client";

import { useState } from "react";
import {
  Upload,
  CheckCircle,
  FileText,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useUserResumes } from "@/hooks/queries";
import { haptic } from "@/lib/haptics";
import { ResumeCombobox } from "@/components/shared/resume-combobox";

export interface UserResumeSummary {
  id: string;
  customName: string;
  uploadDate: string;
  candidateName?: string;
  predictedField?: string;
}

interface ResumeSelectorProps {
  /** "dropdown" (default): toggle + styled select; "card": compact card style */
  mode?: "dropdown" | "card";
  /** When omitted, the component fetches the list internally via useUserResumes */
  userResumes?: UserResumeSummary[];
  /** Controlled selected resume ID; when omitted, selection is managed internally */
  selectedResumeId?: string;
  onSelect: (resumeId: string) => void;
  onFileUpload?: (file: File) => void;
  /** When omitted, loading state is managed internally */
  isLoadingResumes?: boolean;
  resumeFile?: File | null;
  /** If false, hides the "Upload New Resume" tab (default: true) */
  allowUpload?: boolean;
  /** Called whenever the user switches between "Use Existing" and "Upload" tabs */
  onModeChange?: (mode: "resumeId" | "file") => void;
  className?: string;
}

export function ResumeSelector({
  mode = "dropdown",
  userResumes: userResumesProp,
  selectedResumeId: selectedResumeIdProp,
  onSelect,
  onFileUpload,
  isLoadingResumes: isLoadingResumesProp,
  resumeFile = null,
  allowUpload = true,
  onModeChange,
  className,
}: ResumeSelectorProps) {
  const [inputMode, setInputMode] = useState<"resumeId" | "file">("resumeId");
  const [internalSelectedId, setInternalSelectedId] = useState("");

  // Fetch internally only when props are not provided
  const { data: fetchedResumes = [], isLoading: isFetchingResumes } = useUserResumes();

  const userResumes = userResumesProp ?? fetchedResumes;
  const isLoadingResumes = isLoadingResumesProp ?? isFetchingResumes;
  const selectedResumeId = selectedResumeIdProp ?? internalSelectedId;

  const handleSelect = (resumeId: string) => {
    if (selectedResumeIdProp === undefined) {
      setInternalSelectedId(resumeId);
    }
    onSelect(resumeId);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onFileUpload) {
      onFileUpload(file);
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Mode toggle -- only show when upload is allowed */}
      {allowUpload && (
        <div className="flex space-x-1 bg-white/5 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => { haptic("selection"); setInputMode("resumeId"); onModeChange?.("resumeId"); }}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all duration-300 ${
              inputMode === "resumeId"
                ? "bg-brand-primary text-white shadow-lg"
                : "text-brand-light/70 hover:text-brand-light hover:bg-white/10"
            }`}
          >
            Use Existing Resume
          </button>
          <button
            type="button"
            onClick={() => { haptic("selection"); setInputMode("file"); onModeChange?.("file"); }}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all duration-300 ${
              inputMode === "file"
                ? "bg-brand-primary text-white shadow-lg"
                : "text-brand-light/70 hover:text-brand-light hover:bg-white/10"
            }`}
          >
            Upload New Resume
          </button>
        </div>
      )}

      {/* Resume dropdown */}
      {(!allowUpload || inputMode === "resumeId") && (
        <div>
          <Label className="text-brand-light/90 text-sm font-semibold flex items-center mb-3">
            <FileText className="h-4 w-4 mr-2 text-brand-primary" />
            Select Resume <span className="text-red-400 ml-1">*</span>
          </Label>
          <div className="relative">
            <ResumeCombobox
              resumes={userResumes}
              selectedResumeId={selectedResumeId}
              onSelect={handleSelect}
              isLoading={isLoadingResumes}
              emptyDescription="Upload one to get started!"
            />
          </div>
        </div>
      )}

      {/* File upload */}
      {allowUpload && inputMode === "file" && (
        <div>
          <Label
            htmlFor="resume-selector-upload"
            className="text-brand-light text-sm font-medium flex items-center"
          >
            <FileText className="h-4 w-4 mr-2 text-brand-primary" />
            Resume File *
          </Label>
          <div className="relative mt-2">
            <Input
              id="resume-selector-upload"
              type="file"
              accept=".pdf,.doc,.docx,.txt,.md"
              onChange={handleFileChange}
              className="hidden"
            />
            <motion.label
              htmlFor="resume-selector-upload"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="relative flex items-center justify-center w-full h-28 border-2 border-dashed border-white/20 rounded-xl bg-gradient-to-br from-white/5 to-white/10 hover:from-brand-primary/10 hover:to-brand-primary/5 transition-all duration-500 cursor-pointer group overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-brand-primary/0 via-brand-primary/5 to-brand-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10 text-center">
                {resumeFile ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center"
                  >
                    <div className="relative mb-2">
                      <div className="absolute inset-0 bg-brand-primary/20 rounded-full blur-lg" />
                      <CheckCircle className="relative h-6 w-6 text-brand-primary" />
                    </div>
                    <p className="text-brand-light text-sm font-medium mb-1 max-w-44 truncate">
                      {resumeFile.name}
                    </p>
                    <p className="text-brand-primary text-xs font-medium flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Ready for processing
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    className="flex flex-col items-center"
                    whileHover={{ y: -1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="relative mb-2">
                      <div className="absolute inset-0 bg-brand-primary/10 rounded-full blur-lg group-hover:bg-brand-primary/20 transition-colors duration-500" />
                      <Upload className="relative h-6 w-6 text-brand-light/60 group-hover:text-brand-primary transition-colors duration-300" />
                    </div>
                    <p className="text-brand-light text-sm font-medium mb-1">Upload Resume</p>
                    <div className="flex items-center space-x-2 text-xs text-brand-light/50 mt-2">
                      {["PDF", "DOC", "TXT", "MD"].map((fmt) => (
                        <span key={fmt} className="px-2 py-1 bg-white/10 rounded-full">
                          {fmt}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.label>
          </div>
        </div>
      )}
    </div>
  );
}
