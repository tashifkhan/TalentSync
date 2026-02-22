"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Download,
  Star,
  Briefcase,
  GraduationCap,
  Code,
  Languages,
  FolderOpen,
  Loader2,
  BookOpen,
  Users,
  Award,
  Trophy,
  LinkedinIcon,
  GithubIcon,
  PenBox,
  ExternalLink,
  Sparkles,
  RefreshCw,
  Wand2,
  FileText,
  FileDown,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { renderMarkdownInline } from "@/lib/markdown-renderer";
import MarkdownRenderer from "@/components/ui/markdown-renderer";
import { useResume } from "@/hooks/queries";
import { EnrichmentModal } from "@/components/enrichment";
import { RegenerateDialog } from "@/components/regeneration";
import { JDEditPanel } from "@/components/jd-editor/jd-edit-panel";
import ExportTab from "@/components/pdf-resume/ExportTab";
import { ResumeEditorTab } from "@/components/resume-editor/resume-editor-tab";
import type { SelectableItem } from "@/types/enrichment";
import type { JDEditResponse } from "@/types/jd-editor";

type WorkspaceTab =
  | "overview"
  | "edit"
  | "enrich"
  | "improve-by-jd"
  | "regenerate"
  | "export";

export default function AnalysisPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  const { data: analysisData, isLoading, error, refetch } = useResume(id);

  // Derive active tab from ?tab= query param; default to "overview"
  const initialTab = (searchParams.get("tab") as WorkspaceTab | null) ?? "overview";
  const [activeTab, setActiveTab] = useState<WorkspaceTab>(initialTab);

  // Modal states (enrichment + regenerate still use modals for now)
  const [isEnrichmentOpen, setIsEnrichmentOpen] = useState(false);
  const [isRegenerateOpen, setIsRegenerateOpen] = useState(false);

  // Pre-fill JD params from URL (from ATS page)
  const jdParam = searchParams.get("jd") ?? "";
  const jdUrlParam = searchParams.get("jdUrl") ?? "";
  const companyParam = searchParams.get("company") ?? "";

  // Build selectable items for regeneration — must be before any early returns
  const selectableItems: SelectableItem[] = useMemo(() => {
    const items: SelectableItem[] = [];
    const analysis = analysisData?.analysis;
    if (!analysis) return items;
    if (analysis.workExperience) {
      analysis.workExperience.forEach((work: any, index: number) => {
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
    if (analysis.projects) {
      analysis.projects.forEach((project: any, index: number) => {
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
    if (analysis.publications) {
      analysis.publications.forEach((pub: any, index: number) => {
        const subtitleParts: string[] = [];
        if (pub.journal_conference) subtitleParts.push(pub.journal_conference);
        if (pub.year) subtitleParts.push(pub.year);
        items.push({
          id: `publication-${index}`,
          type: "publication",
          title: pub.title || "Untitled Publication",
          subtitle: subtitleParts.length > 0 ? subtitleParts.join(", ") : undefined,
          content: pub.authors ? [pub.authors] : [],
          selected: false,
        });
      });
    }
    if (analysis.positionsOfResponsibility) {
      analysis.positionsOfResponsibility.forEach((pos: any, index: number) => {
        const subtitleParts: string[] = [];
        if (pos.organization) subtitleParts.push(pos.organization);
        if (pos.duration) subtitleParts.push(pos.duration);
        items.push({
          id: `position-${index}`,
          type: "position",
          title: pos.title || "Untitled Position",
          subtitle: subtitleParts.length > 0 ? subtitleParts.join(", ") : undefined,
          content: pos.description ? [pos.description] : [],
          selected: false,
        });
      });
    }
    if (analysis.certifications) {
      analysis.certifications.forEach((cert: any, index: number) => {
        const subtitleParts: string[] = [];
        if (cert.issuing_organization) subtitleParts.push(cert.issuing_organization);
        if (cert.issue_date) subtitleParts.push(cert.issue_date);
        items.push({
          id: `certification-${index}`,
          type: "certification",
          title: cert.name || "Untitled Certification",
          subtitle: subtitleParts.length > 0 ? subtitleParts.join(", ") : undefined,
          content: cert.credential_id ? [cert.credential_id] : [],
          selected: false,
        });
      });
    }
    if (analysis.achievements) {
      analysis.achievements.forEach((ach: any, index: number) => {
        const subtitleParts: string[] = [];
        if (ach.year) subtitleParts.push(ach.year);
        if (ach.category) subtitleParts.push(ach.category);
        items.push({
          id: `achievement-${index}`,
          type: "achievement",
          title: ach.title || "Untitled Achievement",
          subtitle: subtitleParts.length > 0 ? subtitleParts.join(", ") : undefined,
          content: ach.description ? [ach.description] : [],
          selected: false,
        });
      });
    }
    if (analysis.education) {
      analysis.education.forEach((edu: any, index: number) => {
        items.push({
          id: `education-${index}`,
          type: "education",
          title: edu.education_detail || "Untitled Education",
          subtitle: undefined,
          content: edu.education_detail ? [edu.education_detail] : [],
          selected: false,
        });
      });
    }
    return items;
  }, [
    analysisData?.analysis?.workExperience,
    analysisData?.analysis?.projects,
    analysisData?.analysis?.publications,
    analysisData?.analysis?.positionsOfResponsibility,
    analysisData?.analysis?.certifications,
    analysisData?.analysis?.achievements,
    analysisData?.analysis?.education,
  ]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand-primary mx-auto mb-4" />
          <p className="text-brand-light">Loading resume workspace…</p>
        </div>
      </div>
    );
  }

  if (error || !analysisData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">
            {error ? (error as Error).message : "No analysis data found"}
          </p>
          <Button
            onClick={() => router.back()}
            className="bg-brand-primary hover:bg-brand-primary/90"
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const { resume, analysis } = analysisData;

  const handleEnrichmentComplete = () => refetch();
  const handleRegenerateComplete = () => refetch();

  const handleJDEditApply = async (_response: JDEditResponse) => {
    // TODO: persist edited resume to DB (Phase 3 / DB endpoint)
    // For now just refetch so the workspace reflects any upstream changes
    await refetch();
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Sticky header */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="sticky top-4 z-10 mb-8"
        >
          <div className="backdrop-blur-sm bg-background-overlay/80 rounded-lg p-4 flex justify-between items-center">
            <Button
              onClick={() => router.back()}
              variant="ghost"
              className="text-brand-light hover:text-brand-primary"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => {
                  window.open(`/api/resumes/${id}/download`, "_blank");
                }}
                className="bg-brand-primary hover:bg-brand-primary/90"
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-brand-light mb-2">
            Resume Workspace
          </h1>
          <p className="text-brand-light/60">
            {analysis.name || "Candidate"} — {resume.customName}
          </p>
        </motion.div>

        {/* Tabbed workspace */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as WorkspaceTab)}
          >
            <TabsList className="w-full grid grid-cols-6 mb-8 bg-white/5 border border-white/10 rounded-xl p-1 h-auto">
              <TabsTrigger
                value="overview"
                className="flex items-center gap-2 py-2.5 data-[state=active]:bg-brand-primary data-[state=active]:text-white rounded-lg text-sm"
              >
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger
                value="edit"
                className="flex items-center gap-2 py-2.5 data-[state=active]:bg-brand-primary data-[state=active]:text-white rounded-lg text-sm"
              >
                <PenBox className="h-4 w-4" />
                <span className="hidden sm:inline">Edit</span>
              </TabsTrigger>
              <TabsTrigger
                value="enrich"
                className="flex items-center gap-2 py-2.5 data-[state=active]:bg-brand-primary data-[state=active]:text-white rounded-lg text-sm"
              >
                <Sparkles className="h-4 w-4" />
                <span className="hidden sm:inline">Enrich</span>
              </TabsTrigger>
              <TabsTrigger
                value="improve-by-jd"
                className="flex items-center gap-2 py-2.5 data-[state=active]:bg-brand-primary data-[state=active]:text-white rounded-lg text-sm"
              >
                <Wand2 className="h-4 w-4" />
                <span className="hidden sm:inline">Improve by JD</span>
              </TabsTrigger>
              <TabsTrigger
                value="regenerate"
                className="flex items-center gap-2 py-2.5 data-[state=active]:bg-brand-primary data-[state=active]:text-white rounded-lg text-sm"
              >
                <RefreshCw className="h-4 w-4" />
                <span className="hidden sm:inline">Regenerate</span>
              </TabsTrigger>
              <TabsTrigger
                value="export"
                className="flex items-center gap-2 py-2.5 data-[state=active]:bg-brand-primary data-[state=active]:text-white rounded-lg text-sm"
              >
                <FileDown className="h-4 w-4" />
                <span className="hidden sm:inline">Export</span>
              </TabsTrigger>
            </TabsList>

            {/* ── Overview ─────────────────────────────────────────────── */}
            <TabsContent value="overview">
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="xl:col-span-2 space-y-8">
                  {/* Skills Analysis */}
                  <Card className="backdrop-blur-lg bg-white/5 border-white/10">
                    <CardHeader>
                      <CardTitle className="text-brand-light flex items-center">
                        <Star className="mr-2 h-5 w-5 text-brand-primary" />
                        Skills Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {analysis.skillsAnalysis && analysis.skillsAnalysis.length > 0 ? (
                        analysis.skillsAnalysis.map((skill: any, index: number) => (
                          <div key={index}>
                            <div className="flex justify-between mb-1">
                              <span className="text-brand-light">{skill.skill_name}</span>
                              <span className="text-brand-primary">{skill.percentage}%</span>
                            </div>
                            <Progress value={skill.percentage} className="h-2" />
                          </div>
                        ))
                      ) : (
                        <p className="text-brand-light/60">No skills analysis available</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Work Experience */}
                  <Card className="backdrop-blur-lg bg-white/5 border-white/10">
                    <CardHeader>
                      <CardTitle className="text-brand-light flex items-center">
                        <Briefcase className="mr-2 h-5 w-5 text-brand-primary" />
                        Work Experience
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {analysis.workExperience && analysis.workExperience.length > 0 ? (
                        analysis.workExperience.map((work: any, index: number) => (
                          <div key={index} className="border-l-2 border-brand-primary pl-4">
                            <h3 className="text-brand-light font-semibold">{work.role}</h3>
                            <p className="text-brand-primary text-sm">{work.company_and_duration}</p>
                            {work.bullet_points && work.bullet_points.length > 0 && (
                              <ul className="mt-2 space-y-2 list-disc ml-4">
                                {work.bullet_points.map((point: string, i: number) => (
                                  <li key={i} className="text-brand-light/80 text-sm">
                                    <span className="inline">
                                      {renderMarkdownInline(point ?? "")}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-brand-light/60">No work experience data available</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Projects */}
                  <Card className="backdrop-blur-lg bg-white/5 border-white/10">
                    <CardHeader>
                      <CardTitle className="text-brand-light flex items-center">
                        <FolderOpen className="mr-2 h-5 w-5 text-brand-primary" />
                        Projects
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {analysis.projects && analysis.projects.length > 0 ? (
                        analysis.projects.map((project: any, index: number) => (
                          <div key={index} className="border-l-2 border-brand-primary pl-4">
                            <div className="flex justify-between">
                              <h3 className="text-brand-light font-semibold mb-2">{project.title}</h3>
                              <div>
                                {(project.live_link || project.repo_link) && (
                                  <div className="mb-3 flex gap-3 flex-wrap">
                                    {project.live_link && (
                                      <Link href={project.live_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center py-1 text-md font-medium text-brand-primary hover:text-white hover:scale-120">
                                        <ExternalLink className="mr-1 h-4 w-4" />
                                      </Link>
                                    )}
                                    {project.repo_link && (
                                      <Link href={project.repo_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center py-1 text-md font-medium text-brand-primary hover:text-white hover:scale-120">
                                        <GithubIcon className="h-4 w-4" />
                                      </Link>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                            {project.technologies_used && project.technologies_used.length > 0 && (
                              <div className="mb-3">
                                <div className="flex flex-wrap gap-1">
                                  {project.technologies_used.map((tech: string, i: number) => (
                                    <Badge key={i} className="bg-brand-primary/10 text-brand-primary border border-brand-primary/30 text-xs">
                                      {tech}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            <div className="text-brand-light/80 text-sm leading-relaxed space-y-2">
                              <MarkdownRenderer content={project.description} className="text-sm" />
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-brand-light/60">No projects data available</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Publications */}
                  {analysis.publications && analysis.publications.length > 0 && (
                    <Card className="backdrop-blur-lg bg-white/5 border-white/10">
                      <CardHeader>
                        <CardTitle className="text-brand-light flex items-center">
                          <BookOpen className="mr-2 h-5 w-5 text-brand-primary" />
                          Publications
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {analysis.publications.map((publication: any, index: number) => (
                          <div key={index} className="border-l-2 border-brand-primary pl-4">
                            <h3 className="text-brand-light font-semibold mb-2">{publication.title}</h3>
                            <div className="space-y-1 text-sm">
                              {publication.authors && <p className="text-brand-primary">Authors: {publication.authors}</p>}
                              {publication.journal_conference && <p className="text-brand-light/80">{publication.journal_conference}</p>}
                              {publication.year && <p className="text-brand-light/60">Year: {publication.year}</p>}
                              {publication.doi && <p className="text-brand-light/60">DOI: {publication.doi}</p>}
                              {publication.url && <a href={publication.url} target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline">View Publication</a>}
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {/* Positions of Responsibility */}
                  {analysis.positionsOfResponsibility && analysis.positionsOfResponsibility.length > 0 && (
                    <Card className="backdrop-blur-lg bg-white/5 border-white/10">
                      <CardHeader>
                        <CardTitle className="text-brand-light flex items-center">
                          <Users className="mr-2 h-5 w-5 text-brand-primary" />
                          Positions of Responsibility
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {analysis.positionsOfResponsibility.map((position: any, index: number) => (
                          <div key={index} className="border-l-2 border-brand-primary pl-4">
                            <h3 className="text-brand-light font-semibold mb-2">{position.title}</h3>
                            <div className="space-y-1 text-sm">
                              <p className="text-brand-primary">{position.organization}</p>
                              {position.duration && <p className="text-brand-light/80">{position.duration}</p>}
                              {position.description && (
                                <div className="text-brand-light/80 text-sm leading-relaxed space-y-2 mt-2">
                                  <MarkdownRenderer content={position.description} className="text-sm" />
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {/* Certifications */}
                  {analysis.certifications && analysis.certifications.length > 0 && (
                    <Card className="backdrop-blur-lg bg-white/5 border-white/10">
                      <CardHeader>
                        <CardTitle className="text-brand-light flex items-center">
                          <Award className="mr-2 h-5 w-5 text-brand-primary" />
                          Certifications
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {analysis.certifications.map((certification: any, index: number) => (
                          <div key={index} className="border-l-2 border-brand-primary pl-4">
                            <h3 className="text-brand-light font-semibold mb-2">{certification.name}</h3>
                            <div className="space-y-1 text-sm">
                              <p className="text-brand-primary">{certification.issuing_organization}</p>
                              {certification.issue_date && <p className="text-brand-light/80">Issued: {certification.issue_date}</p>}
                              {certification.expiry_date && <p className="text-brand-light/80">Expires: {certification.expiry_date}</p>}
                              {certification.credential_id && <p className="text-brand-light/60">ID: {certification.credential_id}</p>}
                              {certification.url && <a href={certification.url} target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline">View Certificate</a>}
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {/* Achievements */}
                  {analysis.achievements && analysis.achievements.length > 0 && (
                    <Card className="backdrop-blur-lg bg-white/5 border-white/10">
                      <CardHeader>
                        <CardTitle className="text-brand-light flex items-center">
                          <Trophy className="mr-2 h-5 w-5 text-brand-primary" />
                          Achievements
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {analysis.achievements.map((achievement: any, index: number) => (
                          <div key={index} className="border-l-2 border-brand-primary pl-4">
                            <h3 className="text-brand-light font-semibold mb-2">{achievement.title}</h3>
                            <div className="space-y-1 text-sm">
                              {achievement.category && (
                                <Badge className="bg-brand-primary/10 text-brand-primary border border-brand-primary/30 text-xs mb-2">{achievement.category}</Badge>
                              )}
                              {achievement.year && <p className="text-brand-primary">{achievement.year}</p>}
                              {achievement.description && (
                                <div className="text-brand-light/80 text-sm leading-relaxed space-y-2 mt-2">
                                  <MarkdownRenderer content={achievement.description} className="text-sm" />
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Sidebar */}
                <div className="space-y-8">
                  {/* Candidate Info */}
                  <Card className="backdrop-blur-lg bg-white/5 border-white/10">
                    <CardHeader>
                      <CardTitle className="text-brand-light flex items-center">
                        <Code className="mr-2 h-5 w-5 text-brand-primary" />
                        Candidate Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {analysis.name && (
                        <div>
                          <span className="text-brand-primary text-sm">Name:</span>
                          <p className="text-brand-light">{analysis.name}</p>
                        </div>
                      )}
                      {analysis.email && (
                        <div>
                          <span className="text-brand-primary text-sm">Email:</span>
                          <p className="text-brand-light">{analysis.email}</p>
                        </div>
                      )}
                      {analysis.contact && (
                        <div>
                          <span className="text-brand-primary text-sm">Contact:</span>
                          <p className="text-brand-light">{analysis.contact}</p>
                        </div>
                      )}
                      {analysis.predictedField && (
                        <div>
                          <span className="text-brand-primary text-sm">Predicted Field:</span>
                          <p className="text-brand-light">{analysis.predictedField}</p>
                        </div>
                      )}
                      {(analysis.linkedin || analysis.github || analysis.blog || analysis.portfolio) && (
                        <div className="pt-2 space-y-2">
                          <span className="text-brand-primary text-sm">Links:</span>
                          <div className="flex flex-col gap-1">
                            {analysis.linkedin && (
                              <Link href={analysis.linkedin} target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline break-all">
                                <LinkedinIcon className="inline-block mr-1 h-4 w-4" />
                                <span>{(() => {
                                  const link = analysis.linkedin!;
                                  try {
                                    const url = new URL(link);
                                    return url.pathname.replace(/^\/+/, "") || url.search.replace(/^\?/, "") || url.hash.replace(/^#/, "");
                                  } catch {
                                    const idx = link.indexOf("linkedin.com/");
                                    return idx !== -1 ? link.slice(idx + "linkedin.com/".length) : link;
                                  }
                                })()}</span>
                              </Link>
                            )}
                            {analysis.github && (
                              <Link href={analysis.github} target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline break-all">
                                <GithubIcon className="inline-block mr-1 h-4 w-4" />
                                <span>{(() => {
                                  const link = analysis.github!;
                                  try {
                                    const url = new URL(link);
                                    return url.pathname.replace(/^\/+/, "") || url.search.replace(/^\?/, "") || url.hash.replace(/^#/, "");
                                  } catch {
                                    const idx = link.indexOf("github.com/");
                                    return idx !== -1 ? link.slice(idx + "github.com/".length) : link;
                                  }
                                })()}</span>
                              </Link>
                            )}
                            {analysis.blog && (
                              <Link href={analysis.blog} target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline break-all">
                                <PenBox className="inline-block mr-1 h-4 w-4" />
                                {(() => {
                                  const link = analysis.blog!;
                                  try {
                                    const url = new URL(link);
                                    return `${url.host}${url.pathname}${url.search}${url.hash}`.replace(/\/$/, "");
                                  } catch {
                                    return link.replace(/^https?:\/\//, "").replace(/\/$/, "");
                                  }
                                })()}
                              </Link>
                            )}
                            {analysis.portfolio && (
                              <Link href={analysis.portfolio} target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline break-all">
                                <FolderOpen className="inline-block mr-1 h-4 w-4" />
                                {(() => {
                                  const link = analysis.portfolio!;
                                  try {
                                    const url = new URL(link);
                                    return `${url.host}${url.pathname}${url.search}${url.hash}`.replace(/\/$/, "");
                                  } catch {
                                    return link.replace(/^https?:\/\//, "").replace(/\/$/, "");
                                  }
                                })()}
                              </Link>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Recommended Roles */}
                  <Card className="backdrop-blur-lg bg-white/5 border-white/10">
                    <CardHeader>
                      <CardTitle className="text-brand-light flex items-center">
                        <Code className="mr-2 h-5 w-5 text-brand-primary" />
                        Recommended Roles
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {analysis.recommendedRoles && analysis.recommendedRoles.length > 0 ? (
                          analysis.recommendedRoles.map((role: string, index: number) => (
                            <Badge key={index} className="mr-2 mb-2 bg-brand-primary/20 text-brand-primary hover:bg-brand-primary/30 block w-fit">
                              {role}
                            </Badge>
                          ))
                        ) : (
                          <p className="text-brand-light/60">No role recommendations available</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Languages */}
                  <Card className="backdrop-blur-lg bg-white/5 border-white/10">
                    <CardHeader>
                      <CardTitle className="text-brand-light flex items-center">
                        <Languages className="mr-2 h-5 w-5 text-brand-primary" />
                        Languages
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {analysis.languages && analysis.languages.length > 0 ? (
                          analysis.languages.map((lang: any, index: number) => (
                            <div key={index} className="text-brand-light/80">{lang.language}</div>
                          ))
                        ) : (
                          <p className="text-brand-light/60">No language information available</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Education */}
                  <Card className="backdrop-blur-lg bg-white/5 border-white/10">
                    <CardHeader>
                      <CardTitle className="text-brand-light flex items-center">
                        <GraduationCap className="mr-2 h-5 w-5 text-brand-primary" />
                        Education
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {analysis.education && analysis.education.length > 0 ? (
                          analysis.education.map((edu: any, index: number) => (
                            <p key={index} className="text-brand-light/80">{edu.education_detail}</p>
                          ))
                        ) : (
                          <p className="text-brand-light/60">No education information available</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* ── Edit ──────────────────────────────────────────────── */}
            <TabsContent value="edit">
              <ResumeEditorTab resumeId={id} analysis={analysis} />
            </TabsContent>

            {/* ── Enrich ───────────────────────────────────────────────── */}
            <TabsContent value="enrich">
              <Card className="bg-white/5 border-white/10 max-w-2xl mx-auto">
                <CardHeader>
                  <CardTitle className="text-brand-light flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-brand-primary" />
                    Enrich Resume
                  </CardTitle>
                  <p className="text-brand-light/60 text-sm">
                    Answer targeted questions to enrich your resume with stronger, more detailed content.
                  </p>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => setIsEnrichmentOpen(true)}
                    className="w-full bg-brand-primary hover:bg-brand-primary/90"
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Start Enrichment
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Improve by JD ────────────────────────────────────────── */}
            <TabsContent value="improve-by-jd">
              <Card className="bg-white/5 border-white/10 max-w-3xl mx-auto">
                <CardHeader>
                  <CardTitle className="text-brand-light flex items-center gap-2">
                    <Wand2 className="h-5 w-5 text-brand-primary" />
                    Improve by Job Description
                  </CardTitle>
                  <p className="text-brand-light/60 text-sm">
                    Paste a job description and we will rewrite your resume to maximize ATS match — without fabricating experience.
                  </p>
                </CardHeader>
                <CardContent>
                  <JDEditPanel
                    resumeId={id}
                    initialJobDescription={jdParam}
                    initialJdUrl={jdUrlParam}
                    initialCompanyName={companyParam}
                    onApply={handleJDEditApply}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Regenerate ───────────────────────────────────────────── */}
            <TabsContent value="regenerate">
              <Card className="bg-white/5 border-white/10 max-w-2xl mx-auto">
                <CardHeader>
                  <CardTitle className="text-brand-light flex items-center gap-2">
                    <RefreshCw className="h-5 w-5 text-brand-primary" />
                    Regenerate Content
                  </CardTitle>
                  <p className="text-brand-light/60 text-sm">
                    Select work experiences or projects to regenerate with stronger, more impactful bullet points.
                  </p>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => setIsRegenerateOpen(true)}
                    disabled={selectableItems.length === 0}
                    className="w-full bg-brand-primary hover:bg-brand-primary/90 disabled:opacity-50"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    {selectableItems.length === 0
                      ? "No items available to regenerate"
                      : "Select Items to Regenerate"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Export ───────────────────────────────────────────────── */}
            <TabsContent value="export">
              <ExportTab resumeId={id} />
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>

      {/* Enrichment Modal */}
      <EnrichmentModal
        resumeId={id}
        isOpen={isEnrichmentOpen}
        onClose={() => setIsEnrichmentOpen(false)}
        onComplete={handleEnrichmentComplete}
      />

      {/* Regenerate Dialog */}
      <RegenerateDialog
        resumeId={id}
        isOpen={isRegenerateOpen}
        onClose={() => setIsRegenerateOpen(false)}
        onComplete={handleRegenerateComplete}
        availableItems={selectableItems}
      />
    </div>
  );
}
