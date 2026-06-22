import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Library, MessageSquare, LayoutDashboard, Hexagon } from "lucide-react";
import { motion } from "framer-motion";

function Logo() {
  return (
    <motion.svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      initial={{ opacity: 0.8 }}
      animate={{ opacity: [0.8, 1, 0.8] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      className="drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]"
    >
      <path
        d="M12 2L2 7.5V16.5L12 22L22 16.5V7.5L12 2Z"
        stroke="url(#paint0_linear)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 22V12"
        stroke="url(#paint1_linear)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 12L22 7.5"
        stroke="url(#paint2_linear)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 12L2 7.5"
        stroke="url(#paint3_linear)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" fill="#8B5CF6" className="drop-shadow-[0_0_5px_rgba(139,92,246,0.8)]" />
      <defs>
        <linearGradient id="paint0_linear" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3B82F6" />
          <stop offset="1" stopColor="#8B5CF6" />
        </linearGradient>
        <linearGradient id="paint1_linear" x1="12" y1="12" x2="12" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8B5CF6" />
          <stop offset="1" stopColor="#3B82F6" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="paint2_linear" x1="12" y1="12" x2="22" y2="7.5" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8B5CF6" />
          <stop offset="1" stopColor="#60A5FA" />
        </linearGradient>
        <linearGradient id="paint3_linear" x1="12" y1="12" x2="2" y2="7.5" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8B5CF6" />
          <stop offset="1" stopColor="#60A5FA" />
        </linearGradient>
      </defs>
    </motion.svg>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="dark min-h-[100dvh] flex w-full bg-[#050816] text-[#F8FAFC]">
      <SidebarProvider>
        <Sidebar variant="inset" className="border-r border-[rgba(255,255,255,0.05)] bg-[#0B1020]">
          <SidebarHeader className="h-20 flex flex-col justify-center px-4 border-b border-[rgba(255,255,255,0.05)]">
            <Link href="/" className="flex flex-col gap-1 cursor-pointer">
              <div className="flex items-center gap-3 font-display font-bold tracking-tight text-[#F8FAFC]">
                <Logo />
                <span className="text-lg bg-clip-text text-transparent bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6]">
                  0G Vault AI
                </span>
              </div>
              <p className="text-[10px] text-[#94A3B8] font-mono leading-tight max-w-[200px] uppercase tracking-wider opacity-70">
                Powered by 0G Infrastructure
              </p>
            </Link>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel className="font-mono text-xs text-[#94A3B8] uppercase tracking-wider mt-4 mb-2 opacity-60">
                Command Center
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={location === "/dashboard"}
                      tooltip="Dashboard"
                      className="hover:bg-[rgba(59,130,246,0.1)] hover:text-[#3B82F6] transition-colors"
                    >
                      <Link href="/dashboard">
                        <LayoutDashboard className="size-4" />
                        <span>Dashboard</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={location.startsWith("/documents")}
                      tooltip="Knowledge Base"
                      className="hover:bg-[rgba(59,130,246,0.1)] hover:text-[#3B82F6] transition-colors"
                    >
                      <Link href="/documents">
                        <Library className="size-4" />
                        <span>Knowledge Base</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={location.startsWith("/chat")}
                      tooltip="AI Intelligence"
                      className="hover:bg-[rgba(59,130,246,0.1)] hover:text-[#3B82F6] transition-colors"
                    >
                      <Link href="/chat">
                        <MessageSquare className="size-4" />
                        <span>AI Intelligence</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <div className="flex-1 flex flex-col min-w-0 bg-[#050816]">
          <header className="h-16 flex items-center px-4 border-b border-[rgba(255,255,255,0.05)] sticky top-0 bg-[#050816]/80 backdrop-blur-xl z-10">
            <SidebarTrigger className="-ml-2 mr-2 text-[#94A3B8] hover:text-[#F8FAFC]" />
            <div className="ml-auto text-xs font-mono text-[#94A3B8] opacity-50 flex items-center gap-2">
              <span className="size-2 rounded-full bg-green-500 animate-pulse" />
              SYSTEM ONLINE
            </div>
          </header>
          <main className="flex-1 p-6 md:p-10 overflow-auto relative">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[rgba(139,92,246,0.05)] via-transparent to-transparent pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-[rgba(59,130,246,0.05)] via-transparent to-transparent pointer-events-none" />
            
            <div className="relative z-10 min-h-full flex flex-col">
              {children}
              
              <footer className="mt-auto pt-16 pb-4 border-t border-[rgba(255,255,255,0.05)] flex items-center justify-center text-center w-full">
                <p className="text-[#94A3B8] text-xs font-mono opacity-50 tracking-wider">
                  Built with 0G Infrastructure — Decentralized Storage · AI-Powered Retrieval · Knowledge Intelligence
                </p>
              </footer>
            </div>
          </main>
        </div>
      </SidebarProvider>
    </div>
  );
}

