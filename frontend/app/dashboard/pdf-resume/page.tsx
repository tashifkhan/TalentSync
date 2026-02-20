"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { ResumeData, PdfGenerationRequest } from "@/types/resume";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, FileText, ArrowLeft, Eye, Code, Sparkles, RefreshCw, ScrollText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Loader } from "@/components/ui/loader";
import LoadingOverlay from "@/components/pdf-resume/LoadingOverlay";
import PageLoader from "@/components/pdf-resume/PageLoader";
import ResumeSourceSelector from "@/components/pdf-resume/ResumeSourceSelector";
import TailoringForm from "@/components/pdf-resume/TailoringForm";
import ConfigurationForm from "@/components/pdf-resume/ConfigurationForm";
import ResumePreview from "@/components/pdf-resume/ResumePreview";
import LatexOutput from "@/components/pdf-resume/LatexOutput";
import { DiffPreviewModal } from "@/components/improvement";
import { EnrichmentModal } from "@/components/enrichment";
import { RegenerateDialog } from "@/components/regeneration";
import {
  useUserResumes,
  useTailorResume,
  useGenerateLatex,
  useDownloadPdf,
} from "@/hooks/queries";
import { useImproveResume } from "@/hooks/queries/use-improvement";
import type {
  ResumeDiffSummary,
  ResumeFieldDiff,
  ImprovementSuggestion,
  RefinementStats,
} from "@/types/improvement";
import type { SelectableItem } from "@/types/enrichment";

