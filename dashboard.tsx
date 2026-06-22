import { useState, useRef, useEffect, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { useGetDocumentStats, useListDocuments } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, MessageSquare, HardDrive, Sparkles, Activity, ShieldCheck, Send, Network, X } from "lucide-react";
import { formatBytes, formatRelativeDate } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

function truncateHash(hash: string | null | undefined, chars = 8): string {
  if (!hash) return "";
  return `${hash.slice(0, chars)}...${hash.slice(-4)}`;
}

const STOP_WORDS = new Set(["the", "and", "is", "in", "to", "of", "it", "that", "on", "for", "with", "as", "was", "at", "by", "an", "be", "this", "which", "or", "from", "but", "not", "are", "have", "has", "all", "they", "we", "can", "will"]);

function extractKeywords(docs: any[]) {
  const counts: Record<string, number> = {};
  docs.forEach(doc => {
    if (!doc.extractedText) return;
    const words = doc.extractedText.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/);
    words.forEach((w: string) => {
      if (w.length > 3 && !STOP_WORDS.has(w)) {
        counts[w] = (counts[w] || 0) + 1;
      }
    });
  });
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 30);
}

function AnimatedCounter({ value }: { value: number }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const duration = 1000;
    const stepTime = Math.abs(Math.floor(duration / Math.max(value, 1)));
    const timer = setInterval(() => {
      start += Math.ceil(value / 20) || 1;
      if (start >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, stepTime);
    return () => clearInterval(timer);
  }, [value]);
  return <>{count}</>;
}

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetDocumentStats();
  const { data: documents, isLoading: docsLoading } = useListDocuments({ limit: 5 });
  const { data: allDocs } = useListDocuments({ limit: 100 });
  const [, setLocation] = useLocation();

  const [vaultQuery, setVaultQuery] = useState("");
  const [vaultResponse, setVaultResponse] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [queryError, setQueryError] = useState(false);
  const responseRef = useRef<HTMLDivElement>(null);

  const keywords = useMemo(() => allDocs ? extractKeywords(allDocs) : [], [allDocs]);

  useEffect(() => {
    if (responseRef.current && isStreaming) {
      responseRef.current.scrollTop = responseRef.current.scrollHeight;
    }
  }, [vaultResponse, isStreaming]);

  const handleVaultQuery = async (queryStr: string) => {
    if (!queryStr.trim() || isStreaming) return;
    setVaultQuery(queryStr);
    setVaultResponse("");
    setIsStreaming(true);
    setQueryError(false);

    try {
      const res = await fetch("/api/chat/vault-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: queryStr }),
      });

      if (!res.ok) {
        setQueryError(true);
        setIsStreaming(false);
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let assistantMsg = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");
        
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.noApiKey || data.noDocuments) {
                setQueryError(true);
                break;
              }
              if (data.content) {
                assistantMsg += data.content;
                setVaultResponse(assistantMsg);
              }
            } catch (e) {}
          }
        }
      }
    } catch (err) {
      setQueryError(true);
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div className="space-y-10 max-w-6xl mx-auto pb-20">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-3 relative"
      >
        <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-1 h-12 bg-gradient-to-b from-primary to-accent rounded-full hidden md:block glow-border" />
        <h1 className="text-4xl font-bold tracking-tight text-white font-display text-gradient">Vault Overview</h1>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 text-[#94A3B8] font-mono text-xs uppercase tracking-wider">
            <Activity className="size-3 text-primary animate-pulse" />
            <span>System Status: Optimal</span>
          </div>
          <div className="flex items-center gap-2 text-[#10B981] font-mono text-xs uppercase tracking-wider px-2 py-0.5 rounded bg-[rgba(16,185,129,0.1)] border border-[rgba(16,185,129,0.2)]">
            <ShieldCheck className="size-3" />
            <span>Storage Provider: 0G Storage</span>
          </div>
        </div>
      </motion.div>

      {/* Ask Entire Vault Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative z-20"
      >
        <div className="p-6 rounded-2xl glass-card border border-[rgba(255,255,255,0.05)] shadow-2xl overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-[rgba(59,130,246,0.05)] to-[rgba(139,92,246,0.05)] pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="size-5 text-[#8B5CF6]" />
              <h2 className="text-xl font-display font-semibold text-white">Ask Entire Vault</h2>
            </div>
            
            <form onSubmit={(e) => { e.preventDefault(); handleVaultQuery(vaultQuery); }} className="relative flex items-center mb-4">
              <Input
                value={vaultQuery}
                onChange={e => setVaultQuery(e.target.value)}
                placeholder="Ask anything across your entire vault..."
                className="w-full h-14 pl-5 pr-16 bg-[rgba(0,0,0,0.3)] border-[rgba(255,255,255,0.1)] font-mono text-sm rounded-xl focus-visible:ring-[#8B5CF6]/50 focus-visible:border-[#8B5CF6] text-white shadow-inner placeholder:text-[#94A3B8]/50"
                disabled={isStreaming}
              />
              <Button type="submit" size="icon" disabled={isStreaming || !vaultQuery.trim()} className="absolute right-2 h-10 w-10 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-lg transition-all glow-border">
                <Send className="size-4" />
              </Button>
            </form>

            <div className="flex flex-wrap gap-2">
              {["Summarize all documents", "Find key topics", "Compare files", "Generate executive summary", "Identify risks"].map(pill => (
                <button
                  key={pill}
                  onClick={() => handleVaultQuery(pill)}
                  disabled={isStreaming}
                  className="px-3 py-1.5 rounded-full bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(59,130,246,0.1)] border border-[rgba(255,255,255,0.05)] hover:border-[rgba(59,130,246,0.3)] text-xs font-mono text-[#94A3B8] hover:text-[#60A5FA] transition-all cursor-pointer disabled:opacity-50"
                >
                  {pill}
                </button>
              ))}
            </div>

            <AnimatePresence>
              {(vaultResponse || isStreaming || queryError) && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: "auto", marginTop: 24 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-5 rounded-xl bg-[rgba(0,0,0,0.4)] border border-[rgba(255,255,255,0.05)] relative">
                    <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6 text-[#94A3B8] hover:text-white" onClick={() => { setVaultResponse(""); setVaultQuery(""); setQueryError(false); }}>
                      <X className="size-3" />
                    </Button>
                    <h3 className="text-xs font-mono text-[#8B5CF6] uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Activity className="size-3" /> Analysis Result
                    </h3>
                    
                    {queryError ? (
                      <div className="flex items-center gap-2 text-destructive font-mono text-sm">
                        <AlertCircle className="size-4" />
                        <span>Query failed. Make sure you have documents in your vault and GROQ_API_KEY is set.</span>
                      </div>
                    ) : (
                      <div ref={responseRef} className="max-h-[300px] overflow-y-auto font-sans text-sm text-[#F8FAFC] leading-relaxed prose prose-invert max-w-none custom-scrollbar whitespace-pre-wrap">
                        {vaultResponse}
                        {isStreaming && <span className="inline-block w-2 h-4 ml-1 bg-[#8B5CF6] animate-pulse align-middle" />}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <QuickActionButton 
          icon={<FileText />} 
          label="Summarize Vault" 
          onClick={() => handleVaultQuery("Summarize all documents in the vault")} 
        />
        <QuickActionButton 
          icon={<Activity />} 
          label="Generate Report" 
          onClick={() => handleVaultQuery("Generate a comprehensive report of all documents")} 
        />
        <QuickActionButton 
          icon={<Network />} 
          label="Find Key Topics" 
          onClick={() => handleVaultQuery("List the main topics across all documents")} 
        />
        <QuickActionButton 
          icon={<ShieldCheck />} 
          label="Executive Summary" 
          onClick={() => handleVaultQuery("Generate an executive summary of all vault documents")} 
        />
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Documents"
          value={statsLoading ? null : <AnimatedCounter value={stats?.totalDocuments || 0} />}
          icon={<FileText className="size-5 text-[#3B82F6]" />}
          delay={0.3}
        />
        <StatCard
          title="Total Size"
          value={statsLoading ? null : stats?.totalSizeBytes ? formatBytes(stats.totalSizeBytes) : "0 B"}
          icon={<HardDrive className="size-5 text-[#60A5FA]" />}
          delay={0.4}
        />
        <StatCard
          title="Extracted Text"
          value={statsLoading ? null : <AnimatedCounter value={stats?.documentsWithText || 0} />}
          icon={<Sparkles className="size-5 text-[#8B5CF6]" />}
          delay={0.5}
        />
        <StatCard
          title="Conversations"
          value={statsLoading ? null : <AnimatedCounter value={stats?.totalConversations || 0} />}
          icon={<MessageSquare className="size-5 text-accent" />}
          delay={0.6}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2 space-y-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold tracking-tight text-white font-display">Recent Activity</h2>
            <Link href="/documents" className="text-sm text-primary hover:text-accent transition-colors font-mono uppercase tracking-widest flex items-center gap-2">
              View All Vault <span className="text-lg">→</span>
            </Link>
          </div>

          {docsLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-xl bg-[rgba(255,255,255,0.02)]" />
              ))}
            </div>
          ) : documents?.length === 0 ? (
            <div className="text-center py-20 border border-[rgba(255,255,255,0.05)] rounded-2xl glass-card relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-[rgba(59,130,246,0.05)] to-transparent" />
              <FileText className="size-12 mx-auto text-[#3B82F6] mb-4 opacity-50" />
              <h3 className="text-xl font-medium text-white mb-2 font-display">No knowledge stored yet</h3>
              <p className="text-[#94A3B8]">Upload documents to start building your vault.</p>
              <div className="mt-6">
                <Link href="/documents" className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 glow-border">
                  Upload Document
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid gap-4">
              {documents?.map((doc, i) => (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + (i * 0.1) }}
                  key={doc.id}
                >
                  <Link href={`/documents/${doc.id}`}>
                    <div
                      data-testid={`card-document-${doc.id}`}
                      className="group relative flex items-center justify-between p-5 rounded-xl border border-[rgba(255,255,255,0.05)] glass-card hover:border-[rgba(59,130,246,0.3)] transition-all duration-300 cursor-pointer overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-[rgba(59,130,246,0.1)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="flex items-center gap-5 relative z-10 min-w-0">
                        <div className="size-12 shrink-0 rounded-lg bg-[rgba(59,130,246,0.1)] flex items-center justify-center border border-[rgba(59,130,246,0.2)] group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(59,130,246,0.15)]">
                          <FileText className="size-6 text-[#3B82F6]" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-[#F8FAFC] text-lg group-hover:text-[#60A5FA] transition-colors truncate">{doc.name}</p>
                          <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-[#94A3B8] font-mono">
                            <span className="flex items-center gap-1"><HardDrive className="size-3" /> {formatBytes(doc.sizeBytes || 0)}</span>
                            <span className="opacity-30">•</span>
                            <span>{formatRelativeDate(doc.createdAt)}</span>
                            {doc.rootHash && (
                              <>
                                <span className="opacity-30">•</span>
                                <span className="text-[#60A5FA]" title={doc.rootHash}>
                                  Root: {truncateHash(doc.rootHash)}
                                </span>
                              </>
                            )}
                            {doc.extractedText && (
                              <>
                                <span className="opacity-30">•</span>
                                <span className="text-[#8B5CF6] flex items-center gap-1"><Sparkles className="size-3" /> Indexed</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="relative z-10 flex items-center gap-3 shrink-0 ml-4">
                        {doc.storageProvider === "zerog" && (
                          <div
                            data-testid={`badge-verified-${doc.id}`}
                            className="hidden sm:flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-[#10B981] bg-[rgba(16,185,129,0.1)] border border-[rgba(16,185,129,0.25)] px-2 py-1 rounded-full"
                          >
                            <ShieldCheck className="size-3" />
                            Verified
                          </div>
                        )}
                        <span className="text-[#3B82F6] opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">→</span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Knowledge Graph */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="lg:col-span-1"
        >
          <div className="glass-card border border-[rgba(255,255,255,0.05)] rounded-2xl p-5 h-full flex flex-col">
            <h2 className="text-lg font-semibold tracking-tight text-white font-display mb-4 flex items-center gap-2">
              <Network className="size-4 text-[#8B5CF6]" /> Knowledge Graph
            </h2>
            
            <div className="flex-1 min-h-[300px] relative bg-[rgba(0,0,0,0.2)] rounded-xl border border-[rgba(255,255,255,0.02)] overflow-hidden flex items-center justify-center p-4">
              {keywords.length > 0 ? (
                <div className="w-full h-full relative">
                  <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    {/* Simplified connecting lines for aesthetics */}
                    <line x1="50%" y1="20%" x2="20%" y2="60%" stroke="rgba(139,92,246,0.2)" strokeWidth="1" />
                    <line x1="50%" y1="20%" x2="80%" y2="60%" stroke="rgba(139,92,246,0.2)" strokeWidth="1" />
                    <line x1="50%" y1="20%" x2="50%" y2="80%" stroke="rgba(139,92,246,0.2)" strokeWidth="1" />
                    <line x1="20%" y1="60%" x2="50%" y2="80%" stroke="rgba(139,92,246,0.2)" strokeWidth="1" />
                    <line x1="80%" y1="60%" x2="50%" y2="80%" stroke="rgba(139,92,246,0.2)" strokeWidth="1" />
                  </svg>
                  
                  {/* Root / Main cluster */}
                  <div className="absolute top-[20%] left-1/2 -translate-x-1/2 -translate-y-1/2 px-3 py-1.5 rounded-full bg-[rgba(139,92,246,0.2)] border border-[rgba(139,92,246,0.4)] text-white text-xs font-mono shadow-[0_0_15px_rgba(139,92,246,0.3)]">
                    {keywords[0]?.[0] || 'core'}
                  </div>

                  {/* Sub clusters */}
                  <div className="absolute top-[60%] left-[20%] -translate-x-1/2 -translate-y-1/2 px-2 py-1 rounded bg-[rgba(59,130,246,0.15)] border border-[rgba(59,130,246,0.3)] text-[#60A5FA] text-[10px] font-mono">
                    {keywords[1]?.[0] || 'data'}
                  </div>
                  <div className="absolute top-[60%] left-[80%] -translate-x-1/2 -translate-y-1/2 px-2 py-1 rounded bg-[rgba(16,185,129,0.15)] border border-[rgba(16,185,129,0.3)] text-[#10B981] text-[10px] font-mono">
                    {keywords[2]?.[0] || 'info'}
                  </div>
                  <div className="absolute top-[80%] left-[50%] -translate-x-1/2 -translate-y-1/2 px-2 py-1 rounded bg-[rgba(245,158,11,0.15)] border border-[rgba(245,158,11,0.3)] text-[#F59E0B] text-[10px] font-mono">
                    {keywords[3]?.[0] || 'system'}
                  </div>

                  {/* Other words floating */}
                  {keywords.slice(4, 12).map((kw, idx) => {
                    const top = 10 + (idx * 11) % 80;
                    const left = 10 + (idx * 23) % 80;
                    return (
                      <div 
                        key={kw[0]}
                        className="absolute text-[#94A3B8] text-[9px] font-mono opacity-60"
                        style={{ top: `${top}%`, left: `${left}%` }}
                      >
                        {kw[0]}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center">
                  <Network className="size-8 text-[#94A3B8] opacity-20 mx-auto mb-2" />
                  <p className="text-xs text-[#94A3B8] font-mono uppercase tracking-widest opacity-50">Awaiting Indexing</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function QuickActionButton({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick: () => void }) {
  return (
    <Button 
      variant="outline" 
      onClick={onClick}
      className="h-auto py-4 flex flex-col gap-2 bg-[rgba(11,16,32,0.6)] border-[rgba(255,255,255,0.05)] hover:bg-[rgba(59,130,246,0.1)] hover:border-[rgba(59,130,246,0.3)] hover:text-white transition-all glass-card"
    >
      <div className="text-[#8B5CF6]">{icon}</div>
      <span className="text-xs font-mono tracking-wide">{label}</span>
    </Button>
  );
}

function StatCard({ title, value, icon, delay }: { title: string; value: React.ReactNode; icon: React.ReactNode; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, type: "spring", stiffness: 100 }}
    >
      <Card className="border-[rgba(255,255,255,0.05)] glass-card overflow-hidden group hover:border-[rgba(59,130,246,0.2)] transition-colors">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all">
          {icon}
        </div>
        <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
          <CardTitle className="text-sm font-medium text-[#94A3B8] uppercase tracking-wider font-mono">{title}</CardTitle>
        </CardHeader>
        <CardContent className="relative z-10">
          {value === null ? (
            <Skeleton className="h-10 w-24 bg-[rgba(255,255,255,0.05)]" />
          ) : (
            <div className="text-4xl font-bold font-display text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">{value}</div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
