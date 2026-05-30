"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  Home, 
  MessageSquare, 
  Users, 
  MapPin, 
  Search, 
  LayoutGrid, 
  ShoppingBag, 
  Zap, 
  TrendingUp,
  BrainCircuit,
  Layout,
  Globe,
  ChevronRight,
  Target,
  Activity,
  ShieldCheck,
  Building2,
  UserPlus,
  Compass,
  User
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/contexts/NotificationContext";

export default function DesktopSidebar() {
  const pathname = usePathname();
  const { profile: authUser } = useAuth();
  const { unreadMessagesCount, pendingRequestsCount } = useNotifications();

  const navGroups = [
    {
      group: "Network",
      items: [
        { label: "Home Feed", icon: Home, href: "/home" },
        { label: "Network Hub", icon: Users, href: pendingRequestsCount > 0 ? "/matches?tab=REQUESTS" : "/matches", badge: pendingRequestsCount > 0 ? pendingRequestsCount.toString() : null },
        { label: "Chat", icon: MessageSquare, href: "/chat", badge: unreadMessagesCount > 0 ? unreadMessagesCount.toString() : null },
        { label: "Communities", icon: Globe, href: "/communities" },
        { label: "Map", icon: MapPin, href: "/map" },
      ]
    },
    {
      group: "Opportunities",
      items: [
        { label: "Marketplace", icon: ShoppingBag, href: "/marketplace" },
        { label: "Advisors", icon: Target, href: "/advisors" },
        { label: "Content Creation", icon: Compass, href: "/creators" },
        { label: "Meetups", icon: LayoutGrid, href: "/meetup" },
      ]
    },
    {
      group: "System",
      items: [
        { label: "Live Ops", icon: Zap, href: "/live-ops" },
      ]
    }
  ];

  return (
    <aside className="w-[260px] hidden lg:flex flex-col bg-white border-r border-[#292828]/5 h-full sticky top-0 py-10 px-6 overflow-y-auto no-scrollbar selection:bg-[#E53935]/10 z-50">
      
      {/* 0. BRAND LOGO (LEFT CORNER) */}
      <div className="px-4 mb-12">
        <Link href="/home" className="shrink-0">
          <img 
            src="/images/logo.png" 
            alt="Checkout" 
            className="h-14 lg:h-16 w-auto object-contain" 
          />
        </Link>
        <div className="flex items-center gap-1.5 mt-2.5 px-0.5">
          <MapPin size={10} className="text-[#E53935] shrink-0" />
          <span className="text-[9px] font-black uppercase tracking-widest text-[#292828]/30 leading-none">
            {authUser?.location || "Trivandrum"}
          </span>
        </div>
      </div>

      {/* 1. NAVIGATION GROUPS */}
      <div className="flex-1 space-y-12">
        {navGroups.map((group, idx) => (
          <div key={idx} className="space-y-6">
            <h3 className="px-4 text-[9px] font-black uppercase text-[#292828]/30  flex items-center justify-between">
              {group.group}
            </h3>
            <div className="space-y-1.5">
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={cn(
                      "group flex items-center gap-4 px-4 h-11 rounded-lg transition-all duration-300 relative overflow-hidden",
                      isActive 
                        ? "bg-[#292828] text-white" 
                        : "text-slate-500 hover:text-[#292828] hover:bg-slate-50"
                    )}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#E53935] rounded-r-full" />
                    )}
                    
                    <item.icon 
                      size={18} 
                      className={cn(
                        "transition-all duration-300",
                        isActive ? "text-[#E53935]" : "group-hover:text-[#292828]"
                      )} 
                    />
                    
                    <span className={cn(
                      "text-[12px] font-bold uppercase ",
                      isActive ? "text-white" : "text-slate-500"
                    )}>
                      {item.label}
                    </span>
                    
                    {item.badge && (
                      <div className="ml-auto h-5 px-2 rounded-lg bg-[#E53935] text-white text-[9px] font-black flex items-center justify-center shadow-[0_0_15px_rgba(229,57,53,0.3)]">
                        {item.badge}
                      </div>
                    )}

                    {!isActive && (
                      <ChevronRight size={14} className="ml-auto opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-[#292828]/20" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>


    </aside>
  );
}
