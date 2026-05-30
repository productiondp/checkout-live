"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  Users, 
  MapPin, 
  Search, 
  Filter,
  CheckCircle2,
  Calendar,
  FileText,
  DollarSign,
  Globe,
  Plus,
  Send,
  Sparkles,
  ChevronDown,
  Bell,
  Activity,
  UserCheck
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function TalentNetworkPage() {
  const [activeTab, setActiveTab] = useState("Roster");
  const [searchQuery, setSearchQuery] = useState("");

  const tabs = ["Roster", "Castings", "Schedule", "Contracts", "Finance", "Public Hub"];

  const stats = [
    { label: "TOTAL TALENT", value: "0 Active", sub: "Fully Vetted", icon: Users },
    { label: "AVAILABLE NOW", value: "0 Talents", sub: "Ready to Shoot", icon: CheckCircle2 },
    { label: "BOOKED ROSTER", value: "0 Booked", sub: "Util: 0.0%", icon: Calendar },
    { label: "ACTIVE CASTINGS", value: "0 Open", sub: "0 Shortlisted", icon: FileText },
    { label: "AI MATCH RATE", value: "94%", sub: "Matched profiles", icon: Sparkles },
  ];

  const activityLog = [
    { type: "Contract Signed", desc: "Tovino Thomas cleared standard NDA release.", time: "10m ago", color: "bg-blue-500" },
    { type: "New Casting", desc: "Tech-Start Brand Film Dub published requirement.", time: "1h ago", color: "bg-orange-500" },
    { type: "Conflict Detected", desc: "Aparna B. has overlapping travel dates on June 14.", time: "2h ago", color: "bg-orange-500" },
  ];

  return (
    <div className="min-h-screen bg-[#FDFDFF] p-6 lg:p-10 space-y-8 font-sans selection:bg-[#E53935]/10">
      
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-[#1D1D1F] tracking-tight flex items-center gap-3">
            <Users size={28} className="text-[#E53935]" /> Talent Network
          </h1>
          <p className="text-sm font-medium text-slate-400 mt-1">
            Find and book actors, models, influencers, voice artists, and crew for your productions.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="h-11 px-6 bg-white border border-slate-200 text-slate-600 rounded-xl text-[11px] font-black uppercase tracking-widest hover:border-[#E53935] hover:text-[#E53935] transition-all flex items-center gap-2">
            <Sparkles size={16} /> Add Casting Call
          </button>
          <button className="h-11 px-6 bg-red-50 text-[#E53935] rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-red-100 transition-all flex items-center gap-2">
            <Calendar size={16} /> Book Talent
          </button>
        </div>
      </div>

      {/* STATS ROW */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">{stat.label}</p>
            <div>
              <p className="text-xl font-black text-[#1D1D1F]">{stat.value}</p>
              <div className="flex items-center gap-1.5 mt-1 text-[10px] font-bold text-slate-400">
                <stat.icon size={12} className={i === 0 ? "text-green-500" : i === 4 ? "text-[#E53935]" : "text-slate-400"} />
                {stat.sub}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MAIN LAYOUT: 3 COLUMNS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: FILTERS */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-8">
            
            {/* Search */}
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Search Directory</p>
              <div className="relative">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Name, skills, or agency tags..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-12 pl-11 pr-4 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium text-slate-700 outline-none focus:border-[#E53935] transition-all"
                />
              </div>
            </div>

            {/* Category Roster */}
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Category Roster</p>
              <div className="flex flex-wrap gap-2">
                <button className="px-4 py-2 bg-[#E53935] text-white rounded-lg text-[10px] font-black uppercase tracking-wider">All</button>
              </div>
            </div>

            {/* Shoot Region */}
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Shoot Region</p>
              <div className="relative">
                <select className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-600 outline-none focus:border-[#E53935] appearance-none cursor-pointer">
                  <option>All Locations</option>
                  <option>Trivandrum</option>
                  <option>Kochi</option>
                  <option>Mumbai</option>
                </select>
                <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Preferred Gender */}
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Preferred Gender</p>
              <div className="flex bg-slate-50 rounded-xl p-1 border border-slate-100">
                <button className="flex-1 py-2.5 bg-[#E53935] text-white rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm">All</button>
                <button className="flex-1 py-2.5 text-slate-400 hover:text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all">Male</button>
                <button className="flex-1 py-2.5 text-slate-400 hover:text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all">Female</button>
              </div>
            </div>

            <button className="w-full h-12 bg-slate-50 text-slate-500 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all">
              Clear Precision Filters
            </button>
          </div>

          {/* Activity Log */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-600 mb-6 flex items-center gap-2">
              <Bell size={14} className="text-slate-400" /> Casting Activity Log
            </h3>
            <div className="space-y-5">
              {activityLog.map((log, i) => (
                <div key={i} className="flex gap-3">
                  <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${log.color}`} />
                  <div>
                    <p className="text-xs font-medium text-slate-600 leading-relaxed">
                      <span className="font-bold text-[#1D1D1F]">{log.type}:</span> {log.desc}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">[{log.time}]</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* MIDDLE COLUMN: TABS & CONTENT */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Tabs */}
          <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm overflow-x-auto no-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                  activeTab === tab
                    ? "bg-slate-50 text-[#1D1D1F] shadow-sm border border-slate-100"
                    : "text-slate-400 hover:text-slate-600 hover:bg-slate-50/50"
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Main Roster Content Area */}
          <div className="bg-white rounded-3xl border border-slate-100 p-12 shadow-sm min-h-[400px] flex flex-col items-center justify-center text-center">
            <UserCheck size={48} className="text-slate-200 mb-4" />
            <p className="text-[15px] font-bold text-slate-600">No roster profiles matched filters.</p>
            <p className="text-xs font-bold text-[#E53935] uppercase tracking-widest mt-4 cursor-pointer hover:underline">
              List First Talent Profile
            </p>
          </div>

          {/* Discussion */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-600 mb-4 flex items-center gap-2">
              <MessageSquareIcon size={14} /> Casting Discussion
            </h3>
            <div className="flex items-center gap-4">
              <input 
                type="text" 
                placeholder="Write a comment..." 
                className="flex-1 h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm font-medium outline-none focus:border-slate-300 transition-all"
              />
              <button className="h-12 w-12 bg-[#E53935] text-white rounded-xl flex items-center justify-center hover:bg-[#1D1D1F] transition-all shrink-0 shadow-lg shadow-red-500/20">
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: AI SUGGESTIONS */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-600 flex items-center gap-2">
                <Sparkles size={14} className="text-[#E53935]" /> AI Casting Suggestion
              </h3>
              <span className="px-2 py-0.5 bg-[#1D1D1F] text-white text-[9px] font-black uppercase tracking-widest rounded-md">Active</span>
            </div>
            
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Choose Project</p>
              <div className="relative">
                <select className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-600 outline-none focus:border-[#E53935] appearance-none cursor-pointer">
                  <option></option>
                </select>
                <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

function MessageSquareIcon({ size }: { size: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  );
}
