"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  FileText,
  CheckCircle,
  Upload,
} from "lucide-react";
import { motion } from "framer-motion";
import { haptic } from "@/lib/haptics";
import { ResumeCombobox } from "@/components/shared/resume-combobox";

export interface UserResume {
  id: string;
  customName: string;
  uploadDate: string;
  candidateName?: string;
  predictedField?: string;
}

interface ResumeSelectionProps {
  resumeSelectionMode: "existing" | "upload";
  setResumeSelectionMode: (mode: "existing" | "upload") => void;
  userResumes: UserResume[];
  selectedResumeId: string;
  setSelectedResumeId: (id: string) => void;
  isLoadingResumes: boolean;
  resumeFile: File | null;
  setResumeFile: (file: File | null) => void;
  resumeText: string;
  setResumeText: (text: string) => void;
}

export default function ResumeSelection({
  resumeSelectionMode,
  setResumeSelectionMode,
  userResumes,
  selectedResumeId,
  setSelectedResumeId,
  isLoadingResumes,
  resumeFile,
  setResumeFile,
  resumeText,
  setResumeText,
}: ResumeSelectionProps) {
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      haptic("selection");
      setResumeFile(file);
      const fileExtension = file.name.toLowerCase().split(".").pop();
      if (fileExtension === "txt" || fileExtension === "md") {
        const reader = new FileReader();
        reader.onload = (e) => {
          const text = e.target?.result as string;
          setResumeText(text.substring(0, 500) + "...");
        };
        reader.readAsText(file);
      } else {
        setResumeText(
          `${file.name} (${(file.size / 1024).toFixed(
            1,
          )} KB) - ${fileExtension?.toUpperCase()} file selected`,
        );
      }
    }
  };

  return (
    <div className="space-y-3">
      {/* Resume Selection Mode Toggle */}
      <div className="flex space-x-1 bg-white/5 p-1 rounded-lg">
        <button
          onClick={() => { haptic("selection"); setResumeSelectionMode("existing"); }}
          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all duration-300 ${
            resumeSelectionMode === "existing"
              ? "bg-brand-primary text-white shadow-lg"
              : "text-brand-light/70 hover:text-brand-light hover:bg-white/10"
          }`}
        >
          Use Existing Resume
        </button>
        <button
          onClick={() => { haptic("selection"); setResumeSelectionMode("upload"); }}
          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all duration-300 ${
            resumeSelectionMode === "upload"
              ? "bg-brand-primary text-white shadow-lg"
              : "text-brand-light/70 hover:text-brand-light hover:bg-white/10"
          }`}
        >
          Upload New Resume
        </button>
      </div>

      {/* Resume Selection */}
      {resumeSelectionMode === "existing" ? (
        <div>
          <Label className="text-brand-light text-sm font-medium flex items-center">
            <FileText className="h-4 w-4 mr-2 text-brand-primary" />
            Select Resume *
          </Label>
          <div className="relative mt-1">
            <ResumeCombobox
              resumes={userResumes}
              selectedResumeId={selectedResumeId}
              onSelect={setSelectedResumeId}
              isLoading={isLoadingResumes}
              emptyDescription="Upload a resume first in the analysis section"
            />
          </div>
        </div>
      ) : (
        <div>
          <Label
            htmlFor="resume"
            className="text-brand-light text-sm font-medium flex items-center"
          >
            <FileText className="h-4 w-4 mr-2 text-brand-primary" />
            Resume File *
          </Label>
          <div className="relative">
            <Input
              id="resume"
              type="file"
              accept=".pdf,.doc,.docx,.txt,.md"
              onChange={handleFileUpload}
              className="hidden"
            />
            <motion.label
              htmlFor="resume"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="relative flex items-center justify-center w-full h-28 border-2 border-dashed border-white/20 rounded-xl bg-gradient-to-br from-white/5 to-white/10 hover:from-brand-primary/10 hover:to-brand-primary/5 transition-all duration-500 cursor-pointer group overflow-hidden"
            >
              {/* Animated background gradient */}
              <div className="absolute inset-0 bg-gradient-to-r from-brand-primary/0 viabg-brand-primary/5 to-brand-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

              <div className="relative z-10 text-center">
                {resumeFile ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center"
                  >
                    <div className="relative mb-2">
                      <div className="absolute inset-0 bg-brand-primary/20 rounded-full blur-lg"></div>
                      <CheckCircle className="relative h-6 w-6 text-brand-primary" />
                    </div>
                    <p className="text-brand-light text-sm font-medium mb-1 max-w-44 truncate">
                      {resumeFile?.name}
                    </p>
                    <p className="text-brand-primary text-xs font-medium flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Ready for evaluation
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    className="flex flex-col items-center"
                    whileHover={{ y: -1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="relative mb-2">
                      <div className="absolute inset-0 bg-brand-primary/10 rounded-full blur-lg group-hover:bg-brand-primary/20 transition-colors duration-500"></div>
                      <Upload className="relative h-6 w-6 text-brand-light/60 group-hover:text-brand-primary transition-colors duration-300" />
                    </div>
                    <p className="text-brand-light text-sm font-medium mb-1">
                      Upload Resume
                    </p>
                    <div className="flex items-center space-x-2 text-xs text-brand-light/50 mt-2">
                      <span className="px-2 py-1 bg-white/10 rounded-full">
                        PDF
                      </span>
                      <span className="px-2 py-1 bg-white/10 rounded-full">
                        DOC
                      </span>
                      <span className="px-2 py-1 bg-white/10 rounded-full">
                        TXT
                      </span>
                      <span className="px-2 py-1 bg-white/10 rounded-full">
                        MD
                      </span>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.label>
          </div>
          {resumeText && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ duration: 0.3 }}
              className="p-4 bg-gradient-to-r from-brand-primary/10 to-brand-primary/5 border border-brand-primary/20 rounded-xl backdrop-blur-sm"
            >
              <div className="flex items-start space-x-3">
                <FileText className="h-4 w-4 text-brand-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-brand-light/90 text-sm font-medium mb-1">
                    File Preview:
                  </p>
                  <p className="text-brand-light/70 text-xs leading-relaxed">
                    {resumeText}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
