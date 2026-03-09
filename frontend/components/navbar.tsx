"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import {
  LayoutDashboard,
  LogIn,
  X,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Plus,
  ArrowLeft,
  MoreHorizontal,
  Menu,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import MobileBottomNav from "./mobile-bottom-nav";
import { useSidebar } from "./sidebar-provider";
import { navItems, actionItems } from "@/lib/navigation";
import { haptic } from "@/lib/haptics";

import banner from "@/public/banner-dark.svg";

// Route → page title map used in the mobile top nav
const PAGE_TITLES: Record<string, string> = {
  "/": "TalentSync AI",
  "/dashboard": "Dashboard",
  "/dashboard/ats": "ATS Evaluator",
  "/dashboard/cold-mail": "Cold Mail",
  "/dashboard/cover-letter": "Cover Letter",
  "/dashboard/hiring-assistant": "Interview QnA",
  "/dashboard/linkedin-posts": "LinkedIn Posts",
  "/dashboard/seeker": "Resume Analysis",
  "/dashboard/recruiter": "Candidate DB",
  "/dashboard/pdf-resume": "Create Resume",
  "/dashboard/tips": "Career Tips",
  "/dashboard/admin": "Admin",
  "/account": "Account",
  "/about": "About",
  "/auth": "Sign In",
  "/select-role": "Select Role",
};

function getMobilePageTitle(pathname: string): string {
  // Exact match first
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  // Prefix match for dynamic routes (e.g. /dashboard/analysis/[id])
  if (pathname.startsWith("/dashboard/analysis/")) return "Resume Analysis";
  if (pathname.startsWith("/dashboard/")) return "Dashboard";
  return "TalentSync AI";
}

