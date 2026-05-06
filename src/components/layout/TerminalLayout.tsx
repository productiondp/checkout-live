"use client";

import React from "react";
import DesktopSidebar from "./DesktopSidebar";
import UnifiedTopbar from "./UnifiedTopbar";
import MobileNavbar from "./MobileNavbar";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import FloatingChat from "@/components/chat/FloatingChat";

interface TerminalLayoutProps {
  children: React.ReactNode;
  topbarChildren?: React.ReactNode;
  rightSidebar?: React.ReactNode;
}

export default function TerminalLayout({ children, topbarChildren, rightSidebar }: TerminalLayoutProps) {
  return (
    <ProtectedRoute>
      <div className="flex h-screen-safe bg-white overflow-hidden selection:bg-[#E53935]/10 relative">
        {/* PERSISTENT SIDEBAR (DESKTOP) */}
        <div className="hidden lg:block h-full shrink-0">
           <DesktopSidebar />
        </div>

        {/* CONTENT AREA */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#FBFBFD] relative h-full">
           <UnifiedTopbar>
              {topbarChildren}
           </UnifiedTopbar>
           
           <div className="flex-1 flex overflow-hidden relative">
              <main className="flex-1 overflow-y-auto no-scrollbar scroll-smooth pb-[80px] lg:pb-0">
                 <div className="px-safe">
                    {children}
                 </div>
              </main>

              {rightSidebar && (
                 <div className="hidden xl:block h-full border-l border-[#292828]/5 bg-[#FDFDFF]">
                    {rightSidebar}
                 </div>
              )}
           </div>

           {/* MOBILE BOTTOM NAV */}
           <MobileNavbar />
        </div>
        <FloatingChat />
      </div>
    </ProtectedRoute>
  );
}
