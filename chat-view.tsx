import { useState, useRef, useEffect, useMemo } from "react";
import { useParams, Link } from "wouter";
import { useGetConversation, useListDocuments } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Bot, User, FileText, AlertCircle, ArrowLeft, Terminal, Cpu, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const STOP_WORDS = new Set(["the", "and", "is", "in", "to", "of", "it", "that", "on", "for", "with", "as", "was", "at", "by", "an", "be", "this", "which", "or", "from", "but", "not", "are", "have", "has", "all", "they", "we", "can", "will"]);

async function updateConversationDocument(id: number, documentId: number | null) {
  try {
    await fetch(`/api/chat/conversations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentId }),
    });
  } catch (e) {
    console.error("Failed to update doc context", e);
  }
}

export default function ChatView() {
  const { id } = useParams();
  const chatId = parseInt(id || "0");
  const { data: conversation, isLoading } = useGetConversation(chatId);
  const { data: documents } = useListDocuments();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [noApiKey, setNoApiKey] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const selectedDoc = useMemo(() => {
    if (!conversation?.documentId || !documents) return null;
    return documents.find(d => d.id === conversation.documentId);
  }, [conversation?.documentId, documents]);

  const docAnalysis = useMemo(() => {
    if (!selectedDoc?.extractedText) return null;
    const text = selectedDoc.extractedText;
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    
    const words = text.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/);
    const counts: Record<string, number> = {};
    words.forEach(w => {
      if (w.length > 3 && !STOP_WORDS.has(w)) counts[w] = (counts[w] || 0) + 1;
    });
    const topTopics = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(t => t[0]);

    return { wordCount, topTopics };
  }, [selectedDoc]);

  useEffect(() => {
    if (conversation?.messages) {
      setMessages(conversation.messages);
    }
  }, [conversation]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isStreaming]);

  const submitQuery = async (queryStr: string) => {
    if (!queryStr.trim() || isStreaming) return;

    setMessages(prev => [...prev, { role: "user", content: queryStr, id: Date.now() }]);
    setIsStreaming(true);
    setNoApiKey(false);

    try {
      const response = await fetch(`/api/chat/conversations/${chatId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: queryStr }),
      });

      if (!response.ok && response.status === 401) {
        setNoApiKey(true);
        setIsStreaming(false);
        return;
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let assistantMsg = "";
      
      setMessages(prev => [...prev, { role: "assistant", content: "", id: Date.now() + 1, isStreaming: true }]);

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");
        
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.noApiKey) {
                setNoApiKey(true);
                break;
              }
              if (data.content) {
                assistantMsg += data.content;
                setMessages(prev => {
                  const newMsgs = [...prev];
                  newMsgs[newMsgs.length - 1].content = assistantMsg;
                  return newMsgs;
                });
              }
            } catch (e) {
              // ignore parse errors for partial chunks
            }
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsStreaming(false);
      setMessages(prev => {
        const newMsgs = [...prev];
        if (newMsgs.length > 0) newMsgs[newMsgs.length - 1].isStreaming = false;
        return newMsgs;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = input;
    setInput("");
    await submitQuery(val);
  };

  const handleDocChange = async (docId: string) => {
    const val = docId === "none" ? null : parseInt(docId);
    await updateConversationDocument(chatId, val);
  };

  const handleSuggestedQuestion = (q: string) => {
    setInput(q);
    setTimeout(() => submitQuery(q), 50);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <Terminal className="size-10 text-primary animate-pulse" />
          <p className="font-mono text-[#94A3B8] text-sm uppercase tracking-widest">Initializing Neural Link...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-6rem)] max-w-5xl mx-auto flex flex-col gap-4">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex-none">
        <Link href="/chat" className="inline-flex items-center text-sm font-mono text-[#94A3B8] hover:text-white transition-colors mb-2">
          <ArrowLeft className="size-4 mr-2" /> Back to Logs
        </Link>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }} 
        animate={{ opacity: 1, scale: 1 }}
        className="flex-1 flex flex-col border border-[rgba(255,255,255,0.05)] rounded-2xl overflow-hidden glass-card shadow-2xl relative"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[rgba(139,92,246,0.03)] to-transparent pointer-events-none" />
        
        {/* Header */}
        <div className="p-4 border-b border-[rgba(255,255,255,0.05)] bg-[rgba(11,16,32,0.8)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-lg bg-[rgba(139,92,246,0.1)] flex items-center justify-center border border-[rgba(139,92,246,0.2)]">
              <Cpu className="size-5 text-[#8B5CF6]" />
            </div>
            <div>
              <h2 className="font-display font-semibold text-white tracking-wide">{conversation?.title || "Intelligence Terminal"}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="size-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-mono text-[#94A3B8] uppercase tracking-wider">Link Active</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-[rgba(0,0,0,0.3)] rounded-lg p-1 border border-[rgba(255,255,255,0.05)]">
            <div className="flex items-center justify-center w-8 h-8 rounded shrink-0 bg-[rgba(59,130,246,0.1)]">
              <FileText className="size-4 text-[#3B82F6]" />
            </div>
            <Select defaultValue={conversation?.documentId?.toString() || "none"} onValueChange={handleDocChange}>
              <SelectTrigger className="w-[200px] h-8 text-xs font-mono border-none bg-transparent focus:ring-0 text-[#94A3B8] shadow-none">
                <SelectValue placeholder="No Context Bound" />
              </SelectTrigger>
              <SelectContent className="glass-card border-[rgba(255,255,255,0.1)]">
                <SelectItem value="none" className="font-mono text-xs">No Context Bound</SelectItem>
                {documents?.map(doc => (
                  <SelectItem key={doc.id} value={doc.id.toString()} className="font-mono text-xs">
                    {doc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Chat Area */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 relative z-10 custom-scrollbar"
        >
          {noApiKey && (
            <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive flex items-start gap-3 shadow-[0_0_15px_rgba(220,38,38,0.1)]">
              <AlertCircle className="size-5 mt-0.5" />
              <div>
                <p className="font-medium font-display tracking-wide">GROQ_API_KEY Missing</p>
                <p className="text-sm opacity-80 font-mono mt-1">Add your GROQ_API_KEY in Replit Secrets to enable neural generation.</p>
              </div>
            </div>
          )}

          {messages.length === 0 && !noApiKey && docAnalysis && selectedDoc && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-2xl mx-auto mt-4 p-6 glass-card border border-[rgba(139,92,246,0.3)] rounded-2xl relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[rgba(139,92,246,0.1)] to-transparent pointer-events-none" />
              
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="size-10 rounded bg-[rgba(139,92,246,0.15)] flex items-center justify-center text-[#8B5CF6] border border-[rgba(139,92,246,0.3)]">
                    <Sparkles className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg text-white font-semibold">Document Analysis Ready</h3>
                    <p className="text-xs font-mono text-[#94A3B8] opacity-80 uppercase tracking-widest mt-1">Context Injected</p>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex items-center justify-between py-2 border-b border-[rgba(255,255,255,0.05)]">
                    <span className="text-[#94A3B8] font-mono text-xs uppercase">Title</span>
                    <span className="text-white text-sm font-medium">{selectedDoc.name}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-[rgba(255,255,255,0.05)]">
                    <span className="text-[#94A3B8] font-mono text-xs uppercase">Word Count</span>
                    <span className="text-white text-sm font-medium">{docAnalysis.wordCount.toLocaleString()}</span>
                  </div>
                  <div className="py-2 border-b border-[rgba(255,255,255,0.05)]">
                    <span className="text-[#94A3B8] font-mono text-xs uppercase block mb-2">Topics</span>
                    <div className="flex flex-wrap gap-2">
                      {docAnalysis.topTopics.map(topic => (
                        <span key={topic} className="px-2 py-1 rounded bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-[#F8FAFC] text-xs">
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-[#94A3B8] font-mono text-xs uppercase tracking-widest mb-3">Suggested Questions</h4>
                  <div className="grid gap-2">
                    {[
                      "Summarize this document",
                      "What are the key findings?",
                      "Generate study notes",
                      "Extract action items"
                    ].map(q => (
                      <button
                        key={q}
                        onClick={() => handleSuggestedQuestion(q)}
                        disabled={isStreaming}
                        className="text-left px-4 py-3 rounded-xl bg-[rgba(11,16,32,0.6)] border border-[rgba(255,255,255,0.05)] hover:border-[rgba(139,92,246,0.4)] hover:bg-[rgba(139,92,246,0.05)] transition-all text-sm text-[#F8FAFC] flex items-center gap-3 disabled:opacity-50"
                      >
                        <Bot className="size-4 text-[#8B5CF6] opacity-50" />
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {messages.length === 0 && !noApiKey && (!selectedDoc || !docAnalysis) && (
            <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground opacity-50">
              <Terminal className="size-12 mb-4" />
              <p className="font-mono text-sm tracking-wider uppercase">Neural Link Established</p>
              <p className="text-xs mt-2">Awaiting initial query...</p>
            </div>
          )}

          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <motion.div
                key={msg.id || i}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex gap-4 max-w-[85%] ${msg.role === "user" ? "ml-auto" : "mr-auto"}`}
              >
                {msg.role !== "user" && (
                  <div className="size-8 sm:size-10 rounded-xl bg-[rgba(139,92,246,0.1)] flex items-center justify-center shrink-0 border border-[rgba(139,92,246,0.3)] shadow-[0_0_10px_rgba(139,92,246,0.15)]">
                    <Bot className="size-4 sm:size-5 text-[#8B5CF6]" />
                  </div>
                )}
                
                <div 
                  className={`p-4 rounded-2xl text-[15px] leading-relaxed shadow-lg ${
                    msg.role === "user" 
                      ? "bg-primary text-white rounded-tr-sm" 
                      : "bg-[rgba(11,16,32,0.6)] border border-[rgba(255,255,255,0.05)] text-[#F8FAFC] rounded-tl-sm backdrop-blur-md prose prose-invert max-w-none font-sans"
                  }`}
                >
                  {msg.role !== "user" && msg.isStreaming && !msg.content ? (
                    <div className="flex items-center h-5">
                      <span className="flex gap-1">
                        <span className="size-1.5 rounded-full bg-[#8B5CF6] animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="size-1.5 rounded-full bg-[#8B5CF6] animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="size-1.5 rounded-full bg-[#8B5CF6] animate-bounce" style={{ animationDelay: "300ms" }} />
                      </span>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap">
                      {msg.content}
                      {msg.isStreaming && <span className="inline-block w-2 h-4 ml-1 bg-[#8B5CF6] animate-pulse align-middle" />}
                    </div>
                  )}
                </div>

                {msg.role === "user" && (
                  <div className="size-8 sm:size-10 rounded-xl bg-[#050816] flex items-center justify-center shrink-0 border border-[rgba(255,255,255,0.1)] shadow-inner">
                    <User className="size-4 sm:size-5 text-[#94A3B8]" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Input Area */}
        <div className="p-4 sm:p-5 border-t border-[rgba(255,255,255,0.05)] bg-[rgba(11,16,32,0.9)] relative z-10">
          <form onSubmit={handleSubmit} className="flex gap-3 relative">
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Transmit query to network..."
              className="flex-1 bg-[rgba(0,0,0,0.4)] border-[rgba(255,255,255,0.1)] font-mono text-sm h-12 px-4 rounded-xl focus-visible:ring-[#8B5CF6]/50 focus-visible:border-[#8B5CF6] shadow-inner text-white placeholder:text-[#94A3B8]/50"
              disabled={isStreaming}
            />
            <Button 
              type="submit" 
              disabled={isStreaming || !input.trim()}
              className="h-12 px-6 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white shadow-[0_0_15px_rgba(139,92,246,0.3)] transition-all glow-border"
            >
              <Send className="size-4 sm:mr-2" />
              <span className="hidden sm:inline font-semibold tracking-wide">Transmit</span>
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

