"use client";

import React, { useState, useMemo } from "react";
import { Search, X, Zap, ArrowUpRight, User, Building2, Briefcase, Globe, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { rankEntities } from "@/lib/match-engine";
import { MOCK_ADVISORS } from "@/data/advisors";
import { MOCK_BUSINESSES } from "@/data/directory";
import { MOCK_LISTINGS } from "@/data/marketplace";

export default function UnifiedSearch() {
  const [query, setQuery] = useState("");
  const { user } = useAuth();
  const router = useRouter();

  // Combine all entities for searching
  const allEntities = useMemo(() => {
    const advisors = MOCK_ADVISORS.map(a => ({ ...a, type: "ADVISOR" }));
    const businesses = MOCK_BUSINESSES.map((b: any) => ({ ...b, type: "BUSINESS" }));
    const listings = MOCK_LISTINGS.map(l => ({ ...l, type: "LISTING" }));
    
    return [...advisors, ...businesses, ...listings];
  }, []);

  const searchResults = useMemo(() => {
    if (!query || !user) return [];
    
    const filtered = allEntities.filter(e => 
      e.name?.toLowerCase().includes(query.toLowerCase()) || 
      e.title?.toLowerCase().includes(query.toLowerCase()) ||
      e.category?.toLowerCase().includes(query.toLowerCase()) ||
      e.expertise?.some((ex: string) => ex.toLowerCase().includes(query.toLowerCase()))
    );

    return rankEntities(user, filtered);
  }, [query, user, allEntities]);

  return (
    <div className="w-full max-w-4xl mx-auto px-6">
      <div className="relative group">
        <div className="absolute inset-0 bg-[#E53935]/5 blur-3xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
        <div className="relative bg-white border border-slate-100 rounded-lg p-2 flex items-center shadow-premium">
          <div className="flex-1 flex items-center px-6 gap-4">
            <Search className="text-slate-300" size={24} />
            <input 
              type="text" 
              placeholder="Search people, companies, or services..." 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full h-16 bg-transparent text-lg font-bold text-[#292828] outline-none"
            />
          </div>
          {query && (
            <button onClick={() => setQuery("")} className="h-12 w-12 flex items-center justify-center text-slate-300 hover:text-[#292828]">
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {query && (
        <div className="mt-6 bg-white border border-slate-100 rounded-lg shadow-4xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500 max-h-[60vh] overflow-y-auto no-scrollbar">
          <div className="p-4 border-b border-slate-50 flex items-center justify-between px-8 bg-slate-50/50">
             <p className="text-[10px] font-black uppercase text-slate-300 ">{searchResults.length} Matches</p>
             <Zap size={14} className="text-[#E53935]" />
          </div>

          <div className="divide-y divide-slate-50">
            {searchResults.map((result: any) => (
              <div 
                key={result.id}
                onClick={() => {
                  const path = result.type === "ADVISOR" ? "/advisors" : result.type === "BUSINESS" ? "/directory" : "/marketplace";
                  router.push(`${path}/${result.id}`);
                }}
                className="p-6 flex items-center gap-6 hover:bg-slate-50 cursor-pointer transition-colors group"
              >
                <div className="h-14 w-14 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 grayscale group-hover:grayscale-0 transition-all">
                  {result.type === "ADVISOR" ? <User size={24} /> : result.type === "BUSINESS" ? <Building2 size={24} /> : <Briefcase size={24} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-lg font-black uppercase  truncate">{result.name || result.title}</h4>
                    <span className="px-2 py-0.5 bg-slate-100 text-[8px] font-black uppercase text-slate-400 rounded-md">{result.type}</span>
                  </div>
                  <p className="text-[10px] font-black text-slate-300 uppercase ">{result.category}  {result.location}</p>
                </div>
                <div className="text-right shrink-0">
                   <p className="text-2xl font-black text-[#E53935]  leading-none">{result.matchScore}%</p>
                   <p className="text-[8px] font-black text-slate-200 uppercase ">Match</p>
                </div>
                <ArrowUpRight size={20} className="text-slate-100 group-hover:text-[#E53935] transition-colors ml-4" />
              </div>
            ))}

            {searchResults.length === 0 && (
              <div className="py-20 text-center">
                  <p className="text-[10px] font-black text-slate-200 uppercase ">No matches found.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
