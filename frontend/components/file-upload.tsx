"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Eye,
  Lightbulb,
  Mail,
  Users,
  ScrollText,
} from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Loader } from "./ui/loader";
import { useRouter } from "next/navigation";
import { useUploadResume } from "@/hooks/queries";
import { ResumeData } from "@/types";

// This interface matches the Prisma/API response structure (camelCase)
// We define it locally because it differs from the ResumeData type (snake_case)
// used by the Python backend and ResumePreview component.
interface AnalysisResultData {
  resumeId: string;
  analysis: {
    id: string;
    name: string;
    email: string;
    contact?: string;
    predictedField: string;
    skillsAnalysis: Array<{
      skill_name: string;
      percentage: number;
    }>;
    recommendedRoles: string[];
    languages: Array<{
      language: string;
    }>;
    education: Array<{
      education_detail: string;
    }>;
    workExperience: Array<{
      role: string;
      company_and_duration: string;
      bullet_points: string[];
    }>;
    projects: Array<{
      title: string;
      technologies_used: string[];
      description: string;
    }>;
    uploadedAt: string;
  };
  cleanedText: string;
}

interface FileUploadProps {
  onUploadSuccess?: () => void;
}

export function FileUpload({ onUploadSuccess }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [customName, setCustomName] = useState<string>("");
  const [showInCentral, setShowInCentral] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] =
    useState<AnalysisResultData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const { mutateAsync: uploadResume, isPending: isUploading } =
    useUploadResume();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (selectedFile) {
      setFile(selectedFile);
      // Set default custom name to file name without extension
      const nameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, "");
      setCustomName(nameWithoutExt);
      setError(null);
      setAnalysisResult(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "text/plain": [".txt"],
      "text/markdown": [".md"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
    },
    maxFiles: 1,
  });

  const handleUpload = async () => {
    if (!file || !customName.trim()) return;

    setError(null);

    try {
      const response = await uploadResume({
        file,
        customName: customName.trim(),
      });

      if (response.success && response.data) {
        // Force cast to our local interface since we know the structure but types might differ slightly
        setAnalysisResult(response.data as unknown as AnalysisResultData);

        // Call the success callback if provided
        if (onUploadSuccess) {
          onUploadSuccess();
        }
      } else {
        throw new Error(response.message || "Failed to analyze resume");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze resume");
    }
  };

  const handleDetailedAnalysis = async () => {
    if (!analysisResult?.resumeId) return;

    // Navigate directly to the analysis page using the resume ID
    router.push(`/dashboard/analysis/${analysisResult.resumeId}`);
  };

  const handleGetTips = () => {
    const jobCategory = analysisResult?.analysis.predictedField || "";
    const skills =
      analysisResult?.analysis.skillsAnalysis
        .map((s) => s.skill_name)
        .join(",") || "";
    router.push(
      `/dashboard/tips?category=${encodeURIComponent(
        jobCategory,
      )}&skills=${encodeURIComponent(skills)}`,
    );
  };

  const handleColdMailGenerator = () => {
    // Store the file and analysis data in localStorage to pass to cold-mail page
    if (file && analysisResult) {
      localStorage.setItem(
        "resumeFile",
        JSON.stringify({
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified,
        }),
      );
      localStorage.setItem(
        "analysisData",
        JSON.stringify(analysisResult.analysis),
      );
    }
    router.push("/dashboard/cold-mail");
  };

  const handleHiringAssistant = () => {
    // Store the file and analysis data in localStorage to pass to hiring-assistant page
    if (file && analysisResult) {
      localStorage.setItem(
        "resumeFile",
        JSON.stringify({
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified,
        }),
      );
      localStorage.setItem(
        "analysisData",
        JSON.stringify(analysisResult.analysis),
      );
    }
    router.push("/dashboard/hiring-assistant");
  };

  const handleCoverLetterGenerator = () => {
    // Store the file and analysis data in localStorage to pass to cover-letter page
    if (file && analysisResult) {
      localStorage.setItem(
        "resumeFile",
        JSON.stringify({
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified,
        }),
      );
      localStorage.setItem(
        "analysisData",
        JSON.stringify(analysisResult.analysis),
      );
    }
    router.push("/dashboard/cover-letter");
  };

  return (
    <>
      {/* Full-screen loading overlay for resume analysis */}
      <AnimatePresence>
        {isUploading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-md z-50 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white/10 backdrop-blur-lg rounded-3xl p-10 border border-white/20 text-center max-w-sm mx-4"
            >
              <div className="relative mb-6">
                <Loader
                  variant="pulse"
                  size="xl"
                  className="text-brand-primary"
                />
              </div>
              <h3 className="text-brand-light font-semibold text-xl mb-3">
                Analyzing Your Resume
              </h3>
              <p className="text-brand-light/70 text-sm leading-relaxed">
                AI is processing your resume to extract key information and
                predict your career field...
              </p>
              <div className="mt-6 flex justify-center space-x-2">
                <div className="w-2 h-2 bg-brand-primary rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-brand-primary rounded-full animate-pulse delay-75"></div>
                <div className="w-2 h-2 bg-brand-primary rounded-full animate-pulse delay-150"></div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full max-w-2xl mx-auto space-y-6">
        {!analysisResult && (
          <Card className="backdrop-blur-lg bg-white/5 border-white/10">
            <CardContent className="p-8">
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? "border-brand-primary bg-brand-primary/10"
                    : "border-white/20 hover:border-brand-primary/50"
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="mx-auto h-12 w-12 text-brand-primary mb-4" />
                {isDragActive ? (
                  <p className="text-brand-light">Drop the file here...</p>
                ) : (
                  <div>
                    <p className="text-brand-light text-lg mb-2">
                      Drag & drop your resume here
                    </p>
                    <p className="text-brand-light/60">
                      or click to select a file
                    </p>
                    <p className="text-brand-light/40 text-sm mt-2">
                      Supports PDF, TXT, DOCX and MD files
                    </p>
                  </div>
                )}
              </div>

              {file && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 bg-white/5 rounded-lg space-y-4"
                >
                  <div className="flex items-center space-x-3">
                    <FileText className="h-8 w-8 text-brand-primary" />
                    <div>
                      <p className="text-brand-light font-medium">
                        {file.name}
                      </p>
                      <p className="text-brand-light/60 text-sm">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>

                  {/* Custom Name Input */}
                  <div>
                    <label className="block text-brand-light/80 text-sm font-medium mb-2">
                      Custom Name *
                    </label>
                    <input
                      type="text"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder="Enter a custom name for this resume"
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-brand-light placeholder:text-brand-light/50 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                      disabled={isUploading}
                    />
                  </div>

                  {/* Show in Central Checkbox */}
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="showInCentral"
                      checked={showInCentral}
                      onChange={(e) => setShowInCentral(e.target.checked)}
                      className="w-4 h-4 text-brand-primary bg-white/10 border-white/30 rounded focus:ring-brand-primary focus:ring-2"
                      disabled={isUploading}
                    />
                    <label
                      htmlFor="showInCentral"
                      className="text-brand-light/80 text-sm"
                    >
                      Show in central repository
                    </label>
                  </div>

                  <Button
                    onClick={handleUpload}
                    disabled={isUploading || !customName.trim()}
                    className="w-full bg-brand-primary hover:bg-brand-primary/90 disabled:opacity-50"
                  >
                    {isUploading ? (
                      <div className="flex items-center space-x-2">
                        <Loader variant="spinner" size="sm" />
                        <span>Analyzing...</span>
                      </div>
                    ) : (
                      "Analyze Resume"
                    )}
                  </Button>
                </motion.div>
              )}

              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-4 p-4 bg-destructive/20 border border-destructive/50 rounded-lg flex items-center space-x-2"
                >
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  <p className="text-destructive">{error}</p>
                </motion.div>
              )}
            </CardContent>
          </Card>
        )}

        {analysisResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Card className="backdrop-blur-lg bg-white/5 border-white/10">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <CheckCircle className="h-6 w-6 text-success" />
                  <h3 className="text-xl font-semibold text-brand-light">
                    Analysis Complete!
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-brand-light/60 text-sm">Name</p>
                    <p className="text-brand-light font-medium">
                      {analysisResult.analysis.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-brand-light/60 text-sm">Email</p>
                    <p className="text-brand-light font-medium">
                      {analysisResult.analysis.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-brand-light/60 text-sm">
                      Predicted Field
                    </p>
                    <Badge className="bg-brand-primary/20 text-brand-primary hover:bg-brand-primary/30">
                      {analysisResult.analysis.predictedField}
                    </Badge>
                  </div>
                  {analysisResult.analysis.contact && (
                    <div>
                      <p className="text-brand-light/60 text-sm">Contact</p>
                      <p className="text-brand-light font-medium">
                        {analysisResult.analysis.contact}
                      </p>
                    </div>
                  )}
                </div>

                {analysisResult.analysis.skillsAnalysis.length > 0 && (
                  <div className="mb-6">
                    <p className="text-brand-light/60 text-sm mb-2">
                      Skills Detected
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {analysisResult.analysis.skillsAnalysis
                        .slice(0, 6)
                        .map((skillObj, index) => (
                          <Badge
                            key={index}
                            className="bg-brand-primary/10 text-brand-primary border border-brand-primary/30"
                          >
                            {skillObj.skill_name} ({skillObj.percentage}%)
                          </Badge>
                        ))}
                      {analysisResult.analysis.skillsAnalysis.length > 6 && (
                        <Badge className="bg-white/10 text-brand-light/60">
                          +{analysisResult.analysis.skillsAnalysis.length - 6}{" "}
                          more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-3">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      onClick={handleDetailedAnalysis}
                      disabled={!analysisResult?.resumeId}
                      className="flex-1 bg-brand-primary hover:bg-brand-primary/90"
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View Detailed Analysis
                    </Button>
                    <Button
                      onClick={handleGetTips}
                      variant="outline"
                      className="flex-1 border-brand-primary/30 text-brand-primary hover:bg-brand-primary/10"
                    >
                      <Lightbulb className="mr-2 h-4 w-4" />
                      Get Career Tips
                    </Button>
                  </div>

                  {/* Quick Actions */}
                  <div className="pt-2 border-t border-white/10">
                    <p className="text-brand-light/60 text-sm mb-3 text-center">
                      Quick Actions with Your Resume
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <Button
                        onClick={handleColdMailGenerator}
                        variant="outline"
                        className="flex-1 border-brand-primary/30 text-brand-primary hover:bg-brand-primary/10 hover:border-brand-primary/50"
                      >
                        <Mail className="mr-2 h-4 w-4" />
                        Cold Mail
                      </Button>
                      <Button
                        onClick={handleCoverLetterGenerator}
                        variant="outline"
                        className="flex-1 border-brand-primary/30 text-brand-primary hover:bg-brand-primary/10 hover:border-brand-primary/50"
                      >
                        <ScrollText className="mr-2 h-4 w-4" />
                        Cover Letter
                      </Button>
                      <Button
                        onClick={handleHiringAssistant}
                        variant="outline"
                        className="flex-1 border-brand-primary/30 text-brand-primary hover:bg-brand-primary/10 hover:border-brand-primary/50"
                      >
                        <Users className="mr-2 h-4 w-4" />
                        Interview Prep
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </>
  );
}
