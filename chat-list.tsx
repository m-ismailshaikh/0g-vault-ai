import { Link, useLocation } from "wouter";
import { useListConversations, useCreateConversation } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { MessageSquare, Plus, Network, ChevronRight } from "lucide-react";
import { formatRelativeDate } from "@/lib/format";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

export default function ChatList() {
  const { data: conversations, isLoading } = useListConversations();
  const createConversation = useCreateConversation();
  const [, setLocation] = useLocation();

  const handleNewChat = () => {
    createConversation.mutate(
      { data: { title: "New Conversation" } },
      {
        onSuccess: (chat) => {
          setLocation(`/chat/${chat.id}`);
        }
      }
    );
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto h-full flex flex-col">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-4xl font-bold tracking-tight text-white font-display text-gradient">AI Intelligence</h1>
          <p className="text-muted-foreground font-mono text-xs uppercase tracking-widest mt-2 flex items-center gap-2">
            <Network className="size-3" /> Neural Interaction Logs
          </p>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <Button 
            onClick={handleNewChat} 
            disabled={createConversation.isPending}
            className="h-11 px-6 shadow-[0_0_15px_rgba(139,92,246,0.3)] hover:shadow-[0_0_25px_rgba(139,92,246,0.5)] transition-all glow-border bg-[#8B5CF6] hover:bg-[#7C3AED]"
          >
            <Plus className="size-4 mr-2" />
            Initialize Terminal
          </Button>
        </motion.div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 mt-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl bg-[rgba(255,255,255,0.05)]" />
          ))}
        </div>
      ) : conversations?.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex-1 flex items-center justify-center text-center p-12 border border-[rgba(255,255,255,0.05)] rounded-2xl glass-card relative overflow-hidden mt-10"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[rgba(139,92,246,0.1)] to-transparent pointer-events-none" />
          <div className="relative z-10 max-w-md mx-auto">
            <div className="size-20 rounded-2xl bg-[rgba(139,92,246,0.1)] border border-[rgba(139,92,246,0.2)] flex items-center justify-center mx-auto mb-6 rotate-3 shadow-[0_0_30px_rgba(139,92,246,0.15)]">
              <MessageSquare className="size-10 text-[#8B5CF6]" />
            </div>
            <h3 className="text-2xl font-bold font-display text-white mb-3">Start your first AI conversation</h3>
            <p className="text-[#94A3B8] font-mono text-sm leading-relaxed mb-8">
              Initialize a neural terminal to query your data matrix, generate insights, and extract knowledge.
            </p>
            <Button onClick={handleNewChat} size="lg" className="bg-[#8B5CF6] hover:bg-[#7C3AED] glow-border">
              <Plus className="size-4 mr-2" /> Initialize Terminal
            </Button>
          </div>
        </motion.div>
      ) : (
        <div className="grid gap-4">
          {conversations?.map((chat, i) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              key={chat.id}
            >
              <Link href={`/chat/${chat.id}`}>
                <div className="group flex items-center justify-between p-5 rounded-xl border border-[rgba(255,255,255,0.05)] glass-card hover:border-[rgba(139,92,246,0.3)] transition-all duration-300 cursor-pointer overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-[rgba(139,92,246,0.05)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="flex items-center gap-5 relative z-10">
                    <div className="size-12 rounded-lg bg-[rgba(139,92,246,0.1)] flex items-center justify-center border border-[rgba(139,92,246,0.2)] group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(139,92,246,0.1)]">
                      <MessageSquare className="size-5 text-[#8B5CF6]" />
                    </div>
                    <div>
                      <p className="font-semibold text-lg text-white group-hover:text-[#A78BFA] transition-colors">
                        {chat.title || "Untitled Intelligence Log"}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-[#94A3B8] font-mono">
                        <span>{formatRelativeDate(chat.updatedAt)}</span>
                        {chat.documentName && (
                          <>
                            <span className="opacity-30">•</span>
                            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[rgba(59,130,246,0.1)] border border-[rgba(59,130,246,0.2)] text-[#60A5FA]">
                              <Network className="size-3" /> Context: {chat.documentName}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="relative z-10 size-8 rounded-full bg-[rgba(255,255,255,0.05)] flex items-center justify-center text-[#8B5CF6] opacity-0 group-hover:opacity-100 transition-all group-hover:bg-[rgba(139,92,246,0.1)]">
                    <ChevronRight className="size-4" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
