import { useParams, Link, useLocation } from "wouter";
import { useGetDocument } from "@workspace/api-client-react";
import { formatBytes, formatRelativeDate } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText,
  HardDrive,
  Calendar,
  ArrowLeft,
  MessageSquare,
  Terminal,
  Sparkles,
  Network,
  ShieldCheck,
  Hash,
  ExternalLink,
  Copy,
  Check,
  Activity,
  BrainCircuit,
  Clock,
  Type
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const STOP_WORDS = new Set(["the", "and", "is", "in", "to", "of", "it", "that", "on", "for", "with", "as", "was", "at", "by", "an", "be", "this", "which", "or", "from", "but", "not", "are", "have", "has", "all", "they", "we", "can", "will"]);

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      data-testid="button-copy-hash"
      onClick={handleCopy}
      className="ml-2 p-1 rounded text-[#94A3B8] hover:text-white transition-colors"
      title="Copy to clipboard"
    >
      {copied ? <Check className="size-3 text-[#10B981]" /> : <Copy className="size-3" />}
    </button>
  );
}

function HashField({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-[#94A3B8] mb-1 opacity-70 uppercase tracking-widest text-[10px]">{label}</p>
      <div className="flex items-center bg-[rgba(0,0,0,0.3)] p-2 rounded border border-[rgba(255,255,255,0.05)]">
        <p className="text-[#60A5FA] break-all select-all text-[11px] flex-1">{value}</p>
        <CopyButton value={value} />
      </div>
    </div>
  );
}

export default function DocumentDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { data: doc, isLoading } = useGetDocument(parseInt(id || "0"));

  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summaryText, setSummaryText] = useState("");
  const [isSummarizing, setIsSummarizing] = useState(false);

  const isZeroG = doc?.storageProvider === "zerog";
  const zerogScanBase = "https://chainscan-galileo.0g.ai/tx/";

  const analysis = useMemo(() => {
    if (!doc?.extractedText) return null;
    const text = doc.extractedText;
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    const charCount = text.length;
    const readTime = Math.ceil(wordCount / 200) + " min";
    
    const words = text.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/);
    const counts: Record<string, number> = {};
    words.forEach(w => {
      if (w.length > 3 && !STOP_WORDS.has(w)) counts[w] = (counts[w] || 0) + 1;
    });
    const topTopics = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(t => t[0]);

    return { wordCount, charCount, readTime, topTopics };
  }, [doc?.extractedText]);

  const handleCreateChat = async (question?: string) => {
    if (!doc) return;
    try {
      const res = await fetch("/api/chat/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: doc.name, documentId: doc.id }),
      });
      const conv = await res.json();
      
      // If a specific question is asked, we might want to auto-send it
      // For now we just navigate to chat, we could pass it via query params but chat view will handle it if we have it
      // To simplify, we just navigate to the chat room
      setLocation(`/chat/${conv.id}`);
    } catch (e) {
      toast({ title: "Error", description: "Failed to create conversation", variant: "destructive" });
    }
  };

  const handleGenerateSummary = async () => {
    if (!doc) return;
    setSummaryText("");
    setSummaryOpen(true);
    setIsSummarizing(true);
    try {
      const response = await fetch("/api/chat/vault-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: `Generate a detailed executive summary of the document titled '${doc.name}' including overview, key points, risks, and recommendations.` }),
      });
      if (!response.ok) throw new Error("Failed to summarize");
      
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let text = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                text += data.content;
                setSummaryText(text);
              }
            } catch (e) {}
          }
        }
      }
    } catch (e) {
      setSummaryText("Failed to generate executive summary.");
    } finally {
      setIsSummarizing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8 max-w-6xl mx-auto">
        <Skeleton className="h-8 w-24 bg-[rgba(255,255,255,0.05)]" />
        <Skeleton className="h-12 w-2/3 bg-[rgba(255,255,255,0.05)]" />
        <div className="grid lg:grid-cols-3 gap-6">
          <Skeleton className="h-[600px] lg:col-span-2 bg-[rgba(255,255,255,0.05)]" />
          <Skeleton className="h-[400px] bg-[rgba(255,255,255,0.05)]" />
        </div>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="text-center py-20 glass-card rounded-xl border border-[rgba(255,255,255,0.05)] max-w-2xl mx-auto mt-10">
        <Terminal className="size-12 text-[#94A3B8] mx-auto mb-4 opacity-50" />
        <h2 className="text-2xl font-display font-bold text-white mb-2">Matrix Not Found</h2>
        <p className="text-[#94A3B8] mb-6">The requested document does not exist in the vault.</p>
        <Link href="/documents">
          <Button variant="outline" className="border-[rgba(255,255,255,0.1)] text-white">Return to Vault</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <Link href="/documents" className="inline-flex items-center text-sm font-mono text-[#94A3B8] hover:text-white transition-colors mb-4">
          <ArrowLeft className="size-4 mr-2" /> Back to Knowledge Base
        </Link>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="max-w-3xl">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white font-display leading-tight">{doc.name}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-4 text-xs text-[#94A3B8] font-mono uppercase tracking-wider">
              <span className="flex items-center gap-1.5 px-2 py-1 rounded bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.05)]">
                <Network className="size-3 text-primary" />
                ID: {doc.id}
              </span>
              <span className="flex items-center gap-1.5 px-2 py-1 rounded bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.05)]">
                <HardDrive className="size-3 text-primary" />
                {formatBytes(doc.sizeBytes || 0)}
              </span>
              <span className="flex items-center gap-1.5 px-2 py-1 rounded bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.05)]">
                <Calendar className="size-3 text-primary" />
                {formatRelativeDate(doc.createdAt)}
              </span>
              {isZeroG && (
                <span
                  data-testid="badge-zerog-verified"
                  className="flex items-center gap-1.5 px-2 py-1 rounded bg-[rgba(16,185,129,0.1)] border border-[rgba(16,185,129,0.2)] text-[#10B981]"
                >
                  <ShieldCheck className="size-3" />
                  Verified on 0G Storage
                </span>
              )}
              {doc.extractedText && (
                <span className="flex items-center gap-1.5 px-2 py-1 rounded bg-[rgba(139,92,246,0.1)] border border-[rgba(139,92,246,0.2)] text-[#8B5CF6]">
                  <Sparkles className="size-3" />
                  Indexed
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Button
              onClick={() => handleCreateChat()}
              className="shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:shadow-[0_0_25px_rgba(59,130,246,0.5)] transition-all glow-border"
            >
              <MessageSquare className="size-4 mr-2" /> Query Document
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Suggested Questions Section */}
      {analysis && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap items-center gap-3 p-4 rounded-xl glass-card border border-[rgba(255,255,255,0.05)]"
        >
          <span className="text-sm font-display text-white flex items-center gap-2">
            <BrainCircuit className="size-4 text-[#8B5CF6]" /> Ask:
          </span>
          {[
            "Summarize this document",
            "What are the key findings?",
            "Generate study notes",
            "Explain the main concepts"
          ].map(q => (
            <button
              key={q}
              onClick={() => handleCreateChat(q)}
              className="px-3 py-1.5 rounded-full bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(59,130,246,0.1)] border border-[rgba(255,255,255,0.05)] hover:border-[rgba(59,130,246,0.3)] text-xs font-mono text-[#94A3B8] hover:text-[#60A5FA] transition-all"
            >
              {q}
            </button>
          ))}
          <div className="ml-auto">
             <Button size="sm" variant="secondary" onClick={handleGenerateSummary} className="bg-[rgba(139,92,246,0.1)] hover:bg-[rgba(139,92,246,0.2)] text-[#8B5CF6] border border-[rgba(139,92,246,0.2)]">
               <Sparkles className="size-3 mr-2" /> Executive Summary
             </Button>
          </div>
        </motion.div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 glass-card border border-[rgba(255,255,255,0.05)] rounded-2xl overflow-hidden flex flex-col"
        >
          <div className="p-4 border-b border-[rgba(255,255,255,0.05)] bg-[rgba(11,16,32,0.8)] flex items-center justify-between">
             <h2 className="text-sm font-semibold tracking-wider font-display uppercase text-[#94A3B8] flex items-center gap-2">
               <FileText className="size-4 text-[#3B82F6]" /> Extracted Data
             </h2>
             <div className="flex gap-1.5">
               <div className="size-2.5 rounded-full bg-red-500/50" />
               <div className="size-2.5 rounded-full bg-yellow-500/50" />
               <div className="size-2.5 rounded-full bg-green-500/50" />
             </div>
          </div>
          {doc.extractedText ? (
            <div className="p-6 h-[600px] overflow-y-auto font-mono text-[13px] leading-relaxed text-[#F8FAFC] custom-scrollbar selection:bg-primary/30">
              {doc.extractedText}
            </div>
          ) : (
            <div className="h-[600px] flex flex-col items-center justify-center text-center p-8 bg-[rgba(0,0,0,0.2)]">
              <Terminal className="size-10 text-[#3B82F6] mb-4 opacity-50 animate-pulse" />
              <p className="text-[#94A3B8] font-mono text-sm">Processing data matrix... Please wait.</p>
            </div>
          )}
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          {/* Smart Document Analysis */}
          {analysis && (
            <div className="glass-card border border-[rgba(139,92,246,0.2)] rounded-2xl overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[rgba(139,92,246,0.05)] to-transparent pointer-events-none" />
              <div className="p-4 border-b border-[rgba(139,92,246,0.1)] bg-[rgba(11,16,32,0.8)]">
                <h2 className="text-sm font-semibold tracking-wider font-display uppercase text-[#8B5CF6] flex items-center gap-2">
                  <Activity className="size-4" /> Smart Analysis
                </h2>
              </div>
              <div className="p-5 space-y-4 font-mono text-xs relative z-10">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[#94A3B8] opacity-70 mb-1 flex items-center gap-1.5"><Type className="size-3" /> Words</p>
                    <p className="text-white text-lg">{analysis.wordCount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[#94A3B8] opacity-70 mb-1 flex items-center gap-1.5"><Clock className="size-3" /> Read Time</p>
                    <p className="text-white text-lg">{analysis.readTime}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[#94A3B8] opacity-70 mb-1 flex items-center gap-1.5"><Hash className="size-3" /> Characters</p>
                    <p className="text-white text-lg">{analysis.charCount.toLocaleString()}</p>
                  </div>
                </div>
                {analysis.topTopics.length > 0 && (
                  <div className="pt-2 border-t border-[rgba(255,255,255,0.05)]">
                    <p className="text-[#94A3B8] opacity-70 mb-2 uppercase tracking-widest text-[10px]">Top Topics</p>
                    <div className="flex flex-wrap gap-2">
                      {analysis.topTopics.map(topic => (
                        <span key={topic} className="px-2 py-1 rounded bg-[rgba(255,255,255,0.05)] text-[#F8FAFC]">
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {isZeroG && (
            <div className="glass-card border border-[rgba(16,185,129,0.2)] rounded-2xl overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[rgba(16,185,129,0.05)] to-transparent pointer-events-none" />
              <div className="p-4 border-b border-[rgba(16,185,129,0.1)] bg-[rgba(11,16,32,0.8)]">
                <h2 className="text-sm font-semibold tracking-wider font-display uppercase text-[#10B981] flex items-center gap-2">
                  <ShieldCheck className="size-4" /> 0G Storage Verification
                </h2>
              </div>
              <div className="p-5 space-y-5 font-mono text-xs relative z-10">
                <div className="flex items-center gap-2 p-2 rounded bg-[rgba(16,185,129,0.1)] border border-[rgba(16,185,129,0.2)]">
                  <ShieldCheck className="size-4 text-[#10B981] shrink-0" />
                  <div>
                    <p className="text-[#10B981] font-semibold">Verification Status</p>
                    <p className="text-[#94A3B8] text-[10px]">Permanently stored on 0G decentralized network</p>
                  </div>
                </div>
                <HashField label="0G Root Hash" value={doc.rootHash} />
                <HashField label="Transaction Hash" value={doc.txHash} />
                {doc.txHash && (
                  <a
                    data-testid="link-explorer"
                    href={`${zerogScanBase}${doc.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-[#3B82F6] hover:text-[#60A5FA] transition-colors text-[11px] font-mono"
                  >
                    <ExternalLink className="size-3" />
                    View on 0G Explorer
                  </a>
                )}
                <div>
                  <p className="text-[#94A3B8] mb-1 opacity-70 uppercase tracking-widest text-[10px]">Storage Provider</p>
                  <div className="flex items-center gap-2">
                    <Hash className="size-3 text-[#10B981]" />
                    <span className="text-[#10B981]">0G Decentralized Storage</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="glass-card border border-[rgba(255,255,255,0.05)] rounded-2xl overflow-hidden">
             <div className="p-4 border-b border-[rgba(255,255,255,0.05)] bg-[rgba(11,16,32,0.8)]">
               <h2 className="text-sm font-semibold tracking-wider font-display uppercase text-[#94A3B8]">System Metadata</h2>
             </div>
             <div className="p-5 space-y-5 font-mono text-xs">
               {!isZeroG && (
                 <div>
                   <p className="text-[#94A3B8] mb-1 opacity-70 uppercase tracking-widest text-[10px]">Object Path</p>
                   <p className="text-[#F8FAFC] break-all bg-[rgba(0,0,0,0.3)] p-2 rounded border border-[rgba(255,255,255,0.05)] select-all">{doc.objectPath}</p>
                 </div>
               )}
               <div>
                 <p className="text-[#94A3B8] mb-1 opacity-70 uppercase tracking-widest text-[10px]">MIME Type</p>
                 <p className="text-[#60A5FA]">{doc.mimeType}</p>
               </div>
               <div>
                 <p className="text-[#94A3B8] mb-1 opacity-70 uppercase tracking-widest text-[10px]">File Size</p>
                 <p className="text-white">{formatBytes(doc.sizeBytes || 0)}</p>
               </div>
               <div>
                 <p className="text-[#94A3B8] mb-1 opacity-70 uppercase tracking-widest text-[10px]">Uploaded</p>
                 <p className="text-white">{new Date(doc.createdAt).toLocaleString()}</p>
               </div>
               <div>
                 <p className="text-[#94A3B8] mb-1 opacity-70 uppercase tracking-widest text-[10px]">Last Modified</p>
                 <p className="text-white">{new Date(doc.updatedAt).toLocaleString()}</p>
               </div>
             </div>
          </div>
        </motion.div>
      </div>

      <Dialog open={summaryOpen} onOpenChange={setSummaryOpen}>
        <DialogContent className="glass-card border-[rgba(255,255,255,0.1)] text-white max-w-2xl bg-[rgba(11,16,32,0.95)]">
          <DialogHeader>
            <DialogTitle className="font-display tracking-wide flex items-center gap-2">
              <Sparkles className="size-5 text-[#8B5CF6]" />
              Executive Summary
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4 p-4 rounded-lg bg-[rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.05)] min-h-[150px] max-h-[60vh] overflow-y-auto font-sans text-sm leading-relaxed prose prose-invert custom-scrollbar">
            {summaryText}
            {isSummarizing && <span className="inline-block w-2 h-4 ml-1 bg-[#8B5CF6] animate-pulse align-middle" />}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

