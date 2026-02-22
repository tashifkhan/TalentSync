"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Loader } from "@/components/ui/loader";
import { PageLoader } from "@/components/ui/page-loader";
import LoadingOverlay from "@/components/cold-mail/LoadingOverlay";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
	ArrowLeft,
	Copy,
	Download,
	Hash,
	Github,
	MessageSquare,
	Settings,
	Sparkles,
} from "lucide-react";
import MarkdownRenderer from "@/components/ui/markdown-renderer";
import { useGenerateLinkedInPosts } from "@/hooks/queries";
import { GeneratedPost } from "@/services/linkedin.service";

export default function LinkedInPostsGenerator() {
	const { toast } = useToast();
	const [isPageLoading, setIsPageLoading] = useState(true);
	const [posts, setPosts] = useState<GeneratedPost[]>([]);
	const [form, setForm] = useState({
		topic: "",
		tone: "Professional",
		audience: "",
		length: "Medium",
		hashtags_option: "suggest",
		cta_text: "",
		mimic_examples: "",
		language: "",
		post_count: 3,
		emoji_level: 1,
		github_project_url: "",
		enable_research: true,
	});

	const update = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

	const generatePostsMutation = useGenerateLinkedInPosts();
	const isGenerating = generatePostsMutation.isPending;

	useEffect(() => {
		// Small delay to allow for potential future data prefetch (mirrors cold-mail pattern)
		const t = setTimeout(() => setIsPageLoading(false), 120);
		return () => clearTimeout(t);
	}, []);

	const generate = () => {
		if (!form.topic.trim()) {
			toast({
				title: "Topic required",
				variant: "destructive",
				description: "Please enter a topic.",
			});
			return;
		}
		setPosts([]);

		generatePostsMutation.mutate(form, {
			onSuccess: (data) => {
				if (!data.success) {
					throw new Error(data.message || "Failed to generate posts");
				}
				setPosts(data.posts);
				toast({
					title: "Posts generated",
					description: `${data.posts.length} posts ready.`,
				});
			},
			onError: (e) => {
				toast({
					title: "Generation failed",
					description: e.message,
					variant: "destructive",
				});
			},
		});
	};

	const processPostContent = (post: GeneratedPost) => {
		// Extract hashtags from the last paragraph and move them to hashtags array
		const paragraphs = post.text.split("\n\n").filter((p) => p.trim());
		const lastParagraph = paragraphs[paragraphs.length - 1];

		// Find hashtags in the last paragraph
		const hashtagRegex = /#[a-zA-Z0-9_]+/g;
		const extractedHashtags = lastParagraph?.match(hashtagRegex) || [];

		let cleanedText = post.text;
		let updatedHashtags = [...(post.hashtags || [])];

		if (extractedHashtags.length > 0) {
			// Remove hashtags from the last paragraph
			const cleanedLastParagraph = lastParagraph
				.replace(hashtagRegex, "")
				.replace(/\s+/g, " ")
				.trim();

			// Reconstruct the text without hashtags in the last paragraph
			const otherParagraphs = paragraphs.slice(0, -1);
			if (cleanedLastParagraph) {
				cleanedText = [...otherParagraphs, cleanedLastParagraph].join("\n\n");
			} else {
				cleanedText = otherParagraphs.join("\n\n");
			}

			// Add extracted hashtags to the hashtags array (remove # prefix for consistency)
			const newHashtags = extractedHashtags.map((tag) => tag.replace("#", ""));
			updatedHashtags = Array.from(
				new Set([...updatedHashtags, ...newHashtags]),
			); // Remove duplicates
		}

		return {
			...post,
			text: cleanedText.trim(),
			hashtags: updatedHashtags,
		};
	};

	const copyPost = async (p: GeneratedPost) => {
		try {
			const text = `${p.text}\n\n${p.hashtags
				?.map((h) => `#${h.replace(/^#/, "")}`)
				.join(" ")}${p.cta_suggestion ? `\n\nCTA: ${p.cta_suggestion}` : ""}`;
			await navigator.clipboard.writeText(text.trim());
			toast({ title: "Copied", description: "Post copied to clipboard" });
		} catch {
			toast({ title: "Copy failed", variant: "destructive" });
		}
	};

	const downloadAll = () => {
		if (!posts.length) return;
		const content = posts
			.map(
				(p, i) =>
					`Post ${i + 1}:\n${p.text}\nHashtags: ${(p.hashtags || [])
						.map((h) => `#${h.replace(/^#/, "")}`)
						.join(" ")}\n${
						p.cta_suggestion ? `CTA: ${p.cta_suggestion}` : ""
					}\n`,
			)
			.join("\n-------------------------\n");
		const blob = new Blob([content], { type: "text/markdown" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "linkedin-posts.md";
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	};

	return (
		<>
			<PageLoader
				isPageLoading={isPageLoading}
				text="Loading LinkedIn Post Generator..."
			/>
			{!isPageLoading && (
				<div className="min-h-screen">
					{/* Mobile-optimized container */}
					<div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
						{/* Back button - better mobile positioning */}
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
							{/* Modern header with better mobile typography */}
							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.8, delay: 0.2 }}
								className="text-center mb-8 sm:mb-12"
							>
								<div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-brand-primary/10 rounded-2xl mb-4 sm:mb-6">
									<Hash className="h-8 w-8 sm:h-10 sm:w-10 text-brand-primary" />
								</div>
								<div className="flex items-center justify-center gap-3 mb-3 sm:mb-4">
									<h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-brand-light leading-tight">
										LinkedIn Post Generator
									</h1>
									<Badge className="bg-brand-primary/20 text-brand-primary border-brand-primary/30 text-xs font-medium">
										BETA
									</Badge>
								</div>
								<p className="text-brand-light/70 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed px-4">
									Create engaging LinkedIn posts with AI assistance to build
									your professional network.
								</p>
							</motion.div>

							{/* Responsive grid - stack on mobile */}
							<div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
								{/* Input Form - Modern design */}
								<motion.div
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ duration: 0.8, delay: 0.4 }}
									className="order-1"
								>
									<Card className="relative backdrop-blur-lg bg-white/5 border-white/10 shadow-2xl overflow-hidden">
										<CardHeader className="pb-4">
											<CardTitle className="text-brand-light text-xl sm:text-2xl font-semibold">
												Post Parameters
											</CardTitle>
											<p className="text-brand-light/60 text-sm">
												Configure your LinkedIn post generation settings
											</p>
										</CardHeader>
										<CardContent className="space-y-6">
											{/* Section: Core Topic & Audience */}
											<div className="space-y-4">
												<div className="flex items-center gap-3 pb-3 border-b border-white/10">
													<div className="flex items-center justify-center w-8 h-8 bg-brand-primary/10 rounded-lg">
														<MessageSquare className="h-4 w-4 text-brand-primary" />
													</div>
													<div>
														<h3 className="text-brand-light text-base font-semibold">
															Content
														</h3>
														<p className="text-brand-light/60 text-xs">
															Define your post topic and style
														</p>
													</div>
												</div>
												<div>
													<Label className="mb-1.5 block text-brand-light text-sm font-medium">
														Topic <span className="text-red-400">*</span>
													</Label>
													<Input
														value={form.topic}
														onChange={(e) => update("topic", e.target.value)}
														placeholder="e.g. Remote team productivity"
														className="bg-white/5 border-white/20 text-brand-light placeholder:text-brand-light/40 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/50"
													/>
												</div>
												<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
													<div>
														<Label className="mb-1.5 block text-brand-light text-sm font-medium">
															Tone
														</Label>
														<Select
															value={form.tone}
															onValueChange={(value) => update("tone", value)}
														>
														<SelectTrigger className="bg-white/5 border-white/20 text-brand-light hover:bg-white/10 hover:border-brand-primary/50 focus:ring-0 focus:border-brand-primary h-10 transition-colors">
															<SelectValue placeholder="Select tone" />
														</SelectTrigger>
														<SelectContent className="bg-brand-dark border-white/20 shadow-lg">
																{[
																	"Professional",
																	"Conversational",
																	"Inspirational",
																	"Analytical",
																	"Friendly",
																].map((t) => (
																	<SelectItem
																		key={t}
																		value={t}
																		className="text-brand-light focus:bg-brand-primary/20 cursor-pointer"
																	>
																		{t}
																	</SelectItem>
																))}
															</SelectContent>
														</Select>
													</div>
													<div>
														<Label className="mb-1.5 block text-brand-light text-sm font-medium">
															Length
														</Label>
														<Select
															value={form.length}
															onValueChange={(value) => update("length", value)}
														>
														<SelectTrigger className="bg-white/5 border-white/20 text-brand-light hover:bg-white/10 hover:border-brand-primary/50 focus:ring-0 focus:border-brand-primary h-10 transition-colors">
															<SelectValue placeholder="Select length" />
														</SelectTrigger>
														<SelectContent className="bg-brand-dark border-white/20 shadow-lg">
																{["Short", "Medium", "Long", "Any"].map((l) => (
																	<SelectItem
																		key={l}
																		value={l}
																		className="text-brand-light focus:bg-brand-primary/20 cursor-pointer"
																	>
																		{l}
																	</SelectItem>
																))}
															</SelectContent>
														</Select>
													</div>
												</div>
												<div>
													<Label className="mb-1.5 block text-brand-light text-sm font-medium">
														Target Audience
													</Label>
													<Input
														value={form.audience}
														onChange={(e) => update("audience", e.target.value)}
														placeholder="e.g. Developers, Engineering Managers"
														className="bg-white/5 border-white/20 text-brand-light placeholder:text-brand-light/40 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/50"
													/>
												</div>
											</div>

											{/* Section: Advanced Settings */}
											<div className="space-y-4">
												<div className="flex items-center gap-3 pb-3 border-b border-white/10">
													<div className="flex items-center justify-center w-8 h-8 bg-brand-primary/10 rounded-lg">
														<Settings className="h-4 w-4 text-brand-primary" />
													</div>
													<div>
														<h3 className="text-brand-light text-base font-semibold">
															Settings
														</h3>
														<p className="text-brand-light/60 text-xs">
															Fine-tune your post generation
														</p>
													</div>
												</div>
												<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
													<div>
														<Label className="mb-1.5 block text-brand-light text-sm font-medium">
															Hashtags
														</Label>
														<Select
															value={form.hashtags_option}
															onValueChange={(value) =>
																update("hashtags_option", value)
															}
														>
														<SelectTrigger className="bg-white/5 border-white/20 text-brand-light hover:bg-white/10 hover:border-brand-primary/50 focus:ring-0 focus:border-brand-primary h-10 transition-colors">
															<SelectValue placeholder="Hashtag option" />
														</SelectTrigger>
														<SelectContent className="bg-brand-dark border-white/20 shadow-lg">
																<SelectItem value="suggest" className="text-brand-light focus:bg-brand-primary/20 cursor-pointer">
																	Suggest
																</SelectItem>
																<SelectItem value="none" className="text-brand-light focus:bg-brand-primary/20 cursor-pointer">
																	None
																</SelectItem>
															</SelectContent>
														</Select>
													</div>
													<div>
														<Label className="mb-1.5 block text-brand-light text-sm font-medium">
															Language
														</Label>
														<Input
															value={form.language}
															onChange={(e) => update("language", e.target.value)}
															placeholder="Auto (e.g. en, es)"
															className="bg-white/5 border-white/20 text-brand-light placeholder:text-brand-light/40 focus:border-brand-primary h-10"
														/>
													</div>
												</div>
												<div className="grid grid-cols-2 gap-4">
													<div>
														<div className="flex items-center justify-between mb-2">
															<Label className="text-brand-light text-sm font-medium">
																Post Count
															</Label>
															<span className="text-brand-primary text-sm font-medium">{form.post_count}</span>
														</div>
														<Slider
															value={[form.post_count]}
															min={1}
															max={5}
															step={1}
															onValueChange={(v) => update("post_count", v[0])}
														/>
													</div>
													<div>
														<div className="flex items-center justify-between mb-2">
															<Label className="text-brand-light text-sm font-medium">
																Emoji Level
															</Label>
															<span className="text-brand-primary text-sm font-medium">{form.emoji_level}</span>
														</div>
														<Slider
															value={[form.emoji_level]}
															min={0}
															max={3}
															step={1}
															onValueChange={(v) => update("emoji_level", v[0])}
														/>
													</div>
												</div>
												<div className="flex items-center justify-between py-3 px-4 bg-white/5 rounded-lg border border-white/10">
													<div>
														<p className="text-sm font-medium text-brand-light">
															Enable Research
														</p>
														<p className="text-xs text-brand-light/60">
															Enhance with current insights
														</p>
													</div>
													<Switch
														checked={form.enable_research}
														onCheckedChange={(checked) =>
															update("enable_research", checked)
														}
														className="data-[state=checked]:bg-brand-primary"
													/>
												</div>
											</div>

											{/* Section: Optional Enhancements */}
											<div className="space-y-4">
												<div className="flex items-center gap-3 pb-3 border-b border-white/10">
													<div className="flex items-center justify-center w-8 h-8 bg-brand-primary/10 rounded-lg">
														<Sparkles className="h-4 w-4 text-brand-primary" />
													</div>
													<div>
														<h3 className="text-brand-light text-base font-semibold">
															Enhancements
														</h3>
														<p className="text-brand-light/60 text-xs">
															Optional extras for better posts
														</p>
													</div>
												</div>
												<div>
													<Label className="mb-1.5 block text-brand-light text-sm font-medium">
														CTA Text
													</Label>
													<Input
														value={form.cta_text}
														onChange={(e) => update("cta_text", e.target.value)}
														placeholder="e.g. Share your experience below!"
														className="bg-white/5 border-white/20 text-brand-light placeholder:text-brand-light/40 focus:border-brand-primary"
													/>
												</div>
												<div>
													<Label className="mb-1.5 flex items-center gap-2 text-brand-light text-sm font-medium">
														GitHub Project
														<Github className="h-3.5 w-3.5 text-brand-primary" />
													</Label>
													<Input
														value={form.github_project_url}
														onChange={(e) =>
															update("github_project_url", e.target.value)
														}
														placeholder="https://github.com/your/repo"
														className="bg-white/5 border-white/20 text-brand-light placeholder:text-brand-light/40 focus:border-brand-primary"
													/>
												</div>
												<div>
													<Label className="mb-1.5 block text-brand-light text-sm font-medium">
														Style Reference
													</Label>
													<Textarea
														value={form.mimic_examples}
														onChange={(e) =>
															update("mimic_examples", e.target.value)
														}
														placeholder="Paste a post snippet to emulate style..."
														className="bg-white/5 border-white/20 text-brand-light placeholder:text-brand-light/40 focus:border-brand-primary min-h-[70px] resize-none"
													/>
												</div>
											</div>

											{/* Generate Button */}
											<div className="pt-4 border-t border-white/10">
												<motion.div
													whileHover={{ scale: 1.01 }}
													whileTap={{ scale: 0.99 }}
												>
													<Button
														onClick={generate}
														disabled={isGenerating || !form.topic.trim()}
														className="relative w-full h-12 bg-gradient-to-r from-brand-primary to-brand-primary/80 hover:from-brand-primary/90 hover:to-brand-primary/70 text-white font-semibold rounded-xl transition-all duration-300 overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
													>
														{isGenerating && (
															<div className="absolute inset-0 bg-gradient-to-r from-brand-primary/20 via-brand-primary/40 to-brand-primary/20 animate-pulse" />
														)}
														<div className="relative z-10 flex items-center justify-center">
															{isGenerating ? (
																<div className="flex items-center space-x-2">
																	<Loader
																		variant="spinner"
																		size="sm"
																		className="text-white"
																	/>
																	<span className="text-sm font-medium">
																		Generating Posts...
																	</span>
																</div>
															) : (
																<>
																	<Hash className="mr-2 h-4 w-4" />
																	<span>Generate Posts</span>
																</>
															)}
														</div>
													</Button>
												</motion.div>
											</div>
										</CardContent>
									</Card>
								</motion.div>

								<motion.div
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ duration: 0.8, delay: 0.6 }}
									className="order-2"
								>
									<Card className="relative backdrop-blur-lg bg-white/5 border-white/10 shadow-2xl overflow-hidden">
										<CardHeader className="flex flex-row items-center justify-between pb-6">
											<div>
												<CardTitle className="text-brand-light text-xl sm:text-2xl font-semibold mb-2 flex items-center gap-3">
													Generated Posts
													{posts.length > 0 && (
														<Badge
															variant="secondary"
															className="bg-brand-primary/20 text-brand-primary border-brand-primary/40 text-xs"
														>
															{posts.length} post{posts.length !== 1 ? "s" : ""}
														</Badge>
													)}
												</CardTitle>
												<p className="text-brand-light/60 text-sm">
													{posts.length > 0
														? "Your AI-crafted LinkedIn posts are ready"
														: "Generated posts will appear here"}
												</p>
											</div>
											<div className="flex gap-2">
												<Button
													variant="outline"
													size="sm"
													disabled={!posts.length}
													onClick={downloadAll}
													className="border-brand-primary/50 text-brand-primary hover:bg-brand-primary/10 backdrop-blur-sm transition-all duration-200 hover:scale-105 disabled:opacity-50"
												>
													<Download className="h-4 w-4 mr-1" />
													<span className="hidden sm:inline">All</span>
												</Button>
											</div>
										</CardHeader>
										<CardContent className="space-y-6">
											{!posts.length && !isGenerating && (
												<div className="text-sm text-text-placeholder/80 p-8 border border-dashed border-brand-primary/30 rounded-xl text-center bg-background-overlay/20 backdrop-blur-sm">
													<div className="flex flex-col items-center space-y-3">
														<Hash className="h-8 w-8 text-brand-primary/50" />
														<div>
															<p className="font-medium text-brand-light/80">
																No posts yet
															</p>
															<p className="text-xs text-text-placeholder/70 mt-1">
																Configure parameters then click Generate
															</p>
														</div>
													</div>
												</div>
											)}
											<AnimatePresence>
												{isGenerating && (
													<motion.div
														initial={{ opacity: 0, scale: 0.95 }}
														animate={{ opacity: 1, scale: 1 }}
														exit={{ opacity: 0, scale: 0.95 }}
														className="flex items-center gap-4 text-sm text-text-placeholder p-6 border border-brand-primary/30 rounded-xl bg-background-overlay/30 backdrop-blur-sm"
													>
														<div className="flex items-center space-x-3">
															<Loader variant="pulse" size="sm" />
															<div className="animate-spin rounded-full h-4 w-4 border-2 border-brand-primary/30 border-t-brand-primary"></div>
														</div>
														<div>
															<p className="font-medium text-brand-light/90">
																Generating posts...
															</p>
															<p className="text-xs text-text-placeholder/70 mt-0.5">
																AI is crafting your LinkedIn content
															</p>
														</div>
													</motion.div>
												)}
											</AnimatePresence>
											<div className="space-y-6">
												{posts.map((p, i) => {
													const processedPost = processPostContent(p);
													return (
														<motion.div
															key={i}
															initial={{ opacity: 0, y: 12 }}
															animate={{ opacity: 1, y: 0 }}
															transition={{ duration: 0.4, delay: i * 0.1 }}
															className="group bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-brand-primary/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-brand-primary/40 space-y-4"
														>
															<div className="flex items-center justify-between mb-4">
																<div className="flex items-center gap-3">
																	<div className="flex items-center justify-center w-8 h-8 bg-brand-primary/10 rounded-lg">
																		<span className="text-sm font-bold text-brand-primary">
																			{i + 1}
																		</span>
																	</div>
																	<h3 className="text-sm font-semibold tracking-wide uppercase text-brand-primary/90">
																		POST {i + 1}
																	</h3>
																</div>
																<Button
																	size="sm"
																	variant="outline"
																	onClick={() => copyPost(processedPost)}
																	className="opacity-0 group-hover:opacity-100 transition-all duration-200 border-brand-primary/50 text-brand-primary hover:bg-brand-primary/10 hover:border-brand-primary backdrop-blur-sm hover:scale-105"
																>
																	<Copy className="h-4 w-4 mr-1.5" />
																	<span className="text-xs">Copy</span>
																</Button>
															</div>

															<div className="bg-background-overlay/40 rounded-lg p-4 border border-brand-primary/10">
																<p className="whitespace-pre-wrap text-brand-light text-sm leading-relaxed font-medium">
																	{processedPost.text}
																</p>
															</div>

															{processedPost.hashtags &&
																processedPost.hashtags.length > 0 && (
																	<div className="flex flex-wrap gap-2 pt-2">
																		{processedPost.hashtags.map((h, idx) => (
																			<Badge
																				key={idx}
																				variant="outline"
																				className="bg-brand-primary/10 border-brand-primary/40 text-brand-primary hover:bg-brand-primary/20 text-xs font-medium px-2.5 py-1 transition-colors duration-200"
																			>
																				#{h.replace(/^#/, "")}
																			</Badge>
																		))}
																	</div>
																)}

															{processedPost.cta_suggestion && (
																<div className="bg-surface/60 rounded-lg p-3">
																	<p className="text-xs font-medium text-brand-primary/90 mb-1">
																		CTA SUGGESTION
																	</p>
																	<div className="text-sm text-brand-light/90 italic">
																		<MarkdownRenderer content={processedPost.cta_suggestion} className="text-sm" />
																	</div>
																</div>
															)}

															{processedPost.sources &&
																processedPost.sources.length > 0 && (
																	<div className="bg-surface/40 rounded-lg p-3 border border-brand-primary/10">
																		<p className="text-xs font-semibold text-brand-primary/90 mb-2 uppercase tracking-wide">
																			Research Sources
																		</p>
																		<ul className="space-y-1.5">
																			{processedPost.sources
																				.slice(0, 3)
																				.map((s, idx) => (
																					<li
																						key={idx}
																						className="flex items-start gap-2"
																					>
																						<div className="w-1.5 h-1.5 bg-brand-primary/60 rounded-full mt-2 flex-shrink-0"></div>
																						<a
																							href={s.link}
																							target="_blank"
																							rel="noopener noreferrer"
																							className="text-xs text-brand-light/80 hover:text-brand-primary transition-colors duration-200 underline decoration-dotted underline-offset-2 line-clamp-2"
																						>
																							{s.title}
																						</a>
																					</li>
																				))}
																		</ul>
																	</div>
																)}
														</motion.div>
													);
												})}
											</div>
										</CardContent>
									</Card>
								</motion.div>
							</div>
						</div>
					</div>
				</div>
			)}
			<LoadingOverlay
				isGenerating={isGenerating}
				isEditing={false}
				generateTitle="Generating LinkedIn Posts"
				generateDescription="AI is crafting engaging LinkedIn posts based on your parameters..."
			/>
		</>
	);
}
