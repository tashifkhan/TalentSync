"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader } from "@/components/ui/loader";
import { useToast } from "@/hooks/use-toast";
import { Download, Eye, Code, FileText } from "lucide-react";
import TailoringForm from "@/components/pdf-resume/TailoringForm";
import ConfigurationForm from "@/components/pdf-resume/ConfigurationForm";
import ResumePreview from "@/components/pdf-resume/ResumePreview";
import LatexOutput from "@/components/pdf-resume/LatexOutput";
import LoadingOverlay from "@/components/pdf-resume/LoadingOverlay";
import {
  useTailorResume,
  useGenerateLatex,
  useDownloadPdf,
} from "@/hooks/queries";
import type { ResumeData, PdfGenerationRequest } from "@/types/resume";

interface ExportTabProps {
  resumeId: string;
}

export default function ExportTab({ resumeId }: ExportTabProps) {
  const { toast } = useToast();

  // State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationType, setGenerationType] = useState<"pdf" | "latex">("pdf");
  const [selectedTemplate, setSelectedTemplate] = useState("professional");
  const [fontSize, setFontSize] = useState(10);
  const [colorScheme, setColorScheme] = useState("default");
  const [latexOutput, setLatexOutput] = useState("");
  const [showLatex, setShowLatex] = useState(false);
  const [parsedData, setParsedData] = useState<ResumeData | null>(null);

  // Tailoring form state
  const [jobRole, setJobRole] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [useTailoring, setUseTailoring] = useState(false);

  // Mutations
  const tailorResumeMutation = useTailorResume();
  const generateLatexMutation = useGenerateLatex();
  const downloadPdfMutation = useDownloadPdf();

  const getResumeData = async (): Promise<ResumeData | null> => {
    try {
      const formData = new FormData();
      formData.append("resumeId", resumeId);

      if (useTailoring) {
        if (!jobRole.trim()) throw new Error("Job role is required for tailoring");
        formData.append("job_role", jobRole);
        if (companyName) formData.append("company_name", companyName);
        if (companyWebsite) formData.append("company_website", companyWebsite);
        if (jobDescription) formData.append("job_description", jobDescription);
      } else {
        formData.append("job_role", "General");
      }

      const result = await tailorResumeMutation.mutateAsync(formData);
      if (!result.success) throw new Error("Failed to process resume");

      const resumeData = result.resume_data || result.data;
      if (!resumeData) throw new Error("No resume data returned");

      setParsedData(resumeData);
      return resumeData;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Could not process resume";
      toast({ title: "Processing Failed", description: message, variant: "destructive" });
      return null;
    }
  };

  const handlePreview = async () => {
    setIsGenerating(true);
    await getResumeData();
    setIsGenerating(false);
  };

  const generateLatex = async () => {
    setIsGenerating(true);
    setGenerationType("latex");
    try {
      const dataToUse = await getResumeData();
      if (!dataToUse) throw new Error("Failed to get resume data");

      const request: PdfGenerationRequest = {
        resumeData: dataToUse,
        template: selectedTemplate,
        options: {
          fontSize,
          colorScheme: colorScheme as never,
          margins: { top: 0.75, bottom: 0.75, left: 0.75, right: 0.75 },
        },
      };

      const result = await generateLatexMutation.mutateAsync(request);
      setLatexOutput(result.latex);
      setShowLatex(true);
      toast({ title: "LaTeX Generated", description: "LaTeX code generated successfully." });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "LaTeX generation failed";
      toast({ title: "Generation Failed", description: message, variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadPdf = async () => {
    setIsGenerating(true);
    setGenerationType("pdf");
    try {
      const dataToUse = await getResumeData();
      if (!dataToUse) throw new Error("Failed to get resume data");

      const request: PdfGenerationRequest = {
        resumeData: dataToUse,
        template: selectedTemplate,
        options: {
          fontSize,
          colorScheme: colorScheme as never,
          margins: { top: 0.75, bottom: 0.75, left: 0.75, right: 0.75 },
        },
      };

      const response = await downloadPdfMutation.mutateAsync(request);

      if (response.ok && response.headers.get("content-type")?.includes("application/pdf")) {
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
        toast({ title: "Downloaded", description: "Your resume PDF has been downloaded." });
      } else {
        const result = await response.json();
        if (result.fallback && result.latex) {
          setLatexOutput(result.latex);
          setShowLatex(true);
          toast({
            title: "PDF Service Unavailable",
            description: "LaTeX code generated. Copy it and compile manually.",
            variant: "destructive",
          });
        } else {
          throw new Error(result.error || "Failed to generate PDF");
        }
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Download failed";
      toast({ title: "Download Failed", description: message, variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyLatexToClipboard = () => {
    if (latexOutput) {
      navigator.clipboard.writeText(latexOutput).then(() => {
        toast({ title: "Copied", description: "LaTeX code copied to clipboard." });
      });
    }
  };

  const openInOverleaf = () => {
    if (latexOutput) {
      const encodedLatex = encodeURIComponent(latexOutput);
      window.open(`https://www.overleaf.com/docs?snip=${encodedLatex}`, "_blank");
    }
  };

  return (
    <>
      <LoadingOverlay isGenerating={isGenerating} generationType={generationType} />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
        {/* Config column */}
        <Card className="backdrop-blur-lg bg-white/5 border-white/10 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-brand-light flex items-center gap-2 text-xl">
              <FileText className="h-5 w-5 text-brand-primary" />
              Export Resume
            </CardTitle>
            <p className="text-brand-light/60 text-sm">
              Generate a professional PDF or LaTeX document from this resume.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
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

            <ConfigurationForm
              selectedTemplate={selectedTemplate}
              setSelectedTemplate={setSelectedTemplate}
              fontSize={fontSize}
              setFontSize={setFontSize}
              colorScheme={colorScheme}
              setColorScheme={setColorScheme}
            />

            <div className="pt-4 border-t border-white/10 space-y-3">
              {/* Download PDF */}
              <Button
                onClick={downloadPdf}
                disabled={isGenerating}
                className="relative w-full h-12 bg-gradient-to-r from-brand-primary to-brand-primary/80 hover:from-brand-primary/90 hover:to-brand-primary/70 text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {isGenerating && generationType === "pdf" ? (
                  <span className="flex items-center gap-2">
                    <Loader variant="spinner" size="sm" className="text-white" />
                    Generating PDF...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Download PDF
                  </span>
                )}
              </Button>

              {/* Preview + LaTeX row */}
              <div className="flex gap-3">
                <Button
                  onClick={handlePreview}
                  disabled={isGenerating}
                  variant="outline"
                  className="flex-1 h-10 bg-white/5 border-white/20 text-brand-light hover:bg-white/10 hover:border-brand-primary/50 disabled:opacity-50 rounded-lg text-sm"
                >
                  <Eye className="h-4 w-4 mr-1.5" />
                  Preview
                </Button>
                <Button
                  onClick={generateLatex}
                  disabled={isGenerating}
                  variant="outline"
                  className="flex-1 h-10 bg-white/5 border-white/20 text-brand-light hover:bg-white/10 hover:border-brand-primary/50 disabled:opacity-50 rounded-lg text-sm"
                >
                  {isGenerating && generationType === "latex" ? (
                    <Loader variant="spinner" size="sm" className="text-brand-light mr-1.5" />
                  ) : (
                    <Code className="h-4 w-4 mr-1.5" />
                  )}
                  LaTeX
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Output column */}
        <div className="space-y-6">
          {parsedData && <ResumePreview parsedData={parsedData} />}
          {showLatex && latexOutput && (
            <LatexOutput
              latexOutput={latexOutput}
              copyLatexToClipboard={copyLatexToClipboard}
              openInOverleaf={openInOverleaf}
            />
          )}
          {!parsedData && !showLatex && (
            <div className="flex items-center justify-center h-64 rounded-xl border border-dashed border-white/10">
              <p className="text-brand-light/40 text-sm">Preview will appear here after generating</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
