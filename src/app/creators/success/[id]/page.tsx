"use client";

import React from "react";
import { Star, Quote, ArrowRight, Share2 } from "lucide-react";
import Link from "next/link";
import Button from "@/components/ui/Button";

export default function SuccessStoryPage({ params }: { params: { id: string } }) {
  return (
    <div className="bg-[#FBFBFD] min-h-screen">
      
      {/* Hero Section */}
      <div className="h-screen/70 min-h-[600px] bg-black relative flex items-center">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=2070')] bg-cover bg-center opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10 w-full space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-[10px] font-black uppercase tracking-[0.2em] text-white">
             Success Story
          </div>
          <h1 className="text-5xl md:text-8xl font-black tracking-tighter uppercase leading-none text-white max-w-4xl">
            Spice Route's 300% Growth via Local UGC
          </h1>
          <p className="text-xl text-white/60 font-medium max-w-2xl">
            How a local restaurant partnered with Elite Creator Sarah Jenkins through Checkout to revamp their visual identity and triple weekend footfall.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-20 space-y-16">
        
        {/* Results Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 -mt-32 relative z-20">
          <div className="bg-white p-8 rounded-[2rem] border border-black/5 shadow-2xl shadow-black/5 text-center">
            <p className="text-4xl font-black text-[#E53935]">+300%</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-black/40 mt-2">Social Engagement</p>
          </div>
          <div className="bg-white p-8 rounded-[2rem] border border-black/5 shadow-2xl shadow-black/5 text-center">
            <p className="text-4xl font-black text-[#E53935]">1.2M</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-black/40 mt-2">Local Impressions</p>
          </div>
          <div className="bg-white p-8 rounded-[2rem] border border-black/5 shadow-2xl shadow-black/5 text-center">
            <p className="text-4xl font-black text-[#E53935]">14 Days</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-black/40 mt-2">Total Turnaround</p>
          </div>
        </div>

        {/* Content */}
        <div className="prose prose-lg prose-black max-w-none">
          <h2 className="text-3xl font-black uppercase tracking-tight">The Challenge</h2>
          <p className="text-black/70 font-medium leading-relaxed">
            Spice Route had incredible food but a non-existent digital footprint. Their menu photos were outdated, and they weren't capturing the vibrant, energetic atmosphere of their weekend dining experience. They needed authentic, high-quality content but didn't want to hire an expensive traditional agency.
          </p>

          <h2 className="text-3xl font-black uppercase tracking-tight mt-12">The Checkout Match</h2>
          <p className="text-black/70 font-medium leading-relaxed">
            Using Checkout's AI Match Engine, Spice Route posted an opportunity for a "Restaurant Revamp Shoot". Within 2 hours, they were matched with Sarah Jenkins, an Elite-level UGC Creator located just 3 miles away with a 100 Trust Score.
          </p>

          <blockquote className="my-12 p-8 bg-black/5 rounded-[2rem] border-l-4 border-[#E53935]">
            <Quote size={32} className="text-[#E53935] mb-4" />
            <p className="text-xl font-bold italic">
              "The process was completely frictionless. The workspace was created automatically, the contract was signed digitally within the app, and Sarah started shooting the very next day. Checkout handles all the operational friction so we could focus on the creative."
            </p>
            <footer className="mt-4 text-sm font-black uppercase tracking-widest text-black/40">
              — Manager, Spice Route
            </footer>
          </blockquote>
        </div>

        {/* CTA */}
        <div className="bg-black text-white p-12 rounded-[2rem] text-center space-y-6">
          <h2 className="text-3xl font-black uppercase tracking-tight">Ready for your own success story?</h2>
          <p className="text-white/60 font-medium">Post your opportunity and let our AI match you with verified local talent.</p>
          <div className="pt-4">
            <Button className="h-14 px-8 rounded-2xl bg-[#E53935] text-white text-xs font-black uppercase tracking-[0.1em] hover:bg-white hover:text-black transition-colors">
              Post an Opportunity
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
