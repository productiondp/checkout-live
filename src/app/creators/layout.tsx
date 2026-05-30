import React from "react";
import Link from "next/link";
import { Compass, Search, Briefcase, User, Settings, Star, Edit3 } from "lucide-react";

export default function CreatorsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#FBFBFD] text-[#1D1D1F] font-sans selection:bg-[#E53935]/10 flex flex-col md:flex-row">
      
      {/* Sidebar Navigation (Desktop) / Bottom Nav (Mobile) */}
      <nav className="fixed md:sticky bottom-0 md:top-0 left-0 w-full md:w-64 h-16 md:h-screen bg-white border-t md:border-r border-black/[0.05] z-50 flex md:flex-col justify-around md:justify-start md:px-6 md:py-8 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.05)] md:shadow-none">
        
        <div className="hidden md:flex items-center gap-3 mb-12">
          <div className="h-8 w-8 bg-black rounded-lg flex items-center justify-center text-white">
            <Star size={16} />
          </div>
          <span className="font-black uppercase tracking-[0.2em] text-sm">Creator OS</span>
        </div>

        <div className="flex md:flex-col items-center md:items-start w-full md:space-y-2 justify-around md:justify-start">
          <NavItem href="/creators" icon={Compass} label="Discover" />
          <NavItem href="/creators/search" icon={Search} label="Search" />
          <NavItem href="/creators/opportunities" icon={Briefcase} label="Opportunities" />
          <NavItem href="/creators/profile" icon={User} label="Profile" />
          <div className="hidden md:block w-full h-px bg-black/[0.05] my-4" />
          <NavItem href="/creators/settings" icon={Settings} label="Settings" className="hidden md:flex" />
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 w-full pb-20 md:pb-0">
        {children}
      </main>

    </div>
  );
}

function NavItem({ href, icon: Icon, label, className = "" }: { href: string; icon: any; label: string; className?: string }) {
  return (
    <Link 
      href={href} 
      className={`flex md:w-full flex-col md:flex-row items-center gap-1 md:gap-4 p-2 md:p-3 rounded-xl hover:bg-black/[0.03] transition-colors text-black/40 hover:text-black ${className}`}
    >
      <Icon size={20} />
      <span className="text-[10px] md:text-xs font-bold uppercase tracking-[0.1em]">{label}</span>
    </Link>
  );
}
