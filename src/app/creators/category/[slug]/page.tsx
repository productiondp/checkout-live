"use client";

import React from "react";
import Link from "next/link";
import { Star, MapPin, CheckCircle2, ChevronRight, TrendingUp, Filter } from "lucide-react";
import Button from "@/components/ui/Button";

export default function CategoryHubPage({ params }: { params: { slug: string } }) {
  const categoryName = params.slug.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());

  return (
    <div className="bg-[#FBFBFD] min-h-screen">
      {/* Hero Section */}
      <div className="bg-black text-white px-6 py-20 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent opacity-20" />
        <div className="relative z-10 max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-xs font-black uppercase tracking-[0.2em]">
            <TrendingUp size={14} /> Trending Category
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-none">
            {categoryName}
          </h1>
          <p className="text-lg text-white/60 font-medium max-w-2xl mx-auto">
            Discover elite, verified {categoryName.toLowerCase()} ready to elevate your brand. Filter by availability, local proximity, and trust score.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 md:p-12 space-y-16">
        
        {/* Filters & Availability Engine */}
        <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-2xl border border-black/5 shadow-sm gap-4">
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto no-scrollbar pb-2 md:pb-0">
            <Button className="shrink-0 h-10 rounded-xl bg-black text-white text-[10px] font-black uppercase tracking-[0.1em] px-4">
              All
            </Button>
            <Button className="shrink-0 h-10 rounded-xl bg-black/5 text-black hover:bg-black/10 text-[10px] font-black uppercase tracking-[0.1em] px-4">
              Available Now
            </Button>
            <Button className="shrink-0 h-10 rounded-xl bg-black/5 text-black hover:bg-black/10 text-[10px] font-black uppercase tracking-[0.1em] px-4 flex items-center gap-2">
              <MapPin size={12} /> Near Me
            </Button>
            <Button className="shrink-0 h-10 rounded-xl bg-black/5 text-black hover:bg-black/10 text-[10px] font-black uppercase tracking-[0.1em] px-4 flex items-center gap-2">
              <CheckCircle2 size={12} /> Verified Pros
            </Button>
          </div>
          <Button className="w-full md:w-auto shrink-0 h-10 rounded-xl bg-black/5 text-black hover:bg-black/10 text-[10px] font-black uppercase tracking-[0.1em] px-4 flex items-center gap-2 justify-center">
            <Filter size={14} /> Filters
          </Button>
        </div>

        {/* Featured Elite Creators */}
        <div className="space-y-6">
          <h2 className="text-2xl font-black uppercase tracking-tight">Elite {categoryName}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Link href="/creators/profile/featured" key={i} className="group bg-white rounded-3xl border border-black/5 overflow-hidden hover:shadow-xl transition-all block">
                <div className="h-48 bg-gray-200 relative">
                  <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542038784456-1ea8e935640e?q=80&w=2070')] bg-cover bg-center" />
                  <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full border border-white/20">
                    Elite Level
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-black text-xl flex items-center gap-1">
                        Jordan Hayes
                        <CheckCircle2 size={16} className="text-blue-500" />
                      </h3>
                      <p className="text-xs text-black/40 font-bold uppercase tracking-widest mt-1 flex items-center gap-1">
                        <MapPin size={12} /> Local Match
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-black flex items-center justify-end gap-1"><Star size={16} fill="currentColor" /> 5.0</div>
                      <p className="text-[10px] text-black/40 font-bold uppercase tracking-widest mt-1">100 Trust</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span className="px-3 py-1 bg-green-50 text-green-700 rounded-lg text-[10px] font-black uppercase tracking-widest">Available This Week</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Open Opportunities in Category */}
        <div className="space-y-6">
          <div className="flex justify-between items-end">
            <h2 className="text-2xl font-black uppercase tracking-tight">Trending Projects</h2>
            <Link href="/creators/search" className="text-xs font-black uppercase tracking-[0.1em] text-black/40 hover:text-black flex items-center gap-1">
              View All <ChevronRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white p-8 rounded-[2rem] border border-black/5 hover:border-black/10 transition-colors">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#E53935] bg-red-50 px-2 py-1 rounded-md mb-3 inline-block">High Demand</span>
                    <h3 className="text-xl font-black uppercase tracking-tight">Need {categoryName} for Launch</h3>
                    <p className="text-black/40 font-medium text-sm mt-1">Acme Corp • Local</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black">$2,000</p>
                    <p className="text-[10px] text-black/40 font-bold uppercase tracking-widest">Budget</p>
                  </div>
                </div>
                <Button className="w-full h-12 rounded-xl bg-black/5 text-black text-xs font-black uppercase tracking-[0.1em] hover:bg-black hover:text-white transition-colors">
                  View Details
                </Button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
