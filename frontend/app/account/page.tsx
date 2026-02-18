"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { AvatarUpload } from "@/components/avatar-upload";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowLeft,
  User,
  Mail,
  LogOut,
  Shield,
  Key,
  CheckCircle,
  AlertCircle,
  Trash2,
  AlertTriangle,
  X,
  CreditCard,
  Layers,
  Activity,
  UserCog,
} from "lucide-react";
import Link from "next/link";
import { Loader } from "@/components/ui/loader";
import { LlmConfigPanel } from "@/components/llm-config-panel";
import { cn } from "@/lib/utils";

export default function AccountPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetMessage, setResetMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  // Check if user is using email authentication (not OAuth)
  const isEmailUser =
    session?.user?.email &&
    !session.user?.image?.includes("googleusercontent.com") &&
    !session.user?.image?.includes("github.com") &&
    !session.user?.image?.includes("avatars.githubusercontent.com");

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth");
    }
  }, [status, router]);

  // Simulate page load
  useEffect(() => {
    const timer = setTimeout(() => setIsPageLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  const handlePasswordReset = async () => {
    if (!session?.user?.email) {
      setResetMessage({
        type: "error",
        text: "No email address found for this account.",
      });
      return;
    }

    setIsResettingPassword(true);
    setResetMessage(null);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: session.user.email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send reset email");
      }

      setResetMessage({
        type: "success",
        text: "Password reset link has been sent to your email address. Please check your inbox.",
      });
    } catch (error: any) {
      setResetMessage({
        type: "error",
        text:
          error.message ||
          "Failed to send password reset email. Please try again.",
      });
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== "DELETE") {
      setResetMessage({
        type: "error",
        text: "Please type 'DELETE' to confirm account deletion.",
      });
      return;
    }

    setIsDeleting(true);
    setResetMessage(null);

    try {
      const response = await fetch("/api/auth/delete-account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete account");
      }

      // Sign out and redirect to home page
      await signOut({ callbackUrl: "/" });
    } catch (error: any) {
      setResetMessage({
        type: "error",
        text: error.message || "Failed to delete account. Please try again.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (status === "loading" || isPageLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        <Loader variant="pulse" size="xl" text="Loading Account..." />
      </div>
    );
  }

  if (!session) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen relative overflow-hidden selection:bg-brand-primary/30 selection:text-brand-light">
      <div className="relative z-10 container mx-auto px-4 py-8 lg:py-12 max-w-5xl">
        {/* Navigation */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <Link href="/dashboard">
            <Button
              variant="ghost"
              className="text-brand-light/60 hover:text-brand-primary hover:bg-brand-primary/5 pl-2 pr-4 transition-all"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12"
        >
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-2">
              Settings & Account
            </h1>
            <p className="text-brand-light/60 text-lg max-w-xl">
              Manage your personal information, security preferences, and AI configurations.
            </p>
          </div>
          <div className="flex items-center gap-3">
             <div className="hidden md:flex flex-col items-end mr-2">
                <span className="text-sm font-medium text-white">{session.user?.name}</span>
                <span className="text-xs text-brand-light/50">{session.user?.email}</span>
             </div>
             <Avatar 
                src={session.user?.image} 
                alt={session.user?.name || "Profile"} 
                className="h-12 w-12 border-2 border-white/10 shadow-lg" 
             />
          </div>
        </motion.div>

        <div className="space-y-8">
          {/* Main Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Profile & Security */}
            <div className="lg:col-span-1 space-y-8">
              
              {/* Profile Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card className="bg-white/[0.04] border-white/10 shadow-xl overflow-hidden h-full">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2.5 mb-1">
                      <User className="h-5 w-5 text-white" />
                      <CardTitle className="text-xl font-bold text-white">
                        Profile Information
                      </CardTitle>
                    </div>
                    <CardDescription className="text-brand-light/60">
                      Your basic account information
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-8 p-6">
                    <div className="flex items-center gap-4">
                      {isEmailUser ? (
                        <AvatarUpload
                          currentAvatar={avatarUrl || session.user?.image}
                          onAvatarUpdate={(newUrl) => setAvatarUrl(newUrl)}
                        />
                      ) : (
                        <Avatar
                          src={session.user?.image}
                          alt="Profile"
                          className="h-16 w-16 border-2 border-white/10"
                        />
                      )}
                      <div>
                        <div className="font-medium text-white text-base">
                          Profile Picture
                        </div>
                        <div className="text-sm text-brand-light/50">
                          {isEmailUser
                            ? "Upload a custom profile picture"
                            : `Managed by your ${
                                session.user?.image?.includes(
                                  "googleusercontent"
                                )
                                  ? "Google"
                                  : "GitHub"
                              } account`}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-3 text-sm">
                        <User className="h-4 w-4 text-brand-light/50" />
                        <span className="text-brand-light/60 w-12">Name:</span>
                        <span className="font-semibold text-white text-base">
                          {session.user?.name || "Not provided"}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-sm">
                        <Mail className="h-4 w-4 text-brand-light/50" />
                        <span className="text-brand-light/60 w-12">Email:</span>
                        <span className="font-semibold text-white text-base truncate">
                          {session.user?.email || "Not provided"}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-sm">
                        <Shield className="h-4 w-4 text-brand-light/50" />
                        <span className="text-brand-light/60 w-12">Role:</span>
                        <span className="font-semibold text-white text-base capitalize">
                          {(session.user as any)?.role === "Admin"
                            ? "Recruiter"
                            : (session.user as any)?.role || "User"}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Security Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Card className="bg-white/[0.04] border-white/10 shadow-xl overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2.5 mb-1">
                      <Shield className="h-5 w-5 text-white" />
                      <CardTitle className="text-xl font-bold text-white">
                        Account Security
                      </CardTitle>
                    </div>
                    <CardDescription className="text-brand-light/60">
                      Manage your account security settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-8 p-6">
                    {resetMessage && (
                      <div
                        className={`p-3 rounded-lg text-sm flex items-start gap-3 border ${
                          resetMessage.type === "success"
                            ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                            : "bg-rose-500/10 text-rose-300 border-rose-500/20"
                        }`}
                      >
                        {resetMessage.type === "success" ? (
                          <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" />
                        ) : (
                          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                        )}
                        <span>{resetMessage.text}</span>
                      </div>
                    )}

                    <div className="bg-white/[0.03] rounded-lg p-4 flex justify-between items-center border border-white/5">
                      <div>
                        <div className="font-semibold text-white text-sm">
                          Authentication Method
                        </div>
                        <div className="text-xs text-brand-light/50 mt-0.5">
                          {session.user?.image?.includes("googleusercontent")
                            ? "Google OAuth"
                            : session.user?.image?.includes("github")
                              ? "GitHub OAuth"
                              : "Email & Password"}
                        </div>
                      </div>
                      <div className="text-emerald-400 text-xs font-medium bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                        Active
                      </div>
                    </div>

                    {isEmailUser && (
                      <Button
                        onClick={handlePasswordReset}
                        disabled={isResettingPassword}
                        variant="outline"
                        className="w-full justify-start border-white/10 bg-transparent text-brand-light hover:bg-white/5 hover:text-white h-10"
                      >
                        {isResettingPassword ? (
                          <Loader className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Key className="mr-2 h-4 w-4" />
                        )}
                        {isResettingPassword
                          ? "Sending Reset Link..."
                          : "Reset Password"}
                      </Button>
                    )}

                    {/* Danger Zone */}
                    <div className="border border-rose-500/20 bg-rose-500/5 rounded-lg p-5">
                      <div className="flex items-center gap-2 text-rose-500 font-semibold mb-2">
                        <AlertCircle className="h-4 w-4" />
                        Danger Zone
                      </div>
                      <p className="text-xs text-rose-200/60 mb-4 leading-relaxed">
                        Permanently delete your account and all associated data.
                        This action cannot be undone.
                      </p>
                      <Button
                        onClick={() => setShowDeleteDialog(true)}
                        variant="destructive"
                        className="bg-white text-rose-600 hover:bg-rose-50 border-none h-9 text-sm font-semibold"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Account
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
              
              <motion.div
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ duration: 0.5, delay: 0.4 }}
              >
                 <Button
                    onClick={handleSignOut}
                    variant="outline"
                    className="w-full border-destructive border-dotted border-2 bg-destructive/5 text-destructive hover:bg-destructive/10 hover:text-destructive transition-all duration-300 shadow-sm"
                 >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                 </Button>
              </motion.div>
            </div>

            {/* Right Column: AI Config */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* AI Config Panel */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <LlmConfigPanel />
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Account Dialog */}
      <AnimatePresence>
        {showDeleteDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowDeleteDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-black border border-white/10 text-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-rose-500/10 p-6 flex flex-col items-center border-b border-rose-500/20">
                 <div className="h-16 w-16 rounded-full bg-rose-500/20 flex items-center justify-center mb-4 border border-rose-500/30">
                    <AlertTriangle className="h-8 w-8 text-rose-500" />
                 </div>
                 <h2 className="text-2xl font-bold text-white mb-2">Delete Account?</h2>
                 <p className="text-rose-200/80 text-center text-sm max-w-xs">
                    This is a permanent action. All your data, resumes, and settings will be wiped immediately.
                 </p>
              </div>

              <div className="p-6 space-y-6">
                 <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-brand-light/60 block">
                            Type <span className="font-mono font-bold text-white">DELETE</span> to confirm
                        </label>
                        <Input
                            value={deleteConfirmation}
                            onChange={(e) => setDeleteConfirmation(e.target.value)}
                            className="bg-white/5 border-white/10 text-center tracking-widest font-mono text-lg h-12 focus:border-rose-500/50 focus:ring-rose-500/20"
                            placeholder="DELETE"
                        />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-3">
                    <Button
                        onClick={() => setShowDeleteDialog(false)}
                        variant="outline"
                        className="h-12 border-white/10 hover:bg-white/5"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleDeleteAccount}
                        disabled={isDeleting || deleteConfirmation !== "DELETE"}
                        className="h-12 bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-900/20"
                    >
                        {isDeleting ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                        Delete Forever
                    </Button>
                 </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
