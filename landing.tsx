import { Link } from "wouter";
import { motion, useScroll, useTransform } from "framer-motion";
import { ShieldCheck, BrainCircuit, Network, Zap, ArrowRight, Database, ChevronRight, PlayCircle, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Landing() {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <div className="min-h-screen bg-[#050816] text-[#F8FAFC] overflow-x-hidden selection:bg-primary/30 relative">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[rgba(59,130,246,0.1)] blur-[120px] mix-blend-screen animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[rgba(139,92,246,0.1)] blur-[150px] mix-blend-screen animate-pulse" style={{ animationDuration: '12s', animationDelay: '2s' }} />
        <div className="absolute bottom-[-20%] left-[20%] w-[60%] h-[60%] rounded-full bg-[rgba(16,185,129,0.05)] blur-[150px] mix-blend-screen animate-pulse" style={{ animationDuration: '10s', animationDelay: '4s' }} />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==')] opacity-20 mask-image:linear-gradient(to_bottom,black,transparent)" />
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[rgba(255,255,255,0.05)] bg-[#050816]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 font-display font-bold tracking-tight text-white">
            <div className="size-8 rounded bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.5)]">
              <Database className="size-4 text-white" />
            </div>
            <span className="text-xl tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6]">
              0G Vault AI
            </span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/dashboard">
              <Button className="h-10 px-6 rounded-full bg-white text-black hover:bg-gray-200 font-medium tracking-wide shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all">
                Launch Vault
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-40 pb-20 md:pt-52 md:pb-32 px-6 min-h-[90vh] flex flex-col items-center justify-center text-center">
        <motion.div style={{ y, opacity }} className="max-w-4xl mx-auto space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] backdrop-blur-sm text-xs font-mono text-[#94A3B8] uppercase tracking-widest mb-4"
          >
            <span className="size-2 rounded-full bg-[#10B981] animate-pulse" />
            0G Infrastructure Online
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-6xl md:text-8xl font-bold font-display tracking-tighter leading-tight"
          >
            <span className="text-white">Store. </span>
            <span className="text-[#94A3B8]">Understand. </span>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#3B82F6] via-[#8B5CF6] to-[#10B981]">Verify.</span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl md:text-2xl text-[#94A3B8] font-light max-w-2xl mx-auto leading-relaxed"
          >
            The AI Knowledge Vault Built on 0G. Decentralized Storage + AI-Powered Analysis + On-Chain Verification.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8"
          >
            <Link href="/dashboard">
              <Button className="h-14 px-8 rounded-full bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] hover:from-[#2563EB] hover:to-[#7C3AED] text-white font-semibold tracking-wide text-lg shadow-[0_0_30px_rgba(59,130,246,0.3)] hover:shadow-[0_0_40px_rgba(139,92,246,0.4)] transition-all glow-border">
                Launch Vault <ArrowRight className="ml-2 size-5" />
              </Button>
            </Link>
            <Button variant="outline" className="h-14 px-8 rounded-full border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.05)] text-white font-medium text-lg backdrop-blur-sm" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
              <PlayCircle className="mr-2 size-5" /> Watch Demo
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section id="features" className="relative z-10 py-32 px-6 bg-[rgba(11,16,32,0.4)] border-y border-[rgba(255,255,255,0.02)]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold font-display text-white mb-6">Uncompromised Intelligence</h2>
            <p className="text-[#94A3B8] max-w-2xl mx-auto text-lg">Next-generation architecture combining the permanence of Web3 with the cognitive capabilities of modern AI.</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <FeatureCard 
              icon={<ShieldCheck className="size-8 text-[#10B981]" />}
              title="Decentralized Storage"
              description="Your knowledge base is fragmented and distributed across the 0G Network, ensuring absolute permanence and censorship resistance."
              color="rgba(16,185,129,0.1)"
            />
            <FeatureCard 
              icon={<BrainCircuit className="size-8 text-[#8B5CF6]" />}
              title="AI Analysis"
              description="Instant semantic understanding of every uploaded document. Query your entire vault simultaneously with advanced RAG models."
              color="rgba(139,92,246,0.1)"
            />
            <FeatureCard 
              icon={<Network className="size-8 text-[#3B82F6]" />}
              title="0G Verification"
              description="Every piece of knowledge is cryptographically verified on-chain. Track the exact provenance of every byte of data."
              color="rgba(59,130,246,0.1)"
            />
            <FeatureCard 
              icon={<Zap className="size-8 text-[#F59E0B]" />}
              title="Instant Retrieval"
              description="Sub-second semantic search across massive document corpuses. Stop searching for keywords and start asking complex questions."
              color="rgba(245,158,11,0.1)"
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="relative z-10 py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold font-display text-white mb-6">The Workflow</h2>
            <p className="text-[#94A3B8] max-w-2xl mx-auto text-lg">Frictionless transition from raw data to verified intelligence.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-[1px] bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.1)] to-transparent" />
            
            <StepCard step="01" title="Upload" description="Drop your documents. They are instantly hashed, chunked, and distributed across the 0G network." />
            <StepCard step="02" title="Analyze" description="Our neural engine extracts entities, concepts, and relationships, building a semantic graph." />
            <StepCard step="03" title="Verify" description="Query the vault. Every answer is backed by cryptographically verified source material." />
          </div>
        </div>
      </section>

      {/* 0G Infrastructure */}
      <section className="relative z-10 py-32 px-6 bg-[rgba(59,130,246,0.03)] border-t border-[rgba(59,130,246,0.1)]">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center justify-center size-16 rounded-2xl bg-[rgba(59,130,246,0.1)] border border-[rgba(59,130,246,0.2)] mb-8 shadow-[0_0_30px_rgba(59,130,246,0.15)]">
            <Cpu className="size-8 text-[#3B82F6]" />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold font-display text-white mb-8">Powered by 0G Storage</h2>
          <p className="text-xl text-[#94A3B8] font-light leading-relaxed mb-12 max-w-3xl mx-auto">
            Traditional AI relies on centralized, opaque data lakes. 0G Vault AI leverages the world's first infinitely scalable, verifiable data availability layer. Your knowledge isn't just stored—it's mathematically proven to exist.
          </p>
          <Link href="/dashboard">
            <Button className="h-12 px-8 rounded-full bg-white text-black hover:bg-gray-200 font-medium tracking-wide shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all">
              Initialize System <ChevronRight className="ml-2 size-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-12 px-6 border-t border-[rgba(255,255,255,0.05)] text-center">
        <p className="text-sm font-mono text-[#94A3B8] opacity-50 uppercase tracking-widest">
          0G Vault AI — Hackathon Build
        </p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description, color }: { icon: React.ReactNode, title: string, description: string, color: string }) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="p-8 rounded-2xl glass-card border border-[rgba(255,255,255,0.05)] hover:border-[rgba(255,255,255,0.1)] transition-all relative overflow-hidden group"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/50" />
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-[50px] opacity-0 group-hover:opacity-50 transition-opacity duration-500 pointer-events-none" style={{ background: color }} />
      <div className="relative z-10">
        <div className="mb-6 inline-flex p-4 rounded-xl border border-[rgba(255,255,255,0.05)] bg-[rgba(0,0,0,0.3)] shadow-inner">
          {icon}
        </div>
        <h3 className="text-2xl font-bold font-display text-white mb-4">{title}</h3>
        <p className="text-[#94A3B8] leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
}

function StepCard({ step, title, description }: { step: string, title: string, description: string }) {
  return (
    <div className="relative z-10 flex flex-col items-center text-center p-6">
      <div className="size-16 rounded-full bg-[#050816] border border-[rgba(255,255,255,0.1)] flex items-center justify-center font-mono text-xl text-white font-bold mb-6 shadow-[0_0_20px_rgba(0,0,0,0.5)] z-20">
        {step}
      </div>
      <h3 className="text-2xl font-bold font-display text-white mb-4">{title}</h3>
      <p className="text-[#94A3B8] leading-relaxed">{description}</p>
    </div>
  );
}
