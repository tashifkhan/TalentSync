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
} from "lucide-react";
import Link from "next/link";
import { Loader } from "@/components/ui/loader";
import { LlmConfigPanel } from "@/components/llm-config-panel";

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
    const timer = setTimeout(() => setIsPageLoading(false), 100);
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

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen text-white">
        Loading...
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white">
        Redirecting to login...
      </div>
    );
  }

  return (
    <>
      <AnimatePresence>
        {isPageLoading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-brand-dark flex items-center justify-center z-50"
          >
            <Loader variant="pulse" size="xl" text="Loading your account..." />
          </motion.div>
        )}
      </AnimatePresence>

      {!isPageLoading && (
        <div className="min-h-screen py-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute top-4 left-4"
          >
            <Link href="/dashboard">
              <Button
                variant="ghost"
                className="text-brand-light hover:text-brand-primary"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
          </motion.div>

          <div className="container mx-auto px-4 pt-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="max-w-2xl mx-auto"
            >
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-brand-light mb-2">
                  My Account
                </h1>
                <p className="text-brand-light/60">
                  Manage your account settings and preferences
                </p>
              </div>

              <div className="space-y-6">
                {/* Profile Information */}
                <Card className="backdrop-blur-xl bg-white/10 border-white/20 shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-brand-light flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Profile Information
                    </CardTitle>
                    <CardDescription className="text-brand-light/60">
                      Your basic account information
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Avatar Upload - only show for email users */}
                    {isEmailUser ? (
                      <AvatarUpload
                        currentAvatar={avatarUrl || session.user?.image}
                        onAvatarUpdate={(newUrl) => setAvatarUrl(newUrl)}
                      />
                    ) : (
                      <div className="flex items-center space-x-4">
                        <Avatar
                          src={session.user?.image}
                          alt="Profile"
                          size="lg"
                        />
                        <div className="flex-1">
                          <p className="text-brand-light font-medium mb-1">
                            Profile Picture
                          </p>
                          <p className="text-brand-light/60 text-sm">
                            Managed by your{" "}
                            {session.user?.image?.includes(
                              "googleusercontent.com",
                            )
                              ? "Google"
                              : "GitHub"}{" "}
                            account
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-brand-primary" />
                        <span className="text-brand-light/80 text-sm">
                          Name:
                        </span>
                        <span className="text-brand-light font-medium">
                          {session.user?.name || "Not provided"}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-brand-primary" />
                        <span className="text-brand-light/80 text-sm">
                          Email:
                        </span>
                        <span className="text-brand-light font-medium">
                          {session.user?.email || "Not provided"}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Shield className="h-4 w-4 text-brand-primary" />
                        <span className="text-brand-light/80 text-sm">
                          Role:
                        </span>
                        <span className="text-brand-light font-medium">
                          {(session.user as any)?.role === "Admin"
                            ? "Recruiter"
                            : (session.user as any)?.role || "Not assigned"}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Account Security */}
                <Card className="backdrop-blur-xl bg-white/10 border-white/20 shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-brand-light flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Account Security
                    </CardTitle>
                    <CardDescription className="text-brand-light/60">
                      Manage your account security settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {resetMessage && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-3 rounded-lg text-sm flex items-center space-x-2 ${
                          resetMessage.type === "success"
                            ? "bg-success/20 border border-success/30 text-success"
                            : "bg-destructive/20 border border-destructive/30 text-destructive"
                        }`}
                      >
                        {resetMessage.type === "success" ? (
                          <CheckCircle className="h-4 w-4 flex-shrink-0" />
                        ) : (
                          <AlertCircle className="h-4 w-4 flex-shrink-0" />
                        )}
                        <span>{resetMessage.text}</span>
                      </motion.div>
                    )}

                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <div>
                          <p className="text-brand-light font-medium">
                            Authentication Method
                          </p>
                          <p className="text-brand-light/60 text-sm">
                            {session.user?.image?.includes("googleusercontent")
                              ? "Google OAuth"
                              : session.user?.image?.includes("github")
                                ? "GitHub OAuth"
                                : "Email Sign-in"}
                          </p>
                        </div>
                        <div className="text-success text-sm">Active</div>
                      </div>

                      {/* Password Reset Section - only show for email users */}
                      {isEmailUser && (
                        <div className="p-3 bg-white/5 rounded-lg space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-brand-light font-medium">
                                Password
                              </p>
                              <p className="text-brand-light/60 text-sm">
                                Reset your account password
                              </p>
                            </div>
                            <Button
                              onClick={handlePasswordReset}
                              disabled={isResettingPassword}
                              variant="outline"
                              size="sm"
                              className="border-brand-primary/30 text-brand-primary hover:bg-brand-primary/10 hover:text-brand-primary flex items-center gap-2"
                            >
                              {isResettingPassword ? (
                                <Loader variant="spinner" size="sm" />
                              ) : (
                                <Key className="h-4 w-4" />
                              )}
                              {isResettingPassword
                                ? "Sending..."
                                : "Reset Password"}
                            </Button>
                          </div>
                          <p className="text-brand-light/50 text-xs">
                            A password reset link will be sent to your email
                            address.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Danger Zone */}
                    <div className="border-t border-destructive/20 pt-4 mt-6">
                      <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                        <h4 className="text-destructive font-medium mb-2 flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" />
                          Danger Zone
                        </h4>
                        <p className="text-destructive/80 text-sm mb-3">
                          Permanently delete your account and all associated
                          data. This action cannot be undone.
                        </p>
                        <Button
                          onClick={() => setShowDeleteDialog(true)}
                          variant="outline"
                          size="sm"
                          className="border-destructive/50 text-destructive hover:bg-destructive/20 hover:text-destructive hover:border-destructive/70"
                        >
                          <Trash2 className="mr-2 h-3 w-3" />
                          Delete Account
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Account Actions */}
                <Card className="backdrop-blur-xl bg-white/10 border-white/20 shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-brand-light">
                      Quick Actions
                    </CardTitle>
                    <CardDescription className="text-brand-light/60">
                      Navigate to key areas of your account
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <Link href="/dashboard" className="block">
                        <Button className="w-full bg-brand-primary hover:bg-brand-primary/90 text-white py-3 text-lg">
                          <ArrowLeft className="mr-2 h-5 w-5 rotate-180" />
                          Go to Dashboard
                        </Button>
                      </Link>

                      <Button
                        onClick={handleSignOut}
                        variant="outline"
                        className="w-full border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign Out
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* BYOAW & Model Selector */}
                <LlmConfigPanel />
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {/* Delete Account Confirmation Dialog */}
      <AnimatePresence>
        {showDeleteDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => {
              setShowDeleteDialog(false);
              setDeleteConfirmation("");
              setResetMessage(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="backdrop-blur-lg bg-brand-dark/95 border border-white/10 text-brand-light max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                className="absolute right-4 top-4 z-10 p-2 rounded-full bg-white/10 hover:bg-destructive/20 transition-colors"
                onClick={() => {
                  setShowDeleteDialog(false);
                  setDeleteConfirmation("");
                  setResetMessage(null);
                }}
              >
                <X className="h-4 w-4 text-brand-light" />
              </button>

              <div className="p-6">
                {/* Header Section */}
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-brand-light mb-2 flex items-center">
                    <Trash2 className="mr-3 h-6 w-6 text-destructive" />
                    Delete Account
                  </h2>
                  <p className="text-brand-light/60">
                    This action cannot be undone. This will permanently delete
                    your account and all associated data.
                  </p>
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 gap-6">
                  {/* Warning Information Card */}
                  <div className="backdrop-blur-lg bg-white/5 rounded-lg p-6 border border-white/10">
                    <h3 className="text-lg font-semibold text-brand-light mb-4 flex items-center">
                      <AlertTriangle className="mr-2 h-5 w-5 text-destructive" />
                      Data to be Deleted
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center text-sm text-brand-light/80">
                        <div className="w-2 h-2 bg-destructive rounded-full mr-3"></div>
                        All uploaded resumes and analyses
                      </div>
                      <div className="flex items-center text-sm text-brand-light/80">
                        <div className="w-2 h-2 bg-destructive rounded-full mr-3"></div>
                        Interview practice sessions
                      </div>
                      <div className="flex items-center text-sm text-brand-light/80">
                        <div className="w-2 h-2 bg-destructive rounded-full mr-3"></div>
                        Cold mail templates
                      </div>
                      <div className="flex items-center text-sm text-brand-light/80">
                        <div className="w-2 h-2 bg-destructive rounded-full mr-3"></div>
                        Account settings and preferences
                      </div>
                    </div>
                  </div>

                  {/* Status Message */}
                  {resetMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`backdrop-blur-lg rounded-lg p-4 border flex items-center space-x-3 ${
                        resetMessage.type === "success"
                          ? "bg-success/10 border-success/30 text-success"
                          : "bg-destructive/10 border-destructive/30 text-destructive"
                      }`}
                    >
                      {resetMessage.type === "success" ? (
                        <CheckCircle className="h-5 w-5 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="h-5 w-5 flex-shrink-0" />
                      )}
                      <span className="text-sm">{resetMessage.text}</span>
                    </motion.div>
                  )}

                  {/* Confirmation Input Card */}
                  <div className="backdrop-blur-lg bg-white/5 rounded-lg p-6 border border-white/10">
                    <h3 className="text-lg font-semibold text-brand-light mb-4 flex items-center">
                      <Shield className="mr-2 h-5 w-5 text-destructive" />
                      Confirmation Required
                    </h3>
                    <div>
                      <label className="block text-sm font-medium text-brand-light mb-3">
                        Type{" "}
                        <span className="text-destructive font-bold">
                          "DELETE"
                        </span>{" "}
                        to confirm:
                      </label>
                      <Input
                        type="text"
                        value={deleteConfirmation}
                        onChange={(e) => setDeleteConfirmation(e.target.value)}
                        placeholder="DELETE"
                        className="bg-white/10 border-white/20 text-brand-light placeholder:text-brand-light/40 focus:ring-destructive/50 focus:border-destructive/50"
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 justify-end mt-6 pt-6 border-t border-white/10">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDeleteDialog(false);
                      setDeleteConfirmation("");
                      setResetMessage(null);
                    }}
                    className="border-white/20 text-text-muted-dark hover:text-brand-light hover:bg-white/10"
                    disabled={isDeleting}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleDeleteAccount}
                    disabled={isDeleting || deleteConfirmation !== "DELETE"}
                    className="bg-destructive hover:bg-destructive/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isDeleting ? (
                      <>
                        <Loader className="mr-2 h-4 w-4 animate-spin" />
                        Deleting Account...
                      </>
                    ) : (
                      <>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Account
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
