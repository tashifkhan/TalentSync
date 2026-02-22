"use client";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  FileText,
  Copy,
  Download,
  Edit,
  RefreshCw,
  Wand2,
} from "lucide-react";
import { motion } from "framer-motion";
import { Loader } from "@/components/ui/loader";
import MarkdownRenderer from "@/components/ui/markdown-renderer";

interface GeneratedLetterPanelProps {
  generatedLetter: {
    body: string;
    requestId?: string;
    responseId?: string;
  } | null;
  editMode: boolean;
  setEditMode: (mode: boolean) => void;
  editInstructions: string;
  setEditInstructions: (instructions: string) => void;
  isEditing: boolean;
  editCoverLetter: () => void;
  copyToClipboard: (text: string) => void;
  downloadAsText: () => void;
}

export default function GeneratedLetterPanel({
  generatedLetter,
  editMode,
  setEditMode,
  editInstructions,
  setEditInstructions,
  isEditing,
  editCoverLetter,
  copyToClipboard,
  downloadAsText,
}: GeneratedLetterPanelProps) {
  return (
    <Card className="backdrop-blur-lg bg-white/5 border-white/10 shadow-2xl h-fit sticky top-4">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-brand-light text-xl sm:text-2xl font-semibold flex items-center">
              <FileText className="mr-2 h-5 w-5 text-brand-primary" />
              Generated Cover Letter
            </CardTitle>
            <p className="text-brand-light/60 text-sm mt-1">
              Your personalized cover letter will appear here
            </p>
          </div>
          {generatedLetter && (
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setEditMode(!editMode)}
                className="text-brand-primary hover:text-brand-primary/80 hover:bg-white/10 rounded-lg p-2"
                title={editMode ? "Cancel edit" : "Edit cover letter"}
              >
                {editMode ? (
                  <RefreshCw className="h-4 w-4" />
                ) : (
                  <Edit className="h-4 w-4" />
                )}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyToClipboard(generatedLetter.body)}
                className="text-brand-primary hover:text-brand-primary/80 hover:bg-white/10 rounded-lg p-2"
                title="Copy to clipboard"
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={downloadAsText}
                className="text-brand-primary hover:text-brand-primary/80 hover:bg-white/10 rounded-lg p-2"
                title="Download as text"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {generatedLetter ? (
          <div className="space-y-6">
            {/* Edit Mode */}
            {editMode && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4 p-4 bg-brand-primary/10 border border-brand-primary/20 rounded-xl"
              >
                <div className="flex items-center space-x-2 mb-3">
                  <Wand2 className="h-4 w-4 text-brand-primary" />
                  <Label className="text-brand-light text-sm font-semibold">
                    Edit Instructions
                  </Label>
                </div>
                <textarea
                  placeholder="Describe how you want to modify the cover letter (e.g., 'Make it more formal', 'Add emphasis on Python skills', 'Shorten the content')..."
                  value={editInstructions}
                  onChange={(e) => setEditInstructions(e.target.value)}
                  className="w-full h-24 px-3 py-3 bg-white/5 border border-white/20 rounded-lg text-brand-light placeholder:text-brand-light/50 resize-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
                />
                <div className="flex space-x-3">
                  <Button
                    onClick={editCoverLetter}
                    disabled={isEditing || !editInstructions.trim()}
                    className="bg-brand-primary hover:bg-brand-primary/80 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 disabled:cursor-not-allowed"
                  >
                    {isEditing ? (
                      <>
                        <Loader variant="spinner" size="sm" className="mr-2" />
                        Editing...
                      </>
                    ) : (
                      <>
                        <Wand2 className="mr-2 h-4 w-4" />
                        Apply Changes
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => {
                      setEditMode(false);
                      setEditInstructions("");
                    }}
                    variant="ghost"
                    className="text-brand-light/70 hover:text-brand-light hover:bg-white/10"
                  >
                    Cancel
                  </Button>
                </div>
              </motion.div>
            )}

            <div className="space-y-3">
              <Label className="text-brand-light text-sm font-semibold">
                Cover Letter:
              </Label>
              <div className="p-4 bg-white/5 border border-white/20 rounded-xl max-h-[500px] overflow-y-auto">
                <MarkdownRenderer content={generatedLetter.body} className="text-sm" />
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/5 rounded-2xl mb-4">
              <FileText className="h-8 w-8 text-brand-light/30" />
            </div>
            <p className="text-brand-light/60 text-base max-w-sm mx-auto leading-relaxed">
              Fill out the form and click "Generate Cover Letter" to see your
              personalized cover letter here.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
