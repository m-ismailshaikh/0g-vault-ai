import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Terminal, ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="glass-card border border-[rgba(255,255,255,0.05)] rounded-3xl p-12 max-w-lg w-full relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[rgba(220,38,38,0.1)] to-transparent pointer-events-none" />
        
        <div className="relative z-10">
          <div className="size-20 rounded-2xl bg-[rgba(220,38,38,0.1)] border border-[rgba(220,38,38,0.2)] flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(220,38,38,0.15)]">
            <ShieldAlert className="size-10 text-destructive" />
          </div>
          
          <h1 className="text-6xl font-bold font-display text-white mb-2 tracking-tight">404</h1>
          <h2 className="text-xl font-mono text-[#94A3B8] uppercase tracking-widest mb-6">Sector Not Found</h2>
          
          <p className="text-[#94A3B8] mb-8 font-mono text-sm leading-relaxed">
            The neural pathway you are attempting to access does not exist in the current matrix registry. Please verify the coordinate sequence.
          </p>
          
          <Link href="/">
            <Button size="lg" className="w-full sm:w-auto glow-border">
              <Terminal className="size-4 mr-2" />
              Return to Command Center
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
