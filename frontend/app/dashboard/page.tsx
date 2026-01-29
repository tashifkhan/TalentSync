"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  FileText,
  Users,
  Mail,
  MessageSquare,
  ArrowRight,
  Briefcase,
  Target,
  Clock,
  Star,
  BarChart3,
  Calendar,
  CheckCircle,
  PlusCircle,
  Zap,
  Edit,
  Trash2,
  Eye,
  Copy,
  X,
  TrendingUp,
  Sparkles,
  Lightbulb,
  Hash,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { Loader, LoaderOverlay } from "@/components/ui/loader";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import {
  useDashboard,
  useDeleteResume,
  useRenameResume,
  useInterviews,
  useDeleteInterview,
  useColdMails,
  useDeleteColdMail,
} from "@/hooks/queries";
import { DashboardResume, InterviewSession, ColdMailSession } from "@/types";
import { actionItems } from "@/lib/navigation";
import { cn } from "@/lib/utils";

// Animated Counter Component
const CountUp = ({ end, duration = 2 }: { end: number; duration?: number }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    const startValue = 0;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      setCount(Math.floor(progress * (end - startValue) + startValue));

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    window.requestAnimationFrame(step);
  }, [end, duration]);

  return <span>{count}</span>;
};

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  const [currentTime, setCurrentTime] = useState("");
  const [showResumesModal, setShowResumesModal] = useState(false);
  const [showInterviewsModal, setShowInterviewsModal] = useState(false);
  const [showColdMailsModal, setShowColdMailsModal] = useState(false);

  // Resume state
  const [editingResume, setEditingResume] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [newResumeName, setNewResumeName] = useState("");
  const [deletingResume, setDeletingResume] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Other deletion states
  const [deletingInterview, setDeletingInterview] = useState<{
    id: string;
    role: string;
    companyName: string;
  } | null>(null);
  const [deletingColdMail, setDeletingColdMail] = useState<{
    id: string;
    recipientName: string;
    companyName: string;
  } | null>(null);

  // Queries
  const { data: dashboardData, isLoading: isLoadingDashboard } = useDashboard();
  const { data: interviewsData, isLoading: isLoadingInterviews } =
    useInterviews();
  const { data: coldMailsData, isLoading: isLoadingColdMails } = useColdMails();

  // Mutations
  const deleteResumeMutation = useDeleteResume();
  const renameResumeMutation = useRenameResume();
  const deleteInterviewMutation = useDeleteInterview();
  const deleteColdMailMutation = useDeleteColdMail();

  // Get current time
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeString = now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      setCurrentTime(timeString);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth");
    }
  }, [status, router]);

  // Copy to clipboard helper
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "Content copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  // Handlers
  const handleDeleteResume = (resumeId: string) => {
    deleteResumeMutation.mutate(resumeId);
    setDeletingResume(null);
  };

  const handleRenameResume = (resumeId: string, newName: string) => {
    renameResumeMutation.mutate(
      { id: resumeId, name: newName },
      {
        onSuccess: () => {
          setEditingResume(null);
          setNewResumeName("");
        },
      },
    );
  };

  const handleDeleteInterview = (interviewId: string) => {
    deleteInterviewMutation.mutate(interviewId);
    setDeletingInterview(null);
  };

  const handleDeleteColdMail = (coldMailId: string) => {
    deleteColdMailMutation.mutate(coldMailId);
    setDeletingColdMail(null);
  };

  // Get activity icon
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "resume":
        return <FileText className="h-4 w-4 text-brand-primary" />;
      case "cold_mail":
        return <Mail className="h-4 w-4 text-info" />;
      case "interview":
        return <Users className="h-4 w-4 text-success" />;
      default:
        return <Star className="h-4 w-4 text-muted-foreground" />;
    }
  };

  if (status === "loading") {
    return <LoaderOverlay variant="dots" size="xl" text="Loading session..." />;
  }

  if (!session) {
    return (
      <LoaderOverlay variant="dots" size="xl" text="Redirecting to login..." />
    );
  }

  // Combine loading states for initial page load
  const isPageLoading = isLoadingDashboard && !dashboardData;

  // Calculate stats for display
  const totalResumes = dashboardData?.stats.totalResumes || 0;
  const totalColdMails = dashboardData?.stats.totalColdMails || 0;
  const totalInterviews = dashboardData?.stats.totalInterviews || 0;

  return (
    <>
      <AnimatePresence>
        {isPageLoading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-brand-dark flex items-center justify-center z-50"
          >
            <Loader variant="dots" size="xl" text="Loading your dashboard..." />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="min-h-screen relative overflow-hidden bg-brand-darker">
        {/* Background Gradients */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-brand-primary/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-brand-secondary/5 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="container mx-auto px-6 py-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Enhanced Header Section */}
            <div className="mb-12 text-center relative py-8">
              <div className="absolute inset-0 -z-10 flex items-center justify-center">
                <div className="w-[800px] h-[200px] bg-gradient-to-r from-brand-primary/10 via-brand-secondary/5 to-brand-primary/10 blur-[100px] rounded-full opacity-50" />
              </div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center justify-center mb-6"
              >
                <Badge
                  variant="secondary"
                  className="bg-white/5 text-brand-light/80 border-white/10 px-4 py-1.5 rounded-full text-sm font-medium backdrop-blur-md"
                >
                  <Clock className="w-3.5 h-3.5 mr-2 text-brand-primary" />
                  {currentTime}
                </Badge>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-5xl md:text-6xl font-bold text-white mb-4 tracking-tight"
              >
                {getGreeting()},{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-secondary">
                  {dashboardData?.user?.name || session?.user?.name || "User"}
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-text-muted-light text-xl max-w-2xl mx-auto leading-relaxed"
              >
                {totalResumes > 0
                  ? `You've created ${totalResumes} resume${totalResumes !== 1 ? "s" : ""}. Ready to take the next step?`
                  : "Your AI-powered career companion is ready to help you succeed."}
              </motion.p>
            </div>

            {/* Quick Actions Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mb-12"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Zap className="h-6 w-6 text-brand-primary" />
                  Quick Actions
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {actionItems.map((action, index) => (
                  <Link key={action.href} href={action.href}>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + index * 0.05 }}
                      whileHover={{ y: -4 }}
                      className={cn(
                        "group h-full p-5 rounded-xl border transition-all duration-300 cursor-pointer relative overflow-hidden",
                        index === 0
                          ? "bg-gradient-to-br from-brand-primary/20 to-brand-secondary/10 border-brand-primary/30 hover:border-brand-primary/50"
                          : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20",
                      )}
                    >
                      {/* Hover Glow Effect */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%]" />

                      <div className="flex items-start gap-4">
                        <div
                          className={cn(
                            "p-3 rounded-lg transition-transform group-hover:scale-110 shrink-0",
                            index === 0
                              ? "bg-brand-primary/30"
                              : "bg-white/10 group-hover:bg-brand-primary/20",
                          )}
                        >
                          <action.icon
                            className={cn(
                              "h-6 w-6",
                              index === 0
                                ? "text-brand-primary"
                                : "text-brand-light group-hover:text-brand-primary",
                            )}
                          />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white mb-1 group-hover:text-brand-primary transition-colors">
                            {action.label}
                          </h3>
                          <p className="text-sm text-text-muted-light group-hover:text-brand-light/90 transition-colors">
                            {action.description}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                ))}
              </div>
            </motion.div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              {/* Resumes Stat */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                onClick={() => setShowResumesModal(true)}
                className="cursor-pointer"
              >
                <Card className="group relative backdrop-blur-sm bg-brand-dark/40 border-border-subtle/30 overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-brand-primary/5 h-full">
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute inset-0 bg-gradient-to-r from-brand-primary/10 via-transparent to-brand-primary/5 blur-xl" />
                  </div>

                  <CardContent className="p-6 relative">
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 bg-brand-primary/10 rounded-xl group-hover:bg-brand-primary/20 transition-colors border border-brand-primary/10 group-hover:border-brand-primary/30">
                        <FileText className="h-5 w-5 text-brand-primary" />
                      </div>
                      <div className="flex items-center text-xs text-brand-primary bg-brand-primary/10 px-2 py-1 rounded-full border border-brand-primary/20">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Active
                      </div>
                    </div>
                    <p className="text-4xl font-bold text-white mb-1 tracking-tight">
                      <CountUp end={totalResumes} />
                    </p>
                    <p className="text-sm text-text-muted-light font-medium">
                      Total Resumes Created
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Cold Mails Stat */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                onClick={() => setShowColdMailsModal(true)}
                className="cursor-pointer"
              >
                <Card className="group relative backdrop-blur-sm bg-brand-dark/40 border-border-subtle/30 overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-info/5 h-full">
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute inset-0 bg-gradient-to-r from-info/10 via-transparent to-info/5 blur-xl" />
                  </div>

                  <CardContent className="p-6 relative">
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 bg-info/10 rounded-xl group-hover:bg-info/20 transition-colors border border-info/10 group-hover:border-info/30">
                        <Mail className="h-5 w-5 text-info" />
                      </div>
                      <div className="flex items-center text-xs text-info bg-info/10 px-2 py-1 rounded-full border border-info/20">
                        <Target className="h-3 w-3 mr-1" />
                        Generated
                      </div>
                    </div>
                    <p className="text-4xl font-bold text-white mb-1 tracking-tight">
                      <CountUp end={totalColdMails} />
                    </p>
                    <p className="text-sm text-text-muted-light font-medium">
                      Cold Emails Drafted
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Interviews Stat */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                onClick={() => setShowInterviewsModal(true)}
                className="cursor-pointer"
              >
                <Card className="group relative backdrop-blur-sm bg-brand-dark/40 border-border-subtle/30 overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-success/5 h-full">
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute inset-0 bg-gradient-to-r from-success/10 via-transparent to-success/5 blur-xl" />
                  </div>

                  <CardContent className="p-6 relative">
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 bg-success/10 rounded-xl group-hover:bg-success/20 transition-colors border border-success/10 group-hover:border-success/30">
                        <Users className="h-5 w-5 text-success" />
                      </div>
                      <div className="flex items-center text-xs text-success bg-success/10 px-2 py-1 rounded-full border border-success/20">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Practiced
                      </div>
                    </div>
                    <p className="text-4xl font-bold text-white mb-1 tracking-tight">
                      <CountUp end={totalInterviews} />
                    </p>
                    <p className="text-sm text-text-muted-light font-medium">
                      Interview Sessions
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Main Content Grid: Resumes & Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
              {/* Left Column: Resumes (2/3 width) */}
              <div className="lg:col-span-2 space-y-8">
                {/* Your Resumes Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.7 }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                      <FileText className="h-6 w-6 text-brand-primary" />
                      Recent Resumes
                    </h2>
                    <Link href="/dashboard/seeker">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-brand-light hover:text-brand-primary hover:bg-white/5"
                      >
                        Create New <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>

                  {dashboardData?.resumes &&
                  dashboardData.resumes.length > 0 ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {dashboardData.resumes.slice(0, 4).map((resume) => (
                          <Card
                            key={resume.id}
                            className="backdrop-blur-sm bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-300 group cursor-pointer"
                          >
                            <Link href={`/dashboard/analysis/${resume.id}`}>
                              <CardContent className="p-5">
                                <div className="flex items-start justify-between mb-3">
                                  <div className="p-2 bg-brand-primary/10 rounded-lg group-hover:bg-brand-primary/20 transition-colors">
                                    <FileText className="h-5 w-5 text-brand-primary" />
                                  </div>
                                  {resume.predictedField && (
                                    <Badge className="bg-white/5 text-brand-light/60 border-white/10 text-[10px] hover:bg-white/10">
                                      {resume.predictedField}
                                    </Badge>
                                  )}
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-1 truncate group-hover:text-brand-primary transition-colors">
                                  {resume.customName}
                                </h3>
                                <p className="text-xs text-text-muted-light mb-4 flex items-center">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  {new Date(
                                    resume.uploadDate,
                                  ).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })}
                                </p>
                                <div className="flex items-center text-xs text-brand-primary font-medium group-hover:translate-x-1 transition-transform">
                                  View Analysis{" "}
                                  <ChevronRight className="h-3 w-3 ml-1" />
                                </div>
                              </CardContent>
                            </Link>
                          </Card>
                        ))}
                      </div>
                      {dashboardData.resumes.length > 4 && (
                        <div className="text-center">
                          <Button
                            onClick={() => setShowResumesModal(true)}
                            variant="outline"
                            className="border-white/10 text-brand-light hover:bg-white/5 hover:text-white w-full"
                          >
                            View All ({dashboardData.resumes.length}) Resumes
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <Card className="bg-white/5 border-dashed border-white/10 p-8 text-center">
                      <FileText className="h-12 w-12 text-brand-light/20 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-white mb-2">
                        No resumes yet
                      </h3>
                      <p className="text-text-muted-light text-sm mb-6">
                        Upload your first resume to get AI-powered insights
                      </p>
                      <Link href="/dashboard/seeker">
                        <Button className="bg-brand-primary text-white hover:bg-brand-primary/90">
                          Upload Resume
                        </Button>
                      </Link>
                    </Card>
                  )}
                </motion.div>

                {/* Feature Cards */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <Card className="bg-gradient-to-br from-brand-primary/10 to-transparent border-brand-primary/20 hover:border-brand-primary/40 transition-all cursor-pointer group">
                    <Link href="/dashboard/seeker" className="block h-full">
                      <CardContent className="p-6 h-full flex flex-col justify-between">
                        <div>
                          <div className="mb-4 p-3 bg-brand-primary/20 w-fit rounded-xl group-hover:scale-110 transition-transform duration-300">
                            <FileText className="h-6 w-6 text-brand-primary" />
                          </div>
                          <h3 className="text-xl font-bold text-white mb-2 group-hover:text-brand-primary transition-colors">
                            Resume Analysis
                          </h3>
                          <p className="text-brand-light/70 text-sm">
                            Get detailed AI feedback on your resume and optimize
                            for ATS compatibility.
                          </p>
                        </div>
                        <div className="mt-6 flex items-center text-sm font-medium text-brand-primary group-hover:translate-x-2 transition-transform">
                          Start Analysis <ArrowRight className="ml-2 h-4 w-4" />
                        </div>
                      </CardContent>
                    </Link>
                  </Card>

                  <Card className="bg-gradient-to-br from-white/5 to-transparent border-white/10 hover:border-white/20 transition-all cursor-pointer group">
                    <Link href="/dashboard/recruiter" className="block h-full">
                      <CardContent className="p-6 h-full flex flex-col justify-between">
                        <div>
                          <div className="mb-4 p-3 bg-white/10 w-fit rounded-xl group-hover:scale-110 transition-transform duration-300">
                            <Users className="h-6 w-6 text-white" />
                          </div>
                          <h3 className="text-xl font-bold text-white mb-2">
                            For Recruiters
                          </h3>
                          <p className="text-brand-light/70 text-sm">
                            Advanced tools to find, analyze, and manage top
                            talent efficiently.
                          </p>
                        </div>
                        <div className="mt-6 flex items-center text-sm font-medium text-white group-hover:translate-x-2 transition-transform">
                          Explore Tools <ArrowRight className="ml-2 h-4 w-4" />
                        </div>
                      </CardContent>
                    </Link>
                  </Card>
                </motion.div>
              </div>

              {/* Right Column: Activity & Tips (1/3 width) */}
              <div className="space-y-8">
                {/* Activity Center */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.9 }}
                >
                  <Card className="backdrop-blur-sm bg-brand-dark/40 border-border-subtle/30 h-full">
                    <CardHeader className="pb-3 border-b border-white/5">
                      <CardTitle className="text-white flex items-center gap-2 text-lg">
                        <BarChart3 className="h-5 w-5 text-brand-primary" />
                        Activity Center
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                      {isLoadingDashboard ? (
                        <div className="flex justify-center py-8">
                          <Loader
                            variant="dots"
                            size="md"
                            text="Loading activity..."
                          />
                        </div>
                      ) : dashboardData?.recentActivity &&
                        dashboardData.recentActivity.length > 0 ? (
                        <div className="relative border-l border-white/10 ml-3 space-y-6">
                          {dashboardData.recentActivity
                            .slice(0, 5)
                            .map((activity, index) => (
                              <div
                                key={activity.id}
                                className="relative pl-6 group"
                              >
                                {/* Timeline Dot */}
                                <div className="absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full bg-brand-dark border border-brand-light/30 group-hover:border-brand-primary group-hover:bg-brand-primary transition-colors" />

                                <div className="flex flex-col">
                                  <span className="text-xs text-brand-light/40 mb-1 font-mono">
                                    {new Date(activity.date).toLocaleDateString(
                                      "en-US",
                                      {
                                        month: "short",
                                        day: "numeric",
                                      },
                                    )}
                                  </span>
                                  <h4 className="text-sm font-medium text-white group-hover:text-brand-primary transition-colors">
                                    {activity.title}
                                  </h4>
                                  <p className="text-xs text-brand-light/60 mt-0.5 line-clamp-1">
                                    {activity.description}
                                  </p>
                                </div>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-sm text-brand-light/50">
                            No recent activity
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Quick Tips */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 1.0 }}
                >
                  <Card className="bg-gradient-to-b from-brand-primary/10 to-transparent border-brand-primary/20">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-white flex items-center gap-2 text-base">
                        <Lightbulb className="h-4 w-4 text-brand-primary" />
                        Pro Tip
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-brand-light/80 leading-relaxed">
                        "Tailoring your resume keywords to the job description
                        can increase your chances of passing ATS scans by up to
                        70%."
                      </p>
                      <div className="mt-4 pt-4 border-t border-brand-primary/10 flex justify-between items-center">
                        <span className="text-xs text-brand-primary font-medium">
                          #CareerAdvice
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs text-brand-light/50 hover:text-white px-2"
                        >
                          Next Tip
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Resumes Management Modal */}
      <AnimatePresence>
        {showResumesModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowResumesModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-brand-darker border border-white/10 text-brand-light max-w-4xl w-full max-h-[85vh] overflow-y-auto rounded-xl shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 z-20 bg-brand-darker/95 backdrop-blur-md border-b border-white/10 p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-brand-primary/10 rounded-lg">
                    <FileText className="h-5 w-5 text-brand-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      Your Resumes
                    </h2>
                    <p className="text-sm text-brand-light/60">
                      Manage and organize your uploaded documents
                    </p>
                  </div>
                </div>
                <button
                  className="p-2 rounded-full hover:bg-white/10 transition-colors"
                  onClick={() => setShowResumesModal(false)}
                >
                  <X className="h-5 w-5 text-brand-light" />
                </button>
              </div>

              <div className="p-6">
                {isLoadingDashboard ? (
                  <div className="flex justify-center py-12">
                    <Loader
                      variant="dots"
                      size="lg"
                      text="Loading resumes..."
                    />
                  </div>
                ) : dashboardData?.resumes &&
                  dashboardData.resumes.length > 0 ? (
                  <div className="space-y-3">
                    {dashboardData.resumes.map((resume, index) => (
                      <motion.div
                        key={resume.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/[0.07] border border-white/5 transition-all group"
                      >
                        <div className="flex-1 min-w-0 pr-4">
                          {editingResume?.id === resume.id ? (
                            <div className="flex items-center gap-2 max-w-md">
                              <Input
                                value={newResumeName}
                                onChange={(e) =>
                                  setNewResumeName(e.target.value)
                                }
                                className="bg-brand-dark border-white/20 h-9"
                                autoFocus
                              />
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleRenameResume(resume.id, newResumeName)
                                }
                                className="bg-brand-primary text-white h-9"
                              >
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingResume(null)}
                                className="h-9"
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <div>
                              <h3 className="font-semibold text-brand-light truncate flex items-center gap-2">
                                {resume.customName}
                                {resume.predictedField && (
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] py-0 h-5 border-brand-primary/30 text-brand-primary bg-brand-primary/5"
                                  >
                                    {resume.predictedField}
                                  </Badge>
                                )}
                              </h3>
                              <div className="flex items-center gap-4 mt-1 text-xs text-brand-light/50">
                                <span>
                                  Uploaded{" "}
                                  {new Date(
                                    resume.uploadDate,
                                  ).toLocaleDateString()}
                                </span>
                                {resume.candidateName && (
                                  <span>• {resume.candidateName}</span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {editingResume?.id !== resume.id && (
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingResume({
                                  id: resume.id,
                                  name: resume.customName,
                                });
                                setNewResumeName(resume.customName);
                              }}
                              className="h-8 w-8 p-0 text-brand-light/70 hover:text-brand-primary"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                setDeletingResume({
                                  id: resume.id,
                                  name: resume.customName,
                                })
                              }
                              className="h-8 w-8 p-0 text-brand-light/70 hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <Link href={`/dashboard/analysis/${resume.id}`}>
                              <Button
                                size="sm"
                                className="ml-2 h-8 bg-white/10 hover:bg-white/20 text-white border border-white/10"
                              >
                                View
                              </Button>
                            </Link>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <FileText className="h-16 w-16 text-brand-light/20 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white">
                      No resumes found
                    </h3>
                    <p className="text-brand-light/50 mb-6">
                      Upload a resume to get started
                    </p>
                    <Link href="/dashboard/seeker">
                      <Button className="bg-brand-primary text-white">
                        Upload New Resume
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interviews Modal - Consistent styling */}
      <AnimatePresence>
        {showInterviewsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowInterviewsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-brand-darker border border-white/10 text-brand-light max-w-5xl w-full max-h-[85vh] overflow-y-auto rounded-xl shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 z-20 bg-brand-darker/95 backdrop-blur-md border-b border-white/10 p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-success/10 rounded-lg">
                    <Users className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      Interview Sessions
                    </h2>
                    <p className="text-sm text-brand-light/60">
                      Review your practice Q&A history
                    </p>
                  </div>
                </div>
                <button
                  className="p-2 rounded-full hover:bg-white/10 transition-colors"
                  onClick={() => setShowInterviewsModal(false)}
                >
                  <X className="h-5 w-5 text-brand-light" />
                </button>
              </div>

              <div className="p-6">
                {isLoadingInterviews ? (
                  <div className="flex justify-center py-12">
                    <Loader
                      variant="dots"
                      size="lg"
                      text="Loading interviews..."
                    />
                  </div>
                ) : !interviewsData || interviewsData.length === 0 ? (
                  <div className="text-center py-16">
                    <Users className="h-16 w-16 text-brand-light/20 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white">
                      No interview sessions
                    </h3>
                    <p className="text-brand-light/50 mb-6">
                      Start practicing to improve your skills
                    </p>
                    <Link href="/dashboard/hiring-assistant">
                      <Button className="bg-success text-white hover:bg-success/90">
                        Start Practice
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {interviewsData.map((session: InterviewSession) => (
                      <div
                        key={session.id}
                        className="bg-white/5 rounded-xl border border-white/5 overflow-hidden"
                      >
                        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                          <div>
                            <h3 className="font-semibold text-white flex items-center gap-2">
                              {session.role}{" "}
                              <span className="text-brand-light/50 font-normal">
                                at
                              </span>{" "}
                              {session.companyName}
                            </h3>
                            <p className="text-xs text-brand-light/50 mt-1">
                              {new Date(session.createdAt).toLocaleDateString(
                                "en-US",
                                {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              setDeletingInterview({
                                id: session.id,
                                role: session.role,
                                companyName: session.companyName,
                              })
                            }
                            className="text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="p-4 space-y-4">
                          {session.questionsAndAnswers.map((qa, idx) => (
                            <div
                              key={idx}
                              className="pl-4 border-l-2 border-brand-primary/30"
                            >
                              <p className="text-sm font-medium text-brand-primary mb-1">
                                Q: {qa.question}
                              </p>
                              <p className="text-sm text-brand-light/80 leading-relaxed">
                                {qa.answer}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cold Mails Modal - Consistent styling */}
      <AnimatePresence>
        {showColdMailsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowColdMailsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-brand-darker border border-white/10 text-brand-light max-w-5xl w-full max-h-[85vh] overflow-y-auto rounded-xl shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 z-20 bg-brand-darker/95 backdrop-blur-md border-b border-white/10 p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-info/10 rounded-lg">
                    <Mail className="h-5 w-5 text-info" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      Cold Email Drafts
                    </h2>
                    <p className="text-sm text-brand-light/60">
                      Generated outreach messages
                    </p>
                  </div>
                </div>
                <button
                  className="p-2 rounded-full hover:bg-white/10 transition-colors"
                  onClick={() => setShowColdMailsModal(false)}
                >
                  <X className="h-5 w-5 text-brand-light" />
                </button>
              </div>

              <div className="p-6">
                {isLoadingColdMails ? (
                  <div className="flex justify-center py-12">
                    <Loader variant="dots" size="lg" text="Loading emails..." />
                  </div>
                ) : !coldMailsData || coldMailsData.length === 0 ? (
                  <div className="text-center py-16">
                    <Mail className="h-16 w-16 text-brand-light/20 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white">
                      No emails generated
                    </h3>
                    <p className="text-brand-light/50 mb-6">
                      Create personalized cold emails for job applications
                    </p>
                    <Link href="/dashboard/cold-mail">
                      <Button className="bg-info text-white hover:bg-info/90">
                        Generate Email
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {coldMailsData.map((session: ColdMailSession) => (
                      <div
                        key={session.id}
                        className="bg-white/5 rounded-xl border border-white/5 overflow-hidden"
                      >
                        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                          <div>
                            <h3 className="font-semibold text-white flex items-center gap-2">
                              To: {session.recipientName}{" "}
                              <span className="text-brand-light/50 font-normal">
                                at
                              </span>{" "}
                              {session.companyName}
                            </h3>
                            <p className="text-xs text-brand-light/50 mt-1">
                              {new Date(session.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              setDeletingColdMail({
                                id: session.id,
                                recipientName: session.recipientName,
                                companyName: session.companyName,
                              })
                            }
                            className="text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="p-4 space-y-4">
                          {session.emails.map((email, idx) => (
                            <div
                              key={idx}
                              className="bg-brand-dark/50 rounded-lg p-4 border border-white/5"
                            >
                              <div className="flex justify-between items-start mb-2">
                                <p className="text-sm font-semibold text-white">
                                  Subject: {email.subject}
                                </p>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() =>
                                    copyToClipboard(
                                      `Subject: ${email.subject}\n\n${email.body}`,
                                    )
                                  }
                                  className="h-6 px-2 text-xs hover:bg-white/10"
                                >
                                  <Copy className="h-3 w-3 mr-1" /> Copy
                                </Button>
                              </div>
                              <p className="text-brand-light/80 whitespace-pre-wrap font-mono text-xs leading-relaxed">
                                {email.body}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Dialogs (kept simple but styled) */}
      <AnimatePresence>
        {(deletingResume || deletingInterview || deletingColdMail) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-brand-dark border border-white/10 p-6 rounded-xl max-w-sm w-full shadow-2xl"
            >
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-destructive" />
                Confirm Deletion
              </h3>
              <p className="text-brand-light/70 text-sm mb-6">
                Are you sure you want to delete this? This action cannot be
                undone.
              </p>
              <div className="flex justify-end gap-3">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setDeletingResume(null);
                    setDeletingInterview(null);
                    setDeletingColdMail(null);
                  }}
                  className="text-brand-light hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (deletingResume) handleDeleteResume(deletingResume.id);
                    if (deletingInterview)
                      handleDeleteInterview(deletingInterview.id);
                    if (deletingColdMail)
                      handleDeleteColdMail(deletingColdMail.id);
                  }}
                >
                  Delete
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
