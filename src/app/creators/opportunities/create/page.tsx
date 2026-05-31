"use client";

import React from "react";
import { ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";
import Button from "@/components/ui/Button";

export default function CreateOpportunityPage() {
  return (
    <div className="p-6 md:p-12 max-w-3xl mx-auto space-y-12">
      
      <div className="space-y-6">
        <Link href="/creators/opportunities" className="inline-flex items-center gap-2 text-black/40 hover:text-black font-bold uppercase tracking-widest text-[10px] transition-colors">
          <ArrowLeft size={14} /> Back to Dashboard
        </Link>
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase leading-none">
          Post an Opportunity.
        </h1>
        <p className="text-black/40 font-medium text-lg">
          Describe what you need. Our AI will instantly match you with the best verified creators in your area.
        </p>
      </div>

      <form className="space-y-8 bg-white p-8 md:p-10 rounded-2xl border border-black/5 shadow-2xl shadow-black/[0.02]">
        
        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-black/40">Project Title</label>
          <input 
            type="text" 
            placeholder="e.g., Summer Fashion Campaign Shoot" 
            className="w-full h-14 bg-[#FBFBFD] border border-black/10 rounded-2xl px-4 text-base font-bold placeholder:text-black/30 focus:border-black focus:outline-none transition-all"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-black/40">Category</label>
            <select className="w-full h-14 bg-[#FBFBFD] border border-black/10 rounded-2xl px-4 text-sm font-bold uppercase focus:border-black focus:outline-none">
              <option>Influencer Campaign</option>
              <option>Photography Project</option>
              <option>UGC Creation</option>
              <option>Video Editing</option>
            </select>
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-black/40">Budget Range</label>
            <input 
              type="text" 
              placeholder="e.g., $500 - $1000" 
              className="w-full h-14 bg-[#FBFBFD] border border-black/10 rounded-2xl px-4 text-base font-bold placeholder:text-black/30 focus:border-black focus:outline-none transition-all"
            />
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-black/40">Location Requirements</label>
          <div className="flex gap-4">
            <label className="flex-1 flex items-center justify-center gap-2 p-4 rounded-2xl border border-black hover:bg-black/5 cursor-pointer transition-colors">
              <input type="radio" name="loc" className="accent-black w-4 h-4" defaultChecked />
              <span className="text-xs font-bold uppercase tracking-[0.1em]">On-Site (Local)</span>
            </label>
            <label className="flex-1 flex items-center justify-center gap-2 p-4 rounded-2xl border border-black/10 hover:border-black cursor-pointer transition-colors text-black/40 hover:text-black">
              <input type="radio" name="loc" className="accent-black w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-[0.1em]">Remote</span>
            </label>
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-black/40">Project Description & Deliverables</label>
          <textarea 
            rows={5}
            placeholder="Describe the exact deliverables, style requirements, and timeline..." 
            className="w-full bg-[#FBFBFD] border border-black/10 rounded-2xl p-4 text-base font-bold placeholder:text-black/30 focus:border-black focus:outline-none transition-all resize-none"
          />
        </div>

        <div className="pt-6 border-t border-black/5 flex justify-end gap-4">
          <Button type="button" className="h-14 rounded-2xl bg-black/5 text-black text-xs font-black uppercase tracking-[0.1em] hover:bg-black/10 px-8">
            Save Draft
          </Button>
          <Button type="button" className="h-14 rounded-2xl bg-[#E53935] text-white text-xs font-black uppercase tracking-[0.1em] hover:bg-black px-8 flex items-center gap-2">
            <Sparkles size={16} /> Post & Find Matches
          </Button>
        </div>

      </form>
    </div>
  );
}
