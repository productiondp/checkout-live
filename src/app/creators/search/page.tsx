"use client";

import React from "react";
import { Search, Filter, Briefcase, MapPin, CheckCircle2 } from "lucide-react";
import Button from "@/components/ui/Button";

export default function CreatorSearchPage() {
  return (
    <div className="p-6 md:p-12 max-w-7xl mx-auto space-y-12">
      
      <div className="space-y-4">
        <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-none">
          Smart Search.
        </h1>
        <p className="text-black/40 font-medium text-lg max-w-xl">
          Find exact talent or opportunities using category, budget, and availability filters.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        
        {/* Filters Sidebar */}
        <div className="w-full md:w-64 shrink-0 space-y-8">
          <div className="space-y-3">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-black/40">Category</h3>
            <select className="w-full h-12 bg-white border border-black/10 rounded-xl px-4 text-sm font-bold uppercase">
              <option>All Creators</option>
              <option>Influencers</option>
              <option>Photographers</option>
              <option>Designers</option>
            </select>
          </div>

          <div className="space-y-3">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-black/40">Location</h3>
            <div className="relative">
              <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-black/40" />
              <input type="text" placeholder="Trivandrum" className="w-full h-12 bg-white border border-black/10 rounded-xl pl-10 pr-4 text-sm font-bold placeholder:text-black/30" />
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-black/40">Verification</h3>
            <label className="flex items-center gap-3 p-3 rounded-xl border border-black/5 hover:bg-black/5 cursor-pointer transition-colors">
              <input type="checkbox" className="accent-black w-4 h-4" defaultChecked />
              <span className="text-xs font-bold uppercase tracking-[0.1em]">Verified Only</span>
            </label>
          </div>
          
          <Button className="w-full h-14 rounded-2xl bg-black text-white text-xs font-black uppercase tracking-[0.1em]">
            Apply Filters
          </Button>
        </div>

        {/* Search Input & Results */}
        <div className="flex-1 space-y-8">
          <div className="relative">
            <Search size={24} className="absolute left-6 top-1/2 -translate-y-1/2 text-black/40" />
            <input 
              type="text" 
              placeholder="Search by skills, names, or industries..." 
              className="w-full h-20 bg-white border border-black/10 rounded-3xl pl-16 pr-6 text-xl font-bold placeholder:text-black/30 shadow-sm focus:border-black focus:outline-none transition-all"
            />
          </div>

          <div className="bg-white rounded-2xl border border-black/5 p-8 text-center space-y-4">
             <div className="h-16 w-16 bg-black/5 rounded-2xl flex items-center justify-center mx-auto text-black/40">
                <Search size={24} />
             </div>
             <h3 className="text-xl font-black uppercase tracking-tight">Run a search to see results</h3>
             <p className="text-black/40 font-medium">Our engine ranks results by relevance and trust score.</p>
          </div>
        </div>

      </div>

    </div>
  );
}
