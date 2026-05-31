"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, MapPin, Briefcase, Check, Sparkles, Building2, Calendar, FileText, BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

export default function OpportunityDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [opp, setOpp] = useState<any>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    const fetchOpp = async () => {
      if (!params.id) return;
      try {
        const { data } = await supabase.from('opportunities').select('*').eq('id', params.id).single();
        if (data) setOpp(data);
        else setOpp(null);
      } catch (e) {
        console.error("Error fetching opportunity", e);
      }
    };
    fetchOpp();
  }, [params.id]);

  const handleApply = () => {
    setIsApplying(true);
    setTimeout(() => {
      setIsApplying(false);
      setApplied(true);
    }, 1500);
  };

  if (!opp) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E53935]"></div>
        <p className="text-xs font-bold uppercase tracking-widest text-black/40">Loading Deal Intel...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-screen bg-[#FAF9FC] overflow-y-auto">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-black/[0.04] px-6 md:px-12 h-20 flex items-center justify-between shrink-0">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-black/50 hover:text-black transition-colors"
        >
          <ArrowLeft size={16} /> Back to Library
        </button>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black uppercase tracking-widest text-black/40 hidden md:block">Campaign ID: {opp.id}</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6 md:p-12 max-w-5xl mx-auto w-full space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
        
        {/* Top Block: Title & Status */}
        <div className="bg-white rounded-3xl border border-black/[0.06] shadow-xl p-8 md:p-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#E53935]/5 rounded-bl-full pointer-events-none" />
          
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 relative z-10">
            <div className="space-y-4 max-w-2xl">
              <div className="flex items-center gap-3">
                <span className={cn(
                  "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm",
                  opp.status === "ACTIVE" ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500"
                )}>{opp.status}</span>
                <span className="text-[10px] font-bold text-black/40 uppercase tracking-widest flex items-center gap-1.5">
                  <Calendar size={14} /> Posted {opp.date}
                </span>
              </div>
              <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight leading-tight text-black">{opp.title}</h1>
              
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-black/60 bg-black/5 px-4 py-2 rounded-xl">
                  <Building2 size={16} className="text-[#E53935]" /> {opp.postedBy}
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-black/60 bg-black/5 px-4 py-2 rounded-xl">
                  <Briefcase size={16} className="text-[#E53935]" /> {opp.category}
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-black/60 bg-black/5 px-4 py-2 rounded-xl">
                  <MapPin size={16} className="text-[#E53935]" /> {opp.location}
                </div>
              </div>
            </div>

            {/* Budget & Apply Box */}
            <div className="bg-slate-50 border border-black/[0.04] rounded-2xl p-6 md:p-8 shrink-0 md:min-w-[300px] flex flex-col items-center justify-center text-center shadow-inner">
              <p className="text-[10px] font-black uppercase tracking-widest text-black/40 mb-1">Approved Budget</p>
              <p className="text-4xl font-black text-black mb-6">{opp.budget}</p>
              
              {opp.status === "ACTIVE" ? (
                <button
                  onClick={handleApply}
                  disabled={isApplying || applied}
                  className={cn(
                    "w-full h-14 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2",
                    applied ? "bg-emerald-500 text-white shadow-emerald-500/20" : 
                    isApplying ? "bg-black/5 text-black/40 cursor-not-allowed" : 
                    "bg-[#E53935] text-white hover:bg-black hover:shadow-xl hover:-translate-y-0.5"
                  )}
                >
                  {isApplying ? (
                    <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black/40" /> Submitting...</>
                  ) : applied ? (
                    <><Check size={16} /> Application Sent</>
                  ) : (
                    <><Sparkles size={16} /> Apply Now</>
                  )}
                </button>
              ) : (
                <div className="w-full h-14 rounded-xl bg-slate-200 text-slate-400 text-xs font-black uppercase tracking-widest flex items-center justify-center cursor-not-allowed">
                  Closed
                </div>
              )}
              {applied && <p className="text-[9px] font-bold text-emerald-600 uppercase mt-3">The brand will review your profile.</p>}
            </div>
          </div>
        </div>

        {/* Detailed Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          <div className="space-y-6">
            <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2 text-black">
              <FileText size={20} className="text-[#E53935]" /> Campaign Brief
            </h2>
            <div className="bg-white rounded-3xl p-8 border border-black/[0.06] shadow-xl text-sm font-bold text-black/70 leading-relaxed">
              {opp.description}
            </div>

            <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2 text-black pt-4">
              <BadgeCheck size={20} className="text-[#E53935]" /> Creator Requirements
            </h2>
            <div className="bg-white rounded-3xl p-8 border border-black/[0.06] shadow-xl text-sm font-bold text-black/70 leading-relaxed">
              {opp.requirements}
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2 text-black">
              <Check size={20} className="text-emerald-500" /> Required Deliverables
            </h2>
            <div className="bg-white rounded-3xl p-8 border border-black/[0.06] shadow-xl space-y-4">
              {opp.deliverables ? opp.deliverables.map((del: string, idx: number) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-100 mt-0.5">
                    <Check size={12} className="text-emerald-600" />
                  </div>
                  <span className="text-sm font-bold text-black/70">{del}</span>
                </div>
              )) : (
                <p className="text-sm font-bold text-black/40">No specific deliverables outlined.</p>
              )}
            </div>

            <div className="bg-slate-900 rounded-3xl p-8 text-white mt-8 shadow-2xl relative overflow-hidden">
              <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-[#E53935]/20 blur-3xl rounded-full pointer-events-none" />
              <h3 className="text-lg font-black uppercase tracking-tight mb-2 relative z-10">Safe Payments Guaranteed</h3>
              <p className="text-xs font-bold text-white/60 leading-relaxed relative z-10 mb-6">
                When you apply and get accepted through Checkout OS, your budget is held in secure escrow. You are guaranteed payout within 48 hours of deliverable approval.
              </p>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-400">
                <Check size={14} /> Checkout OS Protected
              </div>
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}
