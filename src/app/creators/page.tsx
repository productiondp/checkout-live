"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Sparkles, MapPin, Star, Briefcase, ChevronRight, CheckCircle2 } from "lucide-react";
import Button from "@/components/ui/Button";
import { createClient } from "@/utils/supabase/client";

export default function CreatorsDiscoveryFeed() {
  const [role, setRole] = useState<"CREATOR" | "BUSINESS">("BUSINESS"); // Toggle for demo/admin view
  const [creators, setCreators] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => {
    async function fetchCreators() {
      const { data } = await supabase
        .from("creator_profiles")
        .select(`
          *,
          profiles (
            full_name,
            avatar_url,
            location
          )
        `)
        .order('trust_score', { ascending: false });
      
      if (data) setCreators(data);
    }
    fetchCreators();
  }, [supabase]);

  return (
    <div className="px-4 lg:px-8 space-y-8 pb-20 mt-8 max-w-[1600px] mx-auto">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 border border-red-100 text-[#E53935]">
            <Sparkles size={14} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">AI Match Engine Active</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-none">
            {role === "BUSINESS" ? "Find the Perfect Creator." : "Discover Opportunities."}
          </h1>
          <p className="text-black/40 font-medium text-lg max-w-xl">
            {role === "BUSINESS" 
              ? "Our AI analyzes skills, portfolios, and reputation to match you with top-tier local creators."
              : "We found highly relevant projects based on your portfolio and availability."}
          </p>
        </div>

        {/* Temporary Role Toggle for V1 Preview */}
        <div className="flex items-center gap-2 bg-black/[0.03] p-1 rounded-2xl border border-black/[0.05]">
          <button 
            onClick={() => setRole("BUSINESS")}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-[0.1em] transition-all ${role === "BUSINESS" ? "bg-white shadow-sm text-black" : "text-black/40 hover:text-black"}`}
          >
            I'm a Business
          </button>
          <button 
            onClick={() => setRole("CREATOR")}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-[0.1em] transition-all ${role === "CREATOR" ? "bg-white shadow-sm text-black" : "text-black/40 hover:text-black"}`}
          >
            I'm a Creator
          </button>
        </div>
      </div>

      {/* Main Feed */}
      <div className="space-y-8">
        <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
          {role === "BUSINESS" ? "Top Matches For You" : "Recommended Projects"}
          <span className="text-xs text-black/30 font-medium tracking-normal">(Based on recent activity)</span>
        </h2>

        {role === "BUSINESS" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(() => {
              const MOCK_CREATORS = [
                { id: "mock-1", profiles: { full_name: "Sarah Jenkins" }, specialties: ["Photographer & UGC"], trust_score: 95, is_verified: true, portfolio_images: ["https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=800"] },
                { id: "mock-2", profiles: { full_name: "Rajat Menon" }, specialties: ["Motion Designer"], trust_score: 88, is_verified: true, portfolio_images: ["https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=800"] },
                { id: "mock-3", profiles: { full_name: "Priya Patel" }, specialties: ["Influencer"], trust_score: 70, is_verified: false, portfolio_images: ["https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=800"] }
              ];
              
              const displayCreators = [...creators];
              if (displayCreators.length < 3) {
                const needed = 3 - displayCreators.length;
                displayCreators.push(...MOCK_CREATORS.slice(0, needed));
              }

              if (displayCreators.length === 0) {
                return <p className="text-slate-400 font-medium col-span-full">No creators found. Set up a profile to appear here.</p>;
              }

              return displayCreators.map((creator, i) => {
                const name = creator.profiles?.full_name || "Creator";
                const cat = creator.specialties?.[0] || creator.category || "Creator";
                const match = 80 + Math.floor(Math.random() * 20); // Random high match for demo
                const trust = creator.trust_score || 50;
                const avatar = creator.portfolio_images?.[0] || creator.profiles?.avatar_url || null;
                const isVerified = creator.is_verified;

                return (
                  <Link href={`/creators/profile/${creator.id}`} key={i} className="group flex flex-col bg-white rounded-3xl border border-black/[0.05] overflow-hidden hover:border-black/[0.1] hover:shadow-xl transition-all">
                    {/* Cover / Portfolio Preview */}
                    <div className="h-40 bg-gray-100 relative overflow-hidden">
                      {avatar && (
                        <img src={avatar} alt="" className="absolute inset-0 w-full h-full object-cover" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent z-10" />
                      <div className="absolute bottom-4 left-4 z-20">
                        <div className="flex items-center gap-2">
                          <div className="h-12 w-12 rounded-full bg-white p-1">
                            {avatar ? (
                              <img src={avatar} className="w-full h-full rounded-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-gray-200 rounded-full" />
                            )}
                          </div>
                          <div className="text-white">
                            <h3 className="font-black tracking-tight leading-none flex items-center gap-1">
                              {name}
                              {isVerified && <CheckCircle2 size={14} className="text-blue-400" />}
                            </h3>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-white/80">{cat}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Stats */}
                    <div className="p-5 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest text-black/40">AI Match</span>
                        <span className="text-lg font-black text-[#E53935]">{match}%</span>
                      </div>
                      <div className="w-px h-8 bg-black/5" />
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest text-black/40">Trust Score</span>
                        <span className="text-lg font-black">{trust}/100</span>
                      </div>
                      <div className="w-px h-8 bg-black/5" />
                      <div className="h-10 w-10 rounded-xl bg-black/5 flex items-center justify-center text-black group-hover:bg-black group-hover:text-white transition-colors">
                        <ChevronRight size={18} />
                      </div>
                    </div>
                  </Link>
                );
              });
            })()}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Mock Opportunities for V1 Foundation */}
            {[
              { title: "Summer Fashion Campaign Shoot", brand: "Lumina Apparel", budget: "$1k - $2k", match: 96, location: "Trivandrum", urgent: true },
              { title: "Restaurant Grand Opening Coverage", brand: "Spice Route", budget: "$500", match: 89, location: "Trivandrum", urgent: false },
            ].map((opp, i) => (
              <div key={i} className="bg-white p-6 md:p-8 rounded-[2rem] border border-black/[0.05] hover:shadow-xl transition-all space-y-6 group">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    {opp.urgent && (
                      <span className="inline-block px-3 py-1 rounded-full bg-orange-100 text-orange-600 text-[10px] font-black uppercase tracking-[0.2em]">Urgent Fill</span>
                    )}
                    <h3 className="text-2xl font-black uppercase tracking-tight leading-tight">{opp.title}</h3>
                    <p className="text-black/50 font-medium flex items-center gap-2">
                      <Briefcase size={16} /> {opp.brand} • <MapPin size={16} /> {opp.location}
                    </p>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black uppercase tracking-widest text-black/40">Match</span>
                    <span className="text-2xl font-black text-[#E53935]">{opp.match}%</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-black/[0.05]">
                  <div className="font-bold text-lg">{opp.budget}</div>
                  <Button className="rounded-2xl px-8 bg-black text-white text-xs font-black uppercase tracking-[0.1em] group-hover:bg-[#E53935]">
                    Apply Now
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
