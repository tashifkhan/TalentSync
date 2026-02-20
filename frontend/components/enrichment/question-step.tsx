"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, ArrowRight, AlertTriangle } from "lucide-react";
import type { EnrichmentQuestion, EnrichmentItem } from "@/types/enrichment";

interface EnrichmentQuestionStepProps {
  questions: EnrichmentQuestion[];
  items: EnrichmentItem[];
  answers: Record<string, string>;
  onAnswerChange: (questionId: string, answer: string) => void;
  onSubmit: () => void;
  onBack: () => void;
  isSubmitting: boolean;
  analysisSummary?: string | null;
}

export function EnrichmentQuestionStep({
  questions,
  items,
  answers,
  onAnswerChange,
  onSubmit,
  onBack,
  isSubmitting,
  analysisSummary,
}: EnrichmentQuestionStepProps) {
  // Group questions by item
  const questionsByItem = questions.reduce(
    (acc, question) => {
      if (!acc[question.item_id]) {
        acc[question.item_id] = [];
      }
      acc[question.item_id].push(question);
      return acc;
    },
    {} as Record<string, EnrichmentQuestion[]>
  );

  const itemMap = items.reduce(
    (acc, item) => {
      acc[item.item_id] = item;
      return acc;
    },
    {} as Record<string, EnrichmentItem>
  );

  const allAnswered = questions.every(
    (q) => answers[q.question_id]?.trim().length > 0
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* Analysis Summary */}
      {analysisSummary && (
        <div className="p-4 rounded-lg bg-brand-primary/10 border border-brand-primary/20">
          <p className="text-sm text-brand-light/80">{analysisSummary}</p>
        </div>
      )}

      {/* Questions grouped by item */}
      <div className="space-y-8 max-h-[50vh] overflow-y-auto pr-2">
        {Object.entries(questionsByItem).map(([itemId, itemQuestions]) => {
          const item = itemMap[itemId];
          if (!item) return null;

          return (
            <motion.div
              key={itemId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Item Header */}
              <div className="border-l-2 border-brand-primary pl-4">
                <h4 className="font-medium text-brand-light">{item.title}</h4>
                {item.subtitle && (
                  <p className="text-sm text-brand-light/60">{item.subtitle}</p>
                )}
                {/* Weakness indicator */}
                <div className="flex items-start gap-2 mt-2 p-2 rounded bg-amber-500/10 border border-amber-500/20">
                  <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-amber-200/80">{item.weakness_reason}</p>
                </div>
              </div>

              {/* Questions for this item */}
              <div className="space-y-4 pl-4">
                {itemQuestions.map((question, qIndex) => (
                  <div key={question.question_id} className="space-y-2">
                    <label
                      htmlFor={question.question_id}
                      className="block text-sm font-medium text-brand-light/80"
                    >
                      {question.question}
                    </label>
                    <Textarea
                      id={question.question_id}
                      value={answers[question.question_id] || ""}
                      onChange={(e) =>
                        onAnswerChange(question.question_id, e.target.value)
                      }
                      placeholder={question.placeholder || "Your answer..."}
                      className="bg-white/5 border-white/10 text-brand-light placeholder:text-brand-light/40 focus:border-brand-primary resize-none"
                      rows={3}
                    />
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex justify-between pt-4 border-t border-white/10">
        <Button
          variant="ghost"
          onClick={onBack}
          disabled={isSubmitting}
          className="text-brand-light/60 hover:text-brand-light"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button
          onClick={onSubmit}
          disabled={!allAnswered || isSubmitting}
          className="bg-brand-primary hover:bg-brand-primary/90 text-white"
        >
          Generate Enhancements
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </motion.div>
  );
}
