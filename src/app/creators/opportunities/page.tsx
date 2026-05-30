"use client";

import React, { useState } from "react";
import { Plus, Filter, LayoutGrid } from "lucide-react";
import Link from "next/link";
import Button from "@/components/ui/Button";

export default function OpportunitiesPage() {
  return (
    <div className="p-6 md:p-12 max-w-7xl mx-auto space-y-12">
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-none">
            Opportunities.
          </h1>
          <p className="text-black/40 font-medium text-lg max-w-xl">
            Manage your open projects, incoming applications, and track active collaborations.
          </p>
        </div>
        
        <Link href="/creators/opportunities/create">
          <Button className="h-14 rounded-2xl bg-[#E53935] text-white text-xs font-black uppercase tracking-[0.1em] hover:bg-black flex items-center gap-2">
            <Plus size={16} /> Post Opportunity
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-black/5 pb-4 overflow-x-auto">
        {["ACTIVE (0)", "DRAFT (0)", "COMPLETED (0)"].map((tab, i) => (
          <button
            key={tab}
            className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-[0.1em] transition-all whitespace-nowrap ${
              i === 0 ? "bg-black text-white" : "bg-black/5 text-black/40 hover:text-black"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-[2rem] border border-black/5 p-12 text-center space-y-4">
         <div className="h-16 w-16 bg-black/5 rounded-2xl flex items-center justify-center mx-auto text-black/40">
            <LayoutGrid size={24} />
         </div>
         <h3 className="text-xl font-black uppercase tracking-tight">No Active Opportunities</h3>
         <p className="text-black/40 font-medium max-w-md mx-auto">
           You haven't posted any opportunities yet. Post your first project to start receiving AI-matched creators instantly.
         </p>
         <div className="pt-6">
           <Link href="/creators/opportunities/create">
             <Button className="h-12 rounded-xl bg-black text-white text-xs font-black uppercase tracking-[0.1em]">
               Post Now
             </Button>
           </Link>
         </div>
      </div>

    </div>
  );
}
