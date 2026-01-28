"use client";
import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function BackToTop() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 900);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          whileHover={{ scale: 1.07 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 z-40 group rounded-full bg-brand-darker/80 backdrop-blur-xl border border-white/10 shadow-lg px-4 py-4 text-brand-light hover:border-brand-primary/40 hover:shadow-[0_0_0_1px_hsl(var(--brand-primary)/0.25),0_8px_32px_-4px_hsl(var(--brand-primary)/0.3)] transition"
          aria-label="Back to top"
        >
          <ArrowUp className="h-5 w-5 group-hover:text-brand-primary transition" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
