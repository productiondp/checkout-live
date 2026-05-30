"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
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
  UserCheck,
  User,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

export default function TalentNetworkPage() {
  const [activeTab, setActiveTab] = useState("Roster");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeRegion, setActiveRegion] = useState("All Locations");
  const [activeGender, setActiveGender] = useState("All");
  
  const [creators, setCreators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const tabs = ["Roster", "Castings", "Schedule", "Contracts", "Finance", "Public Hub"];

  useEffect(() => {
    const fetchCreators = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("creator_profiles")
          .select(`
            *,
            profiles:id (
              full_name,
              location
            )
          `);
        
        if (error) throw error;
        if (data) {
          setCreators(data);
        }
      } catch (err) {
        console.error("Error fetching creators:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCreators();
  }, []);

  // Extract unique categories (specialties)
  const allSpecialties = Array.from(new Set(creators.flatMap(c => c.specialties || []))).filter(Boolean).slice(0, 8); // Top 8 to avoid clutter
  const categories = ["All", ...allSpecialties];

  // Extract unique locations
  const allLocations = Array.from(new Set(creators.map(c => c.profiles?.location).filter(Boolean)));
  const regions = ["All Locations", ...allLocations];

  // Filtering logic
  const filteredCreators = creators.filter(c => {
    // 1. Search Query
    const nameMatch = c.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const specialtyMatch = c.specialties?.some((s: string) => s.toLowerCase().includes(searchQuery.toLowerCase()));
    if (searchQuery && !nameMatch && !specialtyMatch) return false;

    // 2. Category
    if (activeCategory !== "All" && !c.specialties?.includes(activeCategory)) return false;

    // 3. Region
    if (activeRegion !== "All Locations" && c.profiles?.location !== activeRegion) return false;

    // 4. Gender (Mocked, since not in schema, assuming All for now)
    // if (activeGender !== "All") { ... }

    return true;
  });

  // Stats calculation
  const totalActive = creators.length;
  const totalAvailable = creators.filter(c => c.availability?.toLowerCase().includes("available")).length;

  const stats = [
    { label: "TOTAL TALENT", value: `${totalActive} Active`, sub: "Fully Vetted", icon: Users },
    { label: "AVAILABLE NOW", value: `${totalAvailable} Talents`, sub: "Ready to Shoot", icon: CheckCircle2 },
    { label: "BOOKED ROSTER", value: "0 Booked", sub: "Util: 0.0%", icon: Calendar },
    { label: "ACTIVE CASTINGS", value: "0 Open", sub: "0 Shortlisted", icon: FileText },
    { label: "AI MATCH RATE", value: "94%", sub: "Matched profiles", icon: Sparkles },
  ];

  const activityLog = [
    { type: "Contract Signed", desc: "Tovino Thomas cleared standard NDA release.", time: "10m ago", color: "bg-blue-500" },
    { type: "New Casting", desc: "Tech-Start Brand Film Dub published requirement.", time: "1h ago", color: "bg-orange-500" },
    { type: "Conflict Detected", desc: "Aparna B. has overlapping travel dates on June 14.", time: "2h ago", color: "bg-orange-500" },
  ];

  const clearFilters = () => {
    setSearchQuery("");
    setActiveCategory("All");
    setActiveRegion("All Locations");
    setActiveGender("All");
  };

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
                  placeholder="Name, skills..." 
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
                {categories.map(cat => (
                  <button 
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={cn(
                      "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
                      activeCategory === cat ? "bg-[#E53935] text-white" : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Shoot Region */}
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Shoot Region</p>
              <div className="relative">
                <select 
                  value={activeRegion}
                  onChange={(e) => setActiveRegion(e.target.value)}
                  className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-600 outline-none focus:border-[#E53935] appearance-none cursor-pointer"
                >
                  {regions.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Preferred Gender */}
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Preferred Gender</p>
              <div className="flex bg-slate-50 rounded-xl p-1 border border-slate-100">
                {["All", "Male", "Female"].map(gender => (
                  <button 
                    key={gender}
                    onClick={() => setActiveGender(gender)}
                    className={cn(
                      "flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
                      activeGender === gender ? "bg-[#E53935] text-white shadow-sm" : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    {gender}
                  </button>
                ))}
              </div>
            </div>

            <button 
              onClick={clearFilters}
              className="w-full h-12 bg-slate-50 text-slate-500 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all"
            >
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

          {/* Main Content Area */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm min-h-[400px]">
            {activeTab === "Roster" ? (
              loading ? (
                <div className="h-[400px] flex flex-col items-center justify-center">
                  <Loader2 size={32} className="text-[#E53935] animate-spin mb-4" />
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Loading Roster...</p>
                </div>
              ) : filteredCreators.length === 0 ? (
                <div className="h-[400px] flex flex-col items-center justify-center text-center">
                  <UserCheck size={48} className="text-slate-200 mb-4" />
                  <p className="text-[15px] font-bold text-slate-600">No roster profiles matched filters.</p>
                  <button onClick={clearFilters} className="text-xs font-bold text-[#E53935] uppercase tracking-widest mt-4 cursor-pointer hover:underline">
                    Clear Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredCreators.map(creator => (
                    <Link key={creator.id} href={`/creators/profile/${creator.id}`} className="group flex flex-col bg-white rounded-3xl border border-slate-100 overflow-hidden hover:border-[#E53935]/30 hover:shadow-xl transition-all">
                      <div className="h-48 bg-slate-100 relative overflow-hidden">
                        {creator.portfolio_images?.[0] ? (
                          <img src={creator.portfolio_images[0]} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500" />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-slate-200 to-slate-100 flex items-center justify-center">
                            <User size={32} className="text-slate-300" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent z-10" />
                        <div className="absolute bottom-4 left-4 right-4 z-20 flex justify-between items-end">
                          <div>
                            <h3 className="text-white font-black tracking-tight text-lg leading-none flex items-center gap-1">
                              {creator.profiles?.full_name || "Creator"}
                              <CheckCircle2 size={14} className="text-blue-400" />
                            </h3>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-white/80 mt-1 truncate max-w-[160px]">
                              {creator.specialties?.slice(0, 2).join(" · ") || "Talent"}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 flex flex-col gap-2">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                          <span className="flex items-center gap-1 uppercase tracking-wider"><MapPin size={12} /> {creator.profiles?.location || "Remote"}</span>
                          {creator.availability && (
                            <span className="text-[#34C759] bg-[#34C759]/10 px-2 py-1 rounded-md text-[9px] uppercase tracking-wider truncate max-w-[100px]">
                              {creator.availability.includes("Immediate") ? "Immediate" : "Available"}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )
            ) : (
              <div className="h-[400px] flex flex-col items-center justify-center text-center">
                <FileText size={48} className="text-slate-200 mb-4" />
                <p className="text-[15px] font-bold text-slate-600">Nothing here yet.</p>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">
                  This section is under construction.
                </p>
              </div>
            )}
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
