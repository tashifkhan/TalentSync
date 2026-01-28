"use client";

import { motion } from "framer-motion";
import { Loader } from "@/components/ui/loader";

interface PageLoaderProps {
  isPageLoading: boolean;
}

export default function PageLoader({ isPageLoading }: PageLoaderProps) {
  if (!isPageLoading) return null;
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-brand-dark flex items-center justify-center z-50"
    >
      <Loader variant="pulse" size="xl" text="Loading Hiring Assistant..." />
    </motion.div>
  );
}
