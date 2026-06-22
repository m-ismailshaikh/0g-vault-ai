import { useState, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useListDocuments, useDeleteDocument, getListDocumentsQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, Search, Upload, Trash2, Loader2, Sparkles, AlertCircle, Database, MessageSquare, Eye, ShieldCheck } from "lucide-react";
import { formatBytes, formatRelativeDate } from "@/lib/format";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function truncateHash(hash: string | null | undefined, chars = 8): string {
  if (!hash) return "";
  return `${hash.slice(0, chars)}...${hash.slice(-4)}`;
}

export default function Documents() {
  const [search, setSearch] = useState("");
  const { data: documents, isLoading } = useListDocuments({ search });
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const deleteDocument = useDeleteDocument();
  const [, setLocation] = useLocation();

  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summaryText, setSummaryText] = useState("");
  const [summaryDoc, setSummaryDoc] = useState<string>("");
  const [isSummarizing, setIsSummarizing] = useState(false);

  const handleUploadFile = async (file: File) => {
    try {
      setIsUploading(true);
      toast({ title: "Uploading...", description: `Uploading ${file.name}` });

      const form = new FormData();
      form.append("file", file);

      const res = await fetch("/api/documents/upload", { method: "POST", body: form });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Upload failed" }));
        throw new Error(err.error || "Upload failed");
      }

      queryClient.invalidateQueries({ queryKey: getListDocumentsQueryKey() });
      toast({ title: "Success", description: "Document added to vault" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await handleUploadFile(file);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const validTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain", "text/csv"];
      if (validTypes.includes(file.type) || file.name.endsWith(".docx") || file.name.endsWith(".csv")) {
        await handleUploadFile(file);
      } else {
        toast({ title: "Invalid file", description: "Supported formats: PDF, DOCX, TXT, CSV", variant: "destructive" });
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleChat = async (doc: any) => {
    try {
      const res = await fetch("/api/chat/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: doc.name, documentId: doc.id }),
      });
      const conv = await res.json();
      setLocation(`/chat/${conv.id}`);
    } catch (e) {
      toast({ title: "Error", description: "Failed to create conversation", variant: "destructive" });
    }
  };

  const handleSummarize = async (doc: any) => {
    setSummaryDoc(doc.name);
    setSummaryText("");
    setSummaryOpen(true);
    setIsSummarizing(true);
    try {
      const response = await fetch("/api/chat/vault-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: `Summarize this document: ${doc.name}` }),
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
      setSummaryText("Failed to generate summary.");
    } finally {
      setIsSummarizing(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto h-full flex flex-col"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <AnimatePresence>
        {dragActive && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#050816]/80 backdrop-blur-sm border-2 border-dashed border-primary m-4 rounded-xl"
          >
            <div className="text-center">
              <Upload className="size-16 text-primary mx-auto mb-4 animate-bounce" />
              <h2 className="text-2xl font-display font-bold text-white">Drop File to Upload</h2>
              <p className="text-muted-foreground mt-2 font-mono">PDF, DOCX, TXT, CSV supported</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h1 className="text-4xl font-bold tracking-tight text-white font-display text-gradient">Knowledge Base</h1>
          <p className="text-muted-foreground font-mono text-xs uppercase tracking-widest mt-2 flex items-center gap-2">
            <Database className="size-3" /> Manage Vault Documents
          </p>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-4 w-full sm:w-auto"
        >
          <div className="relative w-full sm:w-72 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8] group-focus-within:text-primary transition-colors" />
            <Input
              type="search"
              placeholder="Search data matrices..."
              className="pl-10 bg-[rgba(11,16,32,0.6)] border-[rgba(255,255,255,0.1)] focus-visible:ring-primary/50 focus-visible:border-primary font-mono text-sm h-11"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button 
            onClick={() => fileInputRef.current?.click()} 
            disabled={isUploading}
            className="h-11 px-6 shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:shadow-[0_0_25px_rgba(59,130,246,0.5)] transition-all"
          >
            {isUploading ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Upload className="size-4 mr-2" />}
            Upload File
          </Button>
          <input
            type="file"
            accept="application/pdf,.docx,text/plain,text/csv"
            className="hidden"
            ref={fileInputRef}
            onChange={handleUpload}
          />
        </motion.div>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="size-8 text-primary animate-spin" />
        </div>
      ) : documents?.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex-1 flex items-center justify-center text-center p-12 border border-dashed border-[rgba(255,255,255,0.1)] rounded-2xl glass-card relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[rgba(59,130,246,0.05)] to-transparent" />
          <div className="relative z-10 max-w-md mx-auto">
            <div className="size-24 rounded-full bg-[rgba(59,130,246,0.05)] border border-[rgba(59,130,246,0.2)] flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(59,130,246,0.1)]">
              {search ? <AlertCircle className="size-10 text-[#60A5FA]" /> : <Upload className="size-10 text-[#3B82F6]" />}
            </div>
            <h3 className="text-2xl font-bold font-display text-white mb-3">
              {search ? "No matches found" : "No knowledge stored yet"}
            </h3>
            <p className="text-[#94A3B8] font-mono text-sm leading-relaxed mb-8">
              {search ? "Adjust your search parameters to find what you're looking for." : "Drag and drop a file here or click the button below to add data to your vault. (PDF, DOCX, TXT, CSV)"}
            </p>
            {!search && (
              <Button onClick={() => fileInputRef.current?.click()} size="lg" className="glow-border">
                <Upload className="size-5 mr-2" /> Select Document
              </Button>
            )}
          </div>
        </motion.div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {documents?.map((doc, i) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              key={doc.id}
              className="group flex flex-col p-5 rounded-xl border border-[rgba(255,255,255,0.05)] glass-card hover:border-[rgba(59,130,246,0.4)] transition-all duration-300 relative overflow-hidden h-[200px]"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[rgba(59,130,246,0.05)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              
              <div className="flex items-start justify-between relative z-10">
                <div className="flex items-center gap-3">
                  <div className="size-10 shrink-0 rounded-lg bg-[rgba(59,130,246,0.1)] flex items-center justify-center border border-[rgba(59,130,246,0.2)] shadow-[0_0_10px_rgba(59,130,246,0.1)]">
                    <FileText className="size-5 text-[#3B82F6]" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-mono text-[#94A3B8] uppercase tracking-wider">DOC_{doc.id.toString().padStart(4, '0')}</span>
                    {doc.extractedText ? (
                      <span className="flex items-center gap-1 text-xs text-[#8B5CF6] font-medium mt-0.5"><Sparkles className="size-3" /> Ready</span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-[#60A5FA] font-medium mt-0.5"><Loader2 className="size-3 animate-spin" /> Processing</span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-[#94A3B8] hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 className="size-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="glass-card border-[rgba(255,255,255,0.1)]">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="font-display">Delete Data Matrix?</AlertDialogTitle>
                        <AlertDialogDescription className="text-[#94A3B8]">
                          This action will permanently purge <span className="font-mono text-white">"{doc.name}"</span> from the vault. It cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="bg-transparent border-[rgba(255,255,255,0.1)] text-white hover:bg-[rgba(255,255,255,0.05)]">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={() => {
                            deleteDocument.mutate({ id: doc.id }, {
                              onSuccess: () => {
                                queryClient.invalidateQueries({ queryKey: getListDocumentsQueryKey() });
                                toast({ title: "Purged", description: "Data matrix removed from vault." });
                              }
                            });
                          }}
                        >
                          Confirm Purge
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
              
              <div className="mt-4 flex-1 relative z-10 min-h-0">
                <Link href={`/documents/${doc.id}`}>
                  <h3 className="font-semibold text-lg text-white hover:text-[#60A5FA] transition-colors line-clamp-2 cursor-pointer leading-tight mb-2">
                    {doc.name}
                  </h3>
                </Link>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {doc.storageProvider === "zerog" && (
                    <span className="inline-flex items-center gap-1 text-[9px] font-mono text-[#10B981] bg-[rgba(16,185,129,0.1)] border border-[rgba(16,185,129,0.2)] px-1.5 py-0.5 rounded">
                      <ShieldCheck className="size-3" /> Verified
                    </span>
                  )}
                  {doc.rootHash && (
                    <span className="text-[9px] font-mono text-[#60A5FA] bg-[rgba(59,130,246,0.1)] border border-[rgba(59,130,246,0.2)] px-1.5 py-0.5 rounded" title={doc.rootHash}>
                      Root: {truncateHash(doc.rootHash)}
                    </span>
                  )}
                </div>
              </div>
              
              {/* Hover Actions */}
              <div className="absolute bottom-16 left-0 right-0 flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:translate-y-0 z-20">
                <Link href={`/documents/${doc.id}`}>
                  <Button size="sm" variant="secondary" className="bg-[rgba(11,16,32,0.8)] hover:bg-[#3B82F6] text-white border border-[rgba(255,255,255,0.1)]">
                    <Eye className="size-3 mr-1" /> View
                  </Button>
                </Link>
                <Button size="sm" variant="secondary" className="bg-[rgba(11,16,32,0.8)] hover:bg-[#8B5CF6] text-white border border-[rgba(255,255,255,0.1)]" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleChat(doc); }}>
                  <MessageSquare className="size-3 mr-1" /> Chat
                </Button>
                <Button size="sm" variant="secondary" className="bg-[rgba(11,16,32,0.8)] hover:bg-[#10B981] text-white border border-[rgba(255,255,255,0.1)]" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSummarize(doc); }}>
                  <Sparkles className="size-3 mr-1" /> Summarize
                </Button>
              </div>

              <div className="mt-auto pt-3 flex items-center justify-between border-t border-[rgba(255,255,255,0.05)] relative z-10">
                <p className="text-xs text-[#94A3B8] font-mono">
                  {formatBytes(doc.sizeBytes || 0)}
                </p>
                <p className="text-xs text-[#94A3B8] font-mono">
                  {formatRelativeDate(doc.createdAt)}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Summary Dialog */}
      <Dialog open={summaryOpen} onOpenChange={setSummaryOpen}>
        <DialogContent className="glass-card border-[rgba(255,255,255,0.1)] text-white max-w-2xl bg-[rgba(11,16,32,0.95)]">
          <DialogHeader>
            <DialogTitle className="font-display tracking-wide flex items-center gap-2">
              <Sparkles className="size-5 text-[#8B5CF6]" />
              Summary: {summaryDoc}
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
