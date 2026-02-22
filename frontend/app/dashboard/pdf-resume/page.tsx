"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FileText, Upload } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { ResumeSelector } from "@/components/shared/resume-selector";

export default function PdfResumePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  const handleResumeSelect = (resumeId: string) => {
    router.push(`/dashboard/analysis/${resumeId}?tab=export`);
  };

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/resumes/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload resume");
      }

      const data = await response.json();
      if (data.id) {
        toast({ title: "Resume uploaded", description: "Redirecting to workspace..." });
        router.push(`/dashboard/analysis/${data.id}?tab=export`);
      } else {
        throw new Error("No resume ID returned");
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Upload failed";
      toast({ title: "Upload Failed", description: message, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
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
              className="text-brand-light hover:text-brand-primary hover:bg-white/5"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Back to Dashboard</span>
              <span className="sm:hidden">Back</span>
            </Button>
          </Link>
        </motion.div>

        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-primary/10 rounded-2xl mb-4">
              <FileText className="h-8 w-8 text-brand-primary" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-brand-light mb-3">
              PDF Resume Generator
            </h1>
            <p className="text-brand-light/70 text-base sm:text-lg max-w-xl mx-auto">
              Select a saved resume or upload a new one to generate a professional PDF or LaTeX document.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Card className="backdrop-blur-lg bg-white/5 border-white/10 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-brand-light text-xl font-semibold">
                  Choose a Resume
                </CardTitle>
                <p className="text-brand-light/60 text-sm">
                  Select an existing resume to open it in the workspace, or upload a new file.
                </p>
              </CardHeader>
              <CardContent>
                <ResumeSelector
                  mode="card"
                  allowUpload
                  onSelect={handleResumeSelect}
                  onFileUpload={handleFileUpload}
                />

                {isUploading && (
                  <div className="mt-4 flex items-center gap-2 text-brand-light/60 text-sm">
                    <Upload className="h-4 w-4 animate-bounce" />
                    Uploading and analyzing your resume...
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