export default function PdfResumePage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationType, setGenerationType] = useState<"pdf" | "latex">("pdf");
  const [selectedTemplate, setSelectedTemplate] = useState("professional");
  const [fontSize, setFontSize] = useState(10);
  const [colorScheme, setColorScheme] = useState("default");
  const [latexOutput, setLatexOutput] = useState("");
  const [showLatex, setShowLatex] = useState(false);
  const { toast } = useToast();
  const [isPageLoading, setIsPageLoading] = useState(true);

  // Resume selection states
  const [inputMode, setInputMode] = useState<"file" | "resumeId">("file");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [selectedResumeId, setSelectedResumeId] = useState<string>("");
  const [parsedData, setParsedData] = useState<ResumeData | null>(null);

  // Tailored resume fields
  const [jobRole, setJobRole] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [useTailoring, setUseTailoring] = useState(false);

  // Improvement modal state
  const [isDiffModalOpen, setIsDiffModalOpen] = useState(false);
  const [isImproving, setIsImproving] = useState(false);
  const [diffSummary, setDiffSummary] = useState<ResumeDiffSummary | null>(null);
  const [detailedChanges, setDetailedChanges] = useState<ResumeFieldDiff[]>([]);
  const [suggestions, setSuggestions] = useState<ImprovementSuggestion[]>([]);
  const [refinementStats, setRefinementStats] = useState<RefinementStats | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [improvedResumeData, setImprovedResumeData] = useState<ResumeData | null>(null);

  // Enrichment and Regeneration modal states
  const [isEnrichmentOpen, setIsEnrichmentOpen] = useState(false);
  const [isRegenerateOpen, setIsRegenerateOpen] = useState(false);

  // Queries
  const { data: userResumes = [], isLoading: isLoadingResumes } =
    useUserResumes();

  // Mutations
  const tailorResumeMutation = useTailorResume();
  const generateLatexMutation = useGenerateLatex();
  const downloadPdfMutation = useDownloadPdf();
  const improveResumeMutation = useImproveResume();

  // Initialize page
  useEffect(() => {
    const timer = setTimeout(() => setIsPageLoading(false), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setResumeFile(file);
      setInputMode("file");
      toast({
        title: "File Uploaded",
        description: `${file.name} has been selected for processing.`,
      });
    }
  };

  const handleResumeSelection = (resumeId: string) => {
    setSelectedResumeId(resumeId);
    setInputMode("resumeId");
    const selectedResume = userResumes.find((r) => r.id === resumeId);
    if (selectedResume) {
      toast({
        title: "Resume Selected",
        description: `${selectedResume.customName} has been selected.`,
      });
    }
  };

  const getResumeData = async (): Promise<ResumeData | null> => {
    try {
      const formData = new FormData();

      // Add resume source
      if (inputMode === "file" && resumeFile) {
        formData.append("file", resumeFile);
      } else if (inputMode === "resumeId" && selectedResumeId) {
        formData.append("resumeId", selectedResumeId);
      } else {
        throw new Error("Please select a resume or upload a file");
      }

      // Add tailoring parameters if enabled
      if (useTailoring) {
        if (!jobRole.trim()) {
          throw new Error("Job role is required for tailoring");
        }
        formData.append("job_role", jobRole);
        if (companyName) formData.append("company_name", companyName);
        if (companyWebsite) formData.append("company_website", companyWebsite);
        if (jobDescription) formData.append("job_description", jobDescription);
      } else {
        // For non-tailored resumes, we still need to use the backend to get the resume data
        // Use a placeholder job role to satisfy the API requirement
        formData.append("job_role", "General");
      }

      const result = await tailorResumeMutation.mutateAsync(formData);

      if (!result.success) {
        throw new Error("Failed to process resume");
      }

      // Transform backend response to ResumeData format
      const resumeData = result.resume_data || result.data;
      if (!resumeData) throw new Error("No resume data returned");

      setParsedData(resumeData); // Update state for preview
      return resumeData;
    } catch (error: any) {
      toast({
        title: "Processing Failed",
        description: error.message || "Could not process resume",
        variant: "destructive",
      });
      return null;
    }
  };

  const generateLatex = async () => {
    // Validation based on input mode
    if (inputMode === "file" && !resumeFile) {
      toast({
        title: "No File",
        description: "Please upload a resume file.",
        variant: "destructive",
      });
      return;
    }

    if (inputMode === "resumeId" && !selectedResumeId) {
      toast({
        title: "No Resume Selected",
        description: "Please select a resume from your saved resumes.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setGenerationType("latex");

    try {
      // Get resume data (tailored or not)
      const dataToUse = await getResumeData();

      if (!dataToUse) {
        throw new Error("Failed to get resume data");
      }

      const request: PdfGenerationRequest = {
        resumeData: dataToUse,
        template: selectedTemplate,
        options: {
          fontSize: fontSize,
          colorScheme: colorScheme as any,
          margins: { top: 0.75, bottom: 0.75, left: 0.75, right: 0.75 },
        },
      };

      const result = await generateLatexMutation.mutateAsync(request);

      setLatexOutput(result.latex);
      setShowLatex(true);

      toast({
        title: "LaTeX Generated",
        description: useTailoring
          ? "Tailored LaTeX code has been generated successfully."
          : "LaTeX code has been generated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadPdf = async () => {
    // Validation based on input mode
    if (inputMode === "file" && !resumeFile) {
      toast({
        title: "No File",
        description: "Please upload a resume file.",
        variant: "destructive",
      });
      return;
    }

    if (inputMode === "resumeId" && !selectedResumeId) {
      toast({
        title: "No Resume Selected",
        description: "Please select a resume from your saved resumes.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setGenerationType("pdf");

    try {
      // Get resume data (tailored or not)
      const dataToUse = await getResumeData();

      if (!dataToUse) {
        throw new Error("Failed to get resume data");
      }

      const request: PdfGenerationRequest = {
        resumeData: dataToUse,
        template: selectedTemplate,
        options: {
          fontSize: fontSize,
          colorScheme: colorScheme as any,
          margins: { top: 0.75, bottom: 0.75, left: 0.75, right: 0.75 },
        },
      };

      const response = await downloadPdfMutation.mutateAsync(request);

      if (
        response.ok &&
        response.headers.get("content-type")?.includes("application/pdf")
      ) {
        // PDF was generated successfully
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const fileName = dataToUse.name
          ? `${dataToUse.name.replace(/\s/g, "_")}_Resume.pdf`
          : "Resume.pdf";
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);

        toast({
          title: "Success!",
          description: useTailoring
            ? "Your tailored resume PDF has been downloaded."
            : "Your resume PDF has been downloaded.",
        });
      } else {
        // Fallback mode - show LaTeX
        const result = await response.json();
        if (result.fallback && result.latex) {
          setLatexOutput(result.latex);
          setShowLatex(true);

          toast({
            title: "PDF Service Unavailable",
            description:
              "LaTeX code generated. You can copy it and compile manually.",
            variant: "destructive",
          });
        } else {
          throw new Error(result.error || "Failed to generate PDF");
        }
      }
    } catch (error: any) {
      toast({
        title: "Download Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyLatexToClipboard = () => {
    if (latexOutput) {
      navigator.clipboard.writeText(latexOutput).then(() => {
        toast({
          title: "Copied!",
          description: "LaTeX code copied to clipboard.",
        });
      });
    }
  };

  const openInOverleaf = () => {
    if (latexOutput) {
      const encodedLatex = encodeURIComponent(latexOutput);
      window.open(
        `https://www.overleaf.com/docs?snip=${encodedLatex}`,
        "_blank",
      );
    }
  };

  const improveResume = async () => {
    // Validation
    if (inputMode === "file" && !resumeFile) {
      toast({
        title: "No File",
        description: "Please upload a resume file.",
        variant: "destructive",
      });
      return;
    }

    if (inputMode === "resumeId" && !selectedResumeId) {
      toast({
        title: "No Resume Selected",
        description: "Please select a resume from your saved resumes.",
        variant: "destructive",
      });
      return;
    }

    if (!jobDescription.trim()) {
      toast({
        title: "Job Description Required",
        description: "Please enter a job description to improve your resume.",
        variant: "destructive",
      });
      return;
    }

    setIsImproving(true);

    try {
      // First get the resume data
      const dataToUse = await getResumeData();

      if (!dataToUse) {
        throw new Error("Failed to get resume data");
      }

      // Call the improve endpoint
      const result = await improveResumeMutation.mutateAsync({
        resumeId: selectedResumeId || "",
        jobDescription: jobDescription,
      });

      if (result.success) {
        // Set the diff preview state
        setDiffSummary(result.diff_summary || null);
        setDetailedChanges(result.detailed_changes || []);
        setSuggestions(result.improvements || []);
        setRefinementStats(result.refinement_stats || null);
        setWarnings(result.warnings || []);
        setImprovedResumeData(result.improved_resume);

        // Open the diff modal
        setIsDiffModalOpen(true);
      }
    } catch (error: any) {
      toast({
        title: "Improvement Failed",
        description: error.message || "Failed to improve resume",
        variant: "destructive",
      });
    } finally {
      setIsImproving(false);
    }
  };

  const handleApplyImprovement = () => {
    if (improvedResumeData) {
      setParsedData(improvedResumeData);
      setIsDiffModalOpen(false);

      toast({
        title: "Improvements Applied",
        description: "Your resume has been updated with the improvements.",
      });
    }
  };

  const handleRejectImprovement = () => {
    setIsDiffModalOpen(false);
    setImprovedResumeData(null);
    setDiffSummary(null);
    setDetailedChanges([]);
    setSuggestions([]);
    setRefinementStats(null);
    setWarnings([]);

    toast({
      title: "Changes Rejected",
      description: "The improvements have been discarded.",
    });
  };

  // Build selectable items for regeneration from parsed resume data
  const selectableItems: SelectableItem[] = useMemo(() => {
    if (!parsedData) return [];

    const items: SelectableItem[] = [];

    // Add work experiences
    if (parsedData.work_experience) {
      parsedData.work_experience.forEach((work, index) => {
        items.push({
          id: `experience-${index}`,
          type: "experience",
          title: work.role || "Untitled Role",
          subtitle: work.company_and_duration,
          content: work.bullet_points || [],
          selected: false,
        });
      });
    }

    // Add projects
    if (parsedData.projects) {
      parsedData.projects.forEach((project, index) => {
        items.push({
          id: `project-${index}`,
          type: "project",
          title: project.title || "Untitled Project",
          subtitle: project.technologies_used?.join(", "),
          content: project.description ? [project.description] : [],
          selected: false,
        });
      });
    }

    return items;
  }, [parsedData]);

  const handleEnrichmentComplete = () => {
    // Refetch the resume data after enrichment
    if (selectedResumeId) {
      // The parsedData will be updated via user action (preview button)
      toast({
        title: "Enrichment Complete",
        description: "Your resume has been enriched. Click Preview to see the changes.",
      });
    }
  };

  const handleRegenerateComplete = () => {
    // Similar to enrichment
    if (selectedResumeId) {
      toast({
        title: "Regeneration Complete",
        description: "Your resume content has been regenerated. Click Preview to see the changes.",
      });
    }
  };

  return (
    <>
      <PageLoader isPageLoading={isPageLoading} />
      {!isPageLoading && (
        <div className="min-h-screen">
          <LoadingOverlay
            isGenerating={isGenerating}
            generationType={generationType}
          />
          {/* Mobile-optimized container */}
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
            {/* Back button - consistent with other dashboard pages */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-6 sm:mb-8"
            >
              <Link href="/dashboard/seeker">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-brand-light hover:text-brand-primary hover:bg-white/5 transition-all duration-300 p-2 sm:p-3"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Back to Dashboard</span>
                  <span className="sm:hidden">Back</span>
                </Button>
              </Link>
            </motion.div>

            <div className="max-w-7xl mx-auto">
              {/* Header - consistent with other dashboard pages */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-center mb-8 sm:mb-12"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-brand-primary/10 rounded-2xl mb-4 sm:mb-6">
                  <FileText className="h-8 w-8 sm:h-10 sm:w-10 text-brand-primary" />
                </div>
                <div className="flex items-center justify-center gap-3 mb-3 sm:mb-4">
                  <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-brand-light leading-tight">
                    PDF Resume Generator
                  </h1>
                  <Badge className="bg-brand-primary/20 text-brand-primary border-brand-primary/30 text-xs font-medium">
                    BETA
                  </Badge>
                </div>
                <p className="text-brand-light/70 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed px-4">
                  Transform your resume into a professional PDF or LaTeX
                  document with customizable templates.
                </p>
              </motion.div>

              {/* Responsive grid - stack on mobile */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
                {/* Input Form */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="order-1"
                >
                  <Card className="relative backdrop-blur-lg bg-white/5 border-white/10 shadow-2xl overflow-hidden">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-brand-light text-xl sm:text-2xl font-semibold">
                        Resume Generator Details
                      </CardTitle>
                      <p className="text-brand-light/60 text-sm">
                        Provide your resume and customize the output format
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Resume Input Mode Selection */}
                      <ResumeSourceSelector
                        inputMode={inputMode}
                        setInputMode={setInputMode}
                        resumeFile={resumeFile}
                        handleFileUpload={handleFileUpload}
                        userResumes={userResumes}
                        selectedResumeId={selectedResumeId}
                        handleResumeSelection={handleResumeSelection}
                        isLoadingResumes={isLoadingResumes}
                      />

                      {/* Tailored Resume Options */}
                      <TailoringForm
                        useTailoring={useTailoring}
                        setUseTailoring={setUseTailoring}
                        jobRole={jobRole}
                        setJobRole={setJobRole}
                        companyName={companyName}
                        setCompanyName={setCompanyName}
                        companyWebsite={companyWebsite}
                        setCompanyWebsite={setCompanyWebsite}
                        jobDescription={jobDescription}
                        setJobDescription={setJobDescription}
                      />

                      {/* Configuration Card */}
                      <ConfigurationForm
                        selectedTemplate={selectedTemplate}
                        setSelectedTemplate={setSelectedTemplate}
                        fontSize={fontSize}
                        setFontSize={setFontSize}
                        colorScheme={colorScheme}
                        setColorScheme={setColorScheme}
                      />

                      {/* Action Buttons Section */}
                      <div className="pt-4 border-t border-white/10 space-y-3">
                        {/* Primary Action - Download PDF */}
                        <motion.div
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                        >
                          <Button
                            onClick={downloadPdf}
                            disabled={
                              isGenerating ||
                              (inputMode === "file" ? !resumeFile : !selectedResumeId)
                            }
                            className="relative w-full h-12 bg-gradient-to-r from-brand-primary to-brand-primary/80 hover:from-brand-primary/90 hover:to-brand-primary/70 text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl overflow-hidden group"
                          >
                            {isGenerating && generationType === "pdf" && (
                              <div className="absolute inset-0 bg-gradient-to-r from-brand-primary/20 via-brand-primary/40 to-brand-primary/20 animate-pulse" />
                            )}
                            <div className="relative z-10 flex items-center justify-center">
                              {isGenerating && generationType === "pdf" ? (
                                <div className="flex items-center space-x-2">
                                  <Loader
                                    variant="spinner"
                                    size="sm"
                                    className="text-white"
                                  />
                                  <span className="text-sm font-medium">
                                    Generating PDF...
                                  </span>
                                </div>
                              ) : (
                                <>
                                  <Download className="mr-2 h-4 w-4 group-hover:translate-y-0.5 transition-transform duration-300" />
                                  <span>Download PDF</span>
                                </>
                              )}
                            </div>
                          </Button>
                        </motion.div>

                        {/* Secondary Actions Row */}
                        <div className="flex gap-3">
                          <Button
                            onClick={async () => {
                              setIsGenerating(true);
                              await getResumeData();
                              setIsGenerating(false);
                            }}
                            disabled={
                              isGenerating ||
                              (inputMode === "file" ? !resumeFile : !selectedResumeId)
                            }
                            variant="outline"
                            className="flex-1 h-10 bg-white/5 border-white/20 text-brand-light hover:bg-white/10 hover:border-brand-primary/50 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm"
                          >
                            <Eye className="h-4 w-4 mr-1.5" />
                            Preview
                          </Button>
                          <Button
                            onClick={generateLatex}
                            disabled={
                              isGenerating ||
                              (inputMode === "file" ? !resumeFile : !selectedResumeId)
                            }
                            variant="outline"
                            className="flex-1 h-10 bg-white/5 border-white/20 text-brand-light hover:bg-white/10 hover:border-brand-primary/50 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm"
                          >
                            {isGenerating && generationType === "latex" ? (
                              <Loader
                                variant="spinner"
                                size="sm"
                                className="text-brand-light mr-1.5"
                              />
                            ) : (
                              <Code className="h-4 w-4 mr-1.5" />
                            )}
                            LaTeX
                          </Button>
                        </div>

                        {/* AI Improve Button */}
                        {useTailoring && jobDescription.trim() && (
                          <Button
                            onClick={improveResume}
                            disabled={
                              isImproving ||
                              isGenerating ||
                              (inputMode === "file" ? !resumeFile : !selectedResumeId)
                            }
                            variant="outline"
                            className="w-full h-10 bg-brand-primary/10 border-brand-primary/30 text-brand-primary hover:bg-brand-primary/20 hover:border-brand-primary/50 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm"
                          >
                            {isImproving ? (
                              <>
                                <Loader
                                  variant="spinner"
                                  size="sm"
                                  className="text-brand-primary mr-1.5"
                                />
                                Improving...
                              </>
                            ) : (
                              <>
                                <Sparkles className="h-4 w-4 mr-1.5" />
                                AI Improve Resume
                              </>
                            )}
                          </Button>
                        )}

                        {/* Enrich & Regenerate Buttons */}
                        {selectedResumeId && (
                          <div className="flex gap-3">
                            <Button
                              onClick={() => setIsEnrichmentOpen(true)}
                              disabled={isGenerating || isImproving}
                              variant="outline"
                              className="flex-1 h-10 bg-brand-primary/10 border-brand-primary/30 text-brand-primary hover:bg-brand-primary/20 hover:border-brand-primary/50 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm"
                            >
                              <Sparkles className="h-4 w-4 mr-1.5" />
                              Enrich Resume
                            </Button>
                            <Button
                              onClick={() => setIsRegenerateOpen(true)}
                              disabled={isGenerating || isImproving || selectableItems.length === 0}
                              variant="outline"
                              className="flex-1 h-10 bg-white/5 border-white/20 text-brand-light hover:bg-white/10 hover:border-white/30 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm"
                            >
                              <RefreshCw className="h-4 w-4 mr-1.5" />
                              Regenerate
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Output Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                  className="order-2 space-y-6"
                >
                  {/* Floating Action for Cover Letter in the Output Area */}
                  {parsedData && (
                    <div className="flex justify-end mb-2">
                      <Link href="/dashboard/cover-letter">
                        <Button
                          variant="outline"
                          className="h-9 bg-brand-primary/10 border-brand-primary/30 text-brand-primary hover:bg-brand-primary/20 hover:border-brand-primary/50 hover:text-brand-primary text-xs font-medium rounded-full px-4 transition-all duration-300 shadow-sm"
                        >
                          <ScrollText className="h-3.5 w-3.5 mr-1.5" />
                          Also Generate Cover Letter
                        </Button>
                      </Link>
                    </div>
                  )}

                  {/* Resume Preview */}
                  {parsedData && <ResumePreview parsedData={parsedData} />}

                  {/* LaTeX Output */}
                  {showLatex && latexOutput && (
                    <LatexOutput
                      latexOutput={latexOutput}
                      copyLatexToClipboard={copyLatexToClipboard}
                      openInOverleaf={openInOverleaf}
                    />
                  )}
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Diff Preview Modal */}
      <DiffPreviewModal
        isOpen={isDiffModalOpen}
        onClose={() => setIsDiffModalOpen(false)}
        onApply={handleApplyImprovement}
        onReject={handleRejectImprovement}
        diffSummary={diffSummary}
        detailedChanges={detailedChanges}
        suggestions={suggestions}
        refinementStats={refinementStats}
        warnings={warnings}
        isApplying={false}
      />

      {/* Enrichment Modal */}
      <EnrichmentModal
        isOpen={isEnrichmentOpen}
        onClose={() => setIsEnrichmentOpen(false)}
        resumeId={selectedResumeId}
        onComplete={handleEnrichmentComplete}
      />

      {/* Regenerate Dialog */}
      <RegenerateDialog
        isOpen={isRegenerateOpen}
        onClose={() => setIsRegenerateOpen(false)}
        resumeId={selectedResumeId}
        availableItems={selectableItems}
        onComplete={handleRegenerateComplete}
      />
    </>
  );
}
