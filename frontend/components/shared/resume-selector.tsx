"use client";

import { useState } from "react";
import {
  Upload,
  CheckCircle,
  FileText,
  ChevronDown,
  User,
  Calendar,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { Loader } from "@/components/ui/loader";
import { cn } from "@/lib/utils";
import { useUserResumes } from "@/hooks/queries";

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
  const [showDropdown, setShowDropdown] = useState(false);
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

  const selectedResume = userResumes.find((r) => r.id === selectedResumeId);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onFileUpload) {
      onFileUpload(file);
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Mode toggle — only show when upload is allowed */}
      {allowUpload && (
        <div className="flex space-x-1 bg-white/5 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => { setInputMode("resumeId"); onModeChange?.("resumeId"); }}
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
            onClick={() => { setInputMode("file"); onModeChange?.("file"); }}
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
          <Label className="text-brand-light text-sm font-medium flex items-center">
            <FileText className="h-4 w-4 mr-2 text-brand-primary" />
            Select Resume *
          </Label>
          <div className="relative mt-2">
            <button
              type="button"
              onClick={() => setShowDropdown((v) => !v)}
              className="relative flex items-center justify-between w-full h-12 px-4 border border-white/20 rounded-xl bg-gradient-to-br from-white/5 to-white/10 hover:from-brand-primary/10 hover:to-brand-primary/5 transition-all duration-300 cursor-pointer group"
            >
              <div className="flex items-center space-x-3">
                <FileText className="h-4 w-4 text-brand-primary" />
                <div className="text-left">
                  {selectedResume ? (
                    <div>
                      <p className="text-brand-light text-sm font-medium">
                        {selectedResume.customName}
                      </p>
                      <p className="text-brand-light/60 text-xs">
                        {selectedResume.predictedField || "Resume Selected"}
                      </p>
                    </div>
                  ) : (
                    <p className="text-brand-light/50 text-sm">
                      {isLoadingResumes ? "Loading resumes..." : "Choose a resume"}
                    </p>
                  )}
                </div>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-brand-light/60 transition-transform duration-200 ${
                  showDropdown ? "rotate-180" : ""
                }`}
              />
            </button>

            <AnimatePresence>
              {showDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full mt-2 w-full bg-surface border border-white/20 rounded-xl shadow-2xl z-50 overflow-hidden"
                >
                  {isLoadingResumes ? (
                    <div className="p-4 text-center">
                      <Loader variant="spinner" size="sm" className="text-brand-primary" />
                    </div>
                  ) : userResumes.length > 0 ? (
                    <div className="max-h-64 overflow-y-auto">
                      {userResumes.map((resume) => (
                        <button
                          key={resume.id}
                          type="button"
                          onClick={() => {
                            handleSelect(resume.id);
                            setShowDropdown(false);
                          }}
                          className="w-full p-3 text-left hover:bg-white/10 transition-colors border-b border-white/10 last:border-b-0"
                        >
                          <div className="flex items-center space-x-3">
                            <FileText className="h-4 w-4 text-brand-primary flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-brand-light text-sm font-medium truncate">
                                {resume.customName}
                              </p>
                              <div className="flex items-center space-x-2 mt-1">
                                {resume.candidateName && (
                                  <div className="flex items-center space-x-1">
                                    <User className="h-3 w-3 text-brand-light/40" />
                                    <span className="text-brand-light/60 text-xs">
                                      {resume.candidateName}
                                    </span>
                                  </div>
                                )}
                                {resume.predictedField && (
                                  <span className="px-2 py-0.5 bg-brand-primary/20 text-brand-primary text-xs rounded-full">
                                    {resume.predictedField}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center space-x-1 mt-1">
                                <Calendar className="h-3 w-3 text-brand-light/40" />
                                <span className="text-brand-light/40 text-xs">
                                  {new Date(resume.uploadDate).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-brand-light/60 text-sm">
                      No resumes found. Upload one to get started!
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
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