// Whether to show a back button for a given route on mobile
function shouldShowBack(pathname: string): boolean {
  return pathname !== "/" && pathname !== "/dashboard" && pathname !== "/auth";
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isCollapsed, setIsCollapsed } = useSidebar();
  const { data: session, status } = useSession();

  const handleSignOut = async () => {
    haptic("heavy");
    await signOut({ callbackUrl: "/" });
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.div
        initial={{ x: -280 }}
        animate={{ x: 0 }}
        className={cn(
          "hidden md:fixed md:inset-y-0 md:left-0 md:z-50 md:flex md:flex-col transition-all duration-300",
          isCollapsed ? "md:w-16" : "md:w-72",
        )}
      >
        <div className="flex flex-col h-full backdrop-blur-xl bg-black/20 border-r border-white/10">
          {/* Header */}
          <div
            className={cn(
              "flex items-center p-4 border-b border-white/10 flex-shrink-0",
              isCollapsed ? "justify-center" : "justify-between",
            )}
          >
            {!isCollapsed && (
              <Link href="/" className="flex items-center space-x-3">
                <Image src={banner} alt="TalentSync AI" width={160} />
              </Link>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { haptic("light"); setIsCollapsed(!isCollapsed); }}
              className="text-brand-light/70 hover:text-brand-primary hover:bg-brand-primary/10 p-2"
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto sidebar-scrollbar">
            {/* Main Navigation */}
            <div className="space-y-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group",
                      isCollapsed ? "justify-center" : "space-x-3",
                        isActive
                          ? "text-brand-primary bg-brand-primary/10 shadow-inner shadow-brand-primary/5"
                          : "text-brand-light/90 hover:text-white hover:bg-white/[0.08]",
                    )}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    {!isCollapsed && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </div>

            {/* Quick Actions */}
            {session && (
              <div className="space-y-3">
                {!isCollapsed && (
                  <div className="px-4">
                    <h3 className="text-xs font-semibold text-brand-light/50 uppercase tracking-wider">
                      Quick Actions
                    </h3>
                  </div>
                )}
                <div className="space-y-1">
                  {actionItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group",
                          isCollapsed ? "justify-center" : "space-x-3",
                          isActive
                            ? "text-brand-primary bg-brand-primary/10 shadow-inner shadow-brand-primary/5"
                            : "text-brand-light/90 hover:text-white hover:bg-white/[0.08]",
                        )}
                        title={isCollapsed ? item.label : undefined}
                      >
                        <item.icon className="h-4 w-4 flex-shrink-0" />
                        {!isCollapsed && (
                          <div className="flex-1 min-w-0">
                            <div className="truncate">{item.label}</div>
                            <div className="text-xs text-brand-light/60 truncate">
                              {item.description}
                            </div>
                          </div>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </nav>

          {/* User Section */}
          <div className="border-t border-white/10 p-4 flex-shrink-0">
            {status === "loading" ? (
              <div className="text-brand-light/60 text-sm">Loading...</div>
            ) : session ? (
              <div className="space-y-2">
                {/* User Info */}
                <Link href="/account">
                  <div
                    className={cn(
                      "flex items-center p-3 rounded-lg text-brand-light/90 hover:text-brand-primary hover:bg-brand-primary/10 cursor-pointer transition-colors",
                      isCollapsed ? "justify-center" : "space-x-3",
                    )}
                  >
                    <Avatar
                      src={session?.user?.image}
                      alt="Profile"
                      size="sm"
                    />
                    {!isCollapsed && (
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium truncate">
                          {session?.user?.name ||
                            session?.user?.email ||
                            "Account"}
                        </div>
                        <div className="text-xs text-brand-primary truncate">
                          {(session?.user as any)?.role === "Admin"
                            ? "Recruiter"
                            : (session?.user as any)?.role || "No role"}
                        </div>
                      </div>
                    )}
                  </div>
                </Link>

                {/* Dashboard Button */}
                <Link href="/dashboard">
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full text-brand-light/90 hover:text-brand-primary hover:bg-brand-primary/10",
                      isCollapsed ? "justify-center px-2" : "justify-start",
                    )}
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    {!isCollapsed && <span className="ml-2">Dashboard</span>}
                  </Button>
                </Link>

                {/* Sign Out Button */}
                <Button
                  onClick={handleSignOut}
                  variant="ghost"
                  className={cn(
                    "w-full text-brand-light/90 hover:text-destructive hover:bg-destructive/10",
                    isCollapsed ? "justify-center px-2" : "justify-start",
                  )}
                >
                  <LogOut className="h-4 w-4" />
                  {!isCollapsed && <span className="ml-2">Sign Out</span>}
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Link href="/auth">
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full text-brand-light/90 hover:text-brand-primary hover:bg-brand-primary/10",
                      isCollapsed ? "justify-center px-2" : "justify-start",
                    )}
                  >
                    <LogIn className="h-4 w-4" />
                    {!isCollapsed && <span className="ml-2">Sign In</span>}
                  </Button>
                </Link>
                <Link href="/auth?tab=register">
                  <Button
                    className={cn(
                      "w-full bg-brand-primary hover:bg-brand-primary/90 font-medium shadow-lg shadow-brand-primary/20brand-primary/20",
                      isCollapsed ? "justify-center px-2" : "",
                    )}
                  >
                    {isCollapsed ? <Plus className="h-4 w-4" /> : "Get Started"}
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Mobile / Tablet Top Navigation — native app bar style */}
      <motion.div
        initial={{ y: -60 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed top-0 left-0 right-0 z-40 sm:block md:hidden"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        {/* Main bar */}
        <div className="backdrop-blur-2xl bg-black/30 border-b border-white/[0.08]">
          <div className="flex items-center h-14 px-3 gap-2">

            {/* Left — back button or logo */}
            <div className={cn("flex-shrink-0", shouldShowBack(pathname) ? "w-10" : "flex-1")}>
              {shouldShowBack(pathname) ? (
                <button
                  aria-label="Go back"
                  onClick={() => { haptic("light"); router.back(); }}
                  className="flex items-center justify-center w-9 h-9 rounded-full bg-white/[0.07] active:bg-white/15 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 text-brand-light/90" />
                </button>
              ) : (
                <Link href="/" className="flex items-center">
                  <Image src={banner} alt="TalentSync AI" width={110} />
                </Link>
              )}
            </div>

            {/* Center — page title */}
            <div className="flex-1 min-w-0 flex items-center justify-center gap-1.5">
              {shouldShowBack(pathname) && (
                <>
                  <span className="text-[15px] font-semibold text-white tracking-tight truncate leading-none">
                    {getMobilePageTitle(pathname)}
                  </span>
                  {pathname === "/dashboard/linkedin-posts" && (
                    <span className="inline-flex items-center px-1 py-0.5 rounded text-[9px] font-bold bg-brand-primary/20 text-brand-primary border border-brand-primary/30 leading-none flex-shrink-0">
                      BETA
                    </span>
                  )}
                </>
              )}
            </div>

            {/* Right — "..." menu button (home = hamburger, deep pages = three-dots) */}
            <div className="w-10 flex-shrink-0 flex justify-end">
              <button
                aria-label="Open menu"
                onClick={() => { haptic("light"); setIsMobileMenuOpen(!isMobileMenuOpen); }}
                className="flex items-center justify-center w-9 h-9 rounded-full bg-white/[0.07] border border-white/10 active:bg-white/15 transition-colors"
              >
                {isMobileMenuOpen ? (
                  <X className="h-4 w-4 text-brand-light/90" />
                ) : shouldShowBack(pathname) ? (
                  <MoreHorizontal className="h-4 w-4 text-brand-light/90" />
                ) : (
                  <Menu className="h-4 w-4 text-brand-light/90" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Dropdown menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              key="mobile-menu"
              initial={{ opacity: 0, y: -8, scaleY: 0.96 }}
              animate={{ opacity: 1, y: 0, scaleY: 1 }}
              exit={{ opacity: 0, y: -8, scaleY: 0.96 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              style={{ transformOrigin: "top" }}
              className="backdrop-blur-2xl bg-black/75 border-b border-white/[0.08]"
            >
              <div
                className="px-3 py-3 space-y-1 overflow-y-auto"
                style={{
                  maxHeight:
                    "calc(100dvh - 3.5rem - env(safe-area-inset-top) - 5rem - env(safe-area-inset-bottom))",
                }}
              >
                {/* Nav items */}
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all",
                        isActive
                          ? "text-brand-primary bg-brand-primary/10"
                          : "text-white/90 hover:text-white hover:bg-white/[0.06]",
                      )}
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0 opacity-80" />
                      {item.label}
                    </Link>
                  );
                })}

                {/* Quick Actions */}
                {session && (
                  <>
                    <div className="pt-2 mt-1 border-t border-white/[0.08]">
                      <p className="px-3 pb-1.5 text-[10px] font-semibold text-white/60 uppercase tracking-wider">
                        Quick Actions
                      </p>
                      {actionItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all",
                              isActive
                                ? "text-brand-primary bg-brand-primary/10"
                                : "text-white/90 hover:text-white hover:bg-white/[0.06]",
                            )}
                          >
                            <item.icon className="h-4 w-4 flex-shrink-0 opacity-80" />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="truncate">{item.label}</span>
                                {item.href === "/dashboard/linkedin-posts" && (
                                  <span className="inline-flex items-center px-1 py-0.5 rounded text-[9px] font-bold bg-brand-primary/20 text-brand-primary border border-brand-primary/30 leading-none flex-shrink-0">
                                    BETA
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-white/60 truncate">{item.description}</div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </>
                )}

                {/* Auth section */}
                <div className="pt-2 mt-1 border-t border-white/[0.08] pb-1">
                  {session ? (
                    <div className="space-y-1">
                      <Link href="/account" onClick={() => setIsMobileMenuOpen(false)}>
                        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.06] transition-all">
                          <Avatar src={session?.user?.image} alt="Profile" size="sm" />
                          <div className="min-w-0">
                            <div className="text-[13px] font-medium text-white/90 truncate">
                              {session?.user?.name || session?.user?.email || "Account"}
                            </div>
                            <div className="text-[11px] text-brand-primary">
                              {(session?.user as any)?.role === "Admin" ? "Recruiter" : (session?.user as any)?.role || "No role"}
                            </div>
                          </div>
                        </div>
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-white/85 hover:text-red-400 hover:bg-red-400/10 transition-all"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2 px-1 pt-1">
                      <Link href="/auth" className="flex-1">
                        <Button variant="ghost" className="w-full text-brand-light/80 hover:text-brand-primary hover:bg-brand-primary/10 h-9 text-sm">
                          <LogIn className="h-4 w-4 mr-2" />
                          Sign In
                        </Button>
                      </Link>
                      <Link href="/auth?tab=register" className="flex-1">
                        <Button className="w-full bg-brand-primary hover:bg-brand-primary/90 h-9 text-sm font-medium">
                          Get Started
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </>
  );
}
