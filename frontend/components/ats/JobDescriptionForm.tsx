"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Briefcase,
  Link2,
  Building,
  Globe,
  FileText,
  Upload,
  CheckCircle,
} from "lucide-react";

interface JobDescriptionFormProps {
  formData: {
    jd_text: string;
    jd_link: string;
    company_name: string;
    company_website: string;
  };
  handleInputChange: (field: string, value: string) => void;
  jdFile: File | null;
  setJdFile: (file: File | null) => void;
}

type JdMode = "url" | "text" | "file";

export default function JobDescriptionForm({
  formData,
  handleInputChange,
  jdFile,
  setJdFile,
}: JobDescriptionFormProps) {
  const [isDragging, setIsDragging] = useState(false);

  const getInitialMode = (): JdMode => {
    if (formData.jd_link) return "url";
    if (jdFile) return "file";
    return "text";
  };

  const [jdMode, setJdMode] = useState<JdMode>(getInitialMode);

  const switchMode = (mode: JdMode) => {
    setJdMode(mode);
    // Clear the other fields so only one is ever sent
    if (mode !== "url") handleInputChange("jd_link", "");
    if (mode !== "text") handleInputChange("jd_text", "");
    if (mode !== "file") setJdFile(null);
  };

  const handleFileSelect = (file?: File | null) => {
    if (file) setJdFile(file);
  };

  const tabs: { key: JdMode; icon: React.ReactNode; label: string }[] = [
    { key: "url",  icon: <Link2   className="h-3 w-3" />, label: "URL"  },
    { key: "text", icon: <FileText className="h-3 w-3" />, label: "Text" },
    { key: "file", icon: <Upload   className="h-3 w-3" />, label: "File" },
  ];

  return (
    <div className="space-y-4">
      {/* Company Name (Optional) */}
      <div className="space-y-2">
        <Label
          htmlFor="company_name"
          className="text-brand-light text-sm font-medium flex items-center"
        >
          <Building className="h-4 w-4 mr-2 text-brand-primary" />
          Company Name{" "}
          <span className="text-brand-light/40 ml-1">(Optional)</span>
        </Label>
        <Input
          id="company_name"
          type="text"
          value={formData.company_name}
          onChange={(e) => handleInputChange("company_name", e.target.value)}
          placeholder="e.g., Google"
          className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-brand-light placeholder-brand-light/30 focus:outline-none focus:ring-2 focus:ring-brand-primary"
        />
      </div>

      {/* Company Website (Optional) */}
      <div className="space-y-2">
        <Label
          htmlFor="company_website"
          className="text-brand-light text-sm font-medium flex items-center"
        >
          <Globe className="h-4 w-4 mr-2 text-brand-primary" />
          Company Website{" "}
          <span className="text-brand-light/40 ml-1">(Optional)</span>
        </Label>
        <Input
          id="company_website"
          type="url"
          value={formData.company_website}
          onChange={(e) =>
            handleInputChange("company_website", e.target.value)
          }
          placeholder="https://company.com"
          className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-brand-light placeholder-brand-light/30 focus:outline-none focus:ring-2 focus:ring-brand-primary"
        />
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10" />
        </div>
      </div>

      {/* Job Description — 3-way toggle */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-brand-light text-sm font-medium flex items-center">
            <Briefcase className="h-4 w-4 mr-2 text-brand-primary" />
            Job Description
          </Label>

          {/* URL | Text | File pills */}
          <div className="flex items-center gap-1 p-0.5 rounded-lg bg-white/5 border border-white/10">
            {tabs.map(({ key, icon, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => switchMode(key)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-200 ${
                  jdMode === key
                    ? "bg-brand-primary/20 border border-brand-primary/40 text-brand-primary"
                    : "text-brand-light/50 hover:text-brand-light/80"
                }`}
              >
                {icon}
                {label}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {jdMode === "url" && (
            <motion.div
              key="url"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="space-y-1.5"
            >
              <div className="relative">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-light/40 pointer-events-none" />
                <Input
                  id="jd_link"
                  type="url"
                  value={formData.jd_link}
                  onChange={(e) =>
                    handleInputChange("jd_link", e.target.value)
                  }
                  placeholder="https://jobs.company.com/role/senior-engineer"
                  className="w-full pl-9 px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-brand-light placeholder-brand-light/30 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
              </div>
              <p className="text-brand-light/40 text-xs pl-1">
                The job description will be fetched from this URL when
                evaluating.
              </p>
            </motion.div>
          )}

          {jdMode === "text" && (
            <motion.div
              key="text"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
            >
              <Textarea
                id="jd_text"
                value={formData.jd_text}
                onChange={(e) =>
                  handleInputChange("jd_text", e.target.value)
                }
                placeholder="Paste the job description here..."
                rows={7}
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-brand-light placeholder-brand-light/30 focus:outline-none focus:ring-2 focus:ring-brand-primary resize-none"
              />
            </motion.div>
          )}

          {jdMode === "file" && (
            <motion.div
              key="file"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
            >
              <Input
                id="jd_file"
                type="file"
                accept=".pdf,.doc,.docx,.txt,.md"
                onChange={(e) =>
                  handleFileSelect(e.target.files?.[0] || null)
                }
                className="hidden"
              />
              <motion.label
                htmlFor="jd_file"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setIsDragging(false);
                  handleFileSelect(event.dataTransfer.files?.[0] || null);
                }}
                className={`relative flex items-center justify-center w-full h-44 border-2 border-dashed rounded-xl bg-gradient-to-br from-white/5 to-white/10 hover:from-brand-primary/10 hover:to-brand-primary/5 transition-all duration-500 cursor-pointer group overflow-hidden ${
                  isDragging
                    ? "border-brand-primary/60 bg-brand-primary/10"
                    : "border-white/20"
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-brand-primary/0 via-brand-primary/5 to-brand-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative z-10 text-center">
                  {jdFile ? (
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
                        {jdFile.name}
                      </p>
                      <p className="text-brand-primary text-xs font-medium">
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
                        <div className="absolute inset-0 bg-brand-primary/10 rounded-full blur-lg group-hover:bg-brand-primary/20 transition-colors duration-500" />
                        <Upload className="relative h-6 w-6 text-brand-light/60 group-hover:text-brand-primary transition-colors duration-300" />
                      </div>
                      <p className="text-brand-light text-sm font-medium mb-1">
                        Upload Job Description
                      </p>
                      <div className="flex items-center space-x-2 text-xs text-brand-light/50 mt-2">
                        {["PDF", "DOC", "TXT", "MD"].map((ext) => (
                          <span
                            key={ext}
                            className="px-2 py-1 bg-white/10 rounded-full"
                          >
                            {ext}
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.label>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
