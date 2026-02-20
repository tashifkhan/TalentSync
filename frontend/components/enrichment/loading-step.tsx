"use client";

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

interface EnrichmentLoadingStepProps {
  title: string;
  description: string;
}

export function EnrichmentLoadingStep({
  title,
  description,
}: EnrichmentLoadingStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="py-12 text-center"
    >
      <div className="relative w-20 h-20 mx-auto mb-6">
        {/* Outer ring */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-brand-primary/30"
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        />
        {/* Inner spinner */}
        <motion.div
          className="absolute inset-2 rounded-full border-2 border-transparent border-t-brand-primary"
          animate={{ rotate: -360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        />
        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-brand-primary animate-pulse" />
        </div>
      </div>

      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-white/60 max-w-md mx-auto text-sm">{description}</p>

      {/* Progress dots */}
      <div className="flex justify-center gap-2 mt-6">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-brand-primary"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.3, 1, 0.3],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}
