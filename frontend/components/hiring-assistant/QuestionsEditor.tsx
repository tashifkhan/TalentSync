"use client";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { motion } from "framer-motion";

interface QuestionsEditorProps {
	questions: string[];
	addQuestion: () => void;
	removeQuestion: (index: number) => void;
	updateQuestion: (index: number, value: string) => void;
}

export default function QuestionsEditor({
	questions,
	addQuestion,
	removeQuestion,
	updateQuestion,
}: QuestionsEditorProps) {
	return (
		<Card className="backdrop-blur-xl bg-white/5 border border-white/10 shadow-2xl hover:bg-white/10 transition-all duration-500 flex-1 flex flex-col max-h-[calc(100vh-16rem)]">
			<CardHeader className="pb-4 flex-shrink-0">
				<CardTitle className="text-brand-light text-lg md:text-xl font-semibold flex items-center justify-between">
					Interview Questions
					<Button
						size="sm"
						onClick={addQuestion}
						className="bg-brand-primary/20 hover:bg-brand-primary/30 text-brand-primary border border-brand-primary/30 h-8 px-3"
					>
						<Plus className="h-3 w-3 mr-1" />
						Add
					</Button>
				</CardTitle>
			</CardHeader>
			<CardContent className="flex-1 flex flex-col overflow-hidden">
				<div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar">
					{questions.map((question, index) => (
						<motion.div
							key={index}
							initial={{ opacity: 0, x: -10 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ duration: 0.3, delay: index * 0.1 }}
							className="flex space-x-2"
						>
							<textarea
								placeholder={`Question ${index + 1}...`}
								value={question}
								onChange={(e) => updateQuestion(index, e.target.value)}
								className="flex-1 h-16 px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-brand-light placeholder:text-brand-light/50 resize-none hover:bg-white/10 transition-all duration-300 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 text-sm"
							/>
							{questions.length > 1 && (
								<Button
									size="sm"
									variant="ghost"
									onClick={() => removeQuestion(index)}
									className="text-destructive hover:text-destructive hover:bg-destructive/20 border border-destructive/20 hover:border-destructive/40 transition-all duration-300 h-8 w-8 p-0 flex-shrink-0"
								>
									<Trash2 className="h-3 w-3" />
								</Button>
							)}
						</motion.div>
					))}
					{questions.length === 0 && (
						<div className="text-center py-8">
							<p className="text-brand-light/60 mb-4 text-sm">
								No questions added yet
							</p>
							<Button
								onClick={addQuestion}
								size="sm"
								className="bg-gradient-to-r from-brand-primary to-brand-primary/80 hover:from-brand-primary/90 hover:to-brand-primary/70 text-white"
							>
								<Plus className="mr-2 h-3 w-3" />
								Add Question
							</Button>
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
