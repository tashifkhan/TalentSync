"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Briefcase,
  Link as LinkIcon,
  Building,
  Globe,
  FileText,
  Upload,
  CheckCircle,
} from "lucide-react";
import { motion } from "framer-motion";

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

export default function JobDescriptionForm({
	formData,
	handleInputChange,
	jdFile,
	setJdFile,
}: JobDescriptionFormProps) {
	const [isDragging, setIsDragging] = useState(false);

	const handleFileSelect = (file?: File | null) => {
		if (file) {
			setJdFile(file);
		}
	};

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
          onChange={(e) => handleInputChange("company_website", e.target.value)}
          placeholder="https://company.com"
          className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-brand-light placeholder-brand-light/30 focus:outline-none focus:ring-2 focus:ring-brand-primary"
        />
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10"></div>
        </div>
      </div>

      {/* Job Description Text */}
      <div className="space-y-2">
        <Label
          htmlFor="jd_text"
          className="text-brand-light text-sm font-medium flex items-center"
        >
          <Briefcase className="h-4 w-4 mr-2 text-brand-primary" />
          Job Description (Text)
        </Label>
        <Textarea
          id="jd_text"
          value={formData.jd_text}
          onChange={(e) => handleInputChange("jd_text", e.target.value)}
          placeholder="Paste the job description here..."
          rows={6}
          className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-brand-light placeholder-brand-light/30 focus:outline-none focus:ring-2 focus:ring-brand-primary resize-none"
        />
      </div>

      {/* OR Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10"></div>
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="px-2 bg-surface text-brand-light/60">OR</span>
        </div>
      </div>

      {/* Job Description File */}
      <div className="space-y-2">
        <Label
          htmlFor="jd_file"
          className="text-brand-light text-sm font-medium flex items-center"
        >
          <FileText className="h-4 w-4 mr-2 text-brand-primary" />
          Job Description (File)
        </Label>
        <div className="relative">
					<Input
						id="jd_file"
						type="file"
						accept=".pdf,.doc,.docx,.txt,.md"
						onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
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
						className={`relative flex items-center justify-center w-full h-28 border-2 border-dashed rounded-xl bg-gradient-to-br from-white/5 to-white/10 hover:from-brand-primary/10 hover:to-brand-primary/5 transition-all duration-500 cursor-pointer group overflow-hidden ${
							isDragging
								? "border-brand-primary/60 bg-brand-primary/10"
								: "border-white/20"
						}`}
					>
            {/* Animated background gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-brand-primary/0 via-brand-primary/5 to-brand-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

            <div className="relative z-10 text-center">
              {jdFile ? (
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
                    {jdFile.name}
                  </p>
                  <p className="text-brand-primary text-xs font-medium">
                    ✓ Ready for evaluation
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
                    Upload Job Description
                  </p>
                  <div className="flex items-center space-x-2 text-xs text-brand-light/50 mt-2">
                    {["pdf", "doc", "txt", "md"].map((file) => {
                      return (
                        <span
                          className="px-2 py-1 bg-white/10 rounded-full"
                          key={file}
                        >
                          {file.toUpperCase()}
                        </span>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </div>
          </motion.label>
        </div>
      </div>

      {/* OR Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10"></div>
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="px-2 bg-surface text-brand-light/60">OR</span>
        </div>
      </div>

      {/* Job Description Link */}
      <div className="space-y-2">
        <Label
          htmlFor="jd_link"
          className="text-brand-light text-sm font-medium flex items-center"
        >
          <LinkIcon className="h-4 w-4 mr-2 text-brand-primary" />
          Job Description (Link)
        </Label>
        <Input
          id="jd_link"
          type="url"
          value={formData.jd_link}
          onChange={(e) => handleInputChange("jd_link", e.target.value)}
          placeholder="https://example.com/job-posting"
          className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-brand-light placeholder-brand-light/30 focus:outline-none focus:ring-2 focus:ring-brand-primary"
        />
      </div>
    </div>
  );
}
