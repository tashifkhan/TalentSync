import { FileText, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface LatexOutputProps {
	latexOutput: string;
	copyLatexToClipboard: () => void;
	openInOverleaf: () => void;
}

export default function LatexOutput({
	latexOutput,
	copyLatexToClipboard,
	openInOverleaf,
}: LatexOutputProps) {
	if (!latexOutput) {
		return null;
	}

	return (
		<Card className="relative backdrop-blur-lg bg-white/5 border-white/10 shadow-2xl overflow-hidden">
			<CardHeader className="pb-4">
				<CardTitle className="text-brand-light text-xl font-semibold flex items-center gap-2">
					<FileText className="h-5 w-5 text-brand-primary" />
					LaTeX Output
				</CardTitle>
				<p className="text-brand-light/60 text-sm">
					Generated LaTeX code for your resume
				</p>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="flex gap-2">
					<Button
						onClick={copyLatexToClipboard}
						variant="outline"
						size="sm"
						className="bg-white/5 border-white/20 text-brand-light hover:bg-white/10 hover:border-brand-primary/50"
					>
						<Copy className="h-4 w-4 mr-2" />
						Copy LaTeX
					</Button>
					<Button
						onClick={openInOverleaf}
						variant="outline"
						size="sm"
						className="bg-white/5 border-white/20 text-brand-light hover:bg-white/10 hover:border-brand-primary/50"
					>
						Open in Overleaf
					</Button>
				</div>

				<textarea
					value={latexOutput}
					readOnly
					className="w-full h-96 p-4 text-xs font-mono bg-black/20 border border-white/20 rounded-lg resize-none focus:outline-none text-brand-light placeholder-brand-light/40"
				/>

				<div className="text-sm text-brand-light/60 bg-white/5 rounded-lg p-4 border border-white/10">
					<p className="font-medium text-brand-light mb-2">
						To compile manually:
					</p>
					<ol className="list-decimal list-inside space-y-1">
						<li>Copy the LaTeX code above</li>
						<li>
							Go to{" "}
							<a
								href="https://overleaf.com"
								target="_blank"
								rel="noopener noreferrer"
								className="text-brand-primary hover:underline"
							>
								Overleaf.com
							</a>
						</li>
						<li>Create a new document and paste the code</li>
						<li>Click "Recompile" to generate your PDF</li>
					</ol>
				</div>
			</CardContent>
		</Card>
	);
}
