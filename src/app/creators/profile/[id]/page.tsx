"use client";

import React, { useState } from "react";
import { Star, CheckCircle2, MapPin, Mail, Instagram, Globe, Play, ChevronLeft, Bookmark, Shield, Award } from "lucide-react";
import Link from "next/link";
import Button from "@/components/ui/Button";

export default function PremiumCreatorProfilePage({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = useState<"PORTFOLIO" | "CASE_STUDIES" | "REVIEWS">("PORTFOLIO");
  const [isBookmarked, setIsBookmarked] = useState(false);

  return (
    <div className="bg-[#FBFBFD] min-h-screen pb-32">
      {/* Premium Cover Photo Area */}
      <div className="h-72 md:h-[400px] w-full bg-black relative">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542038784456-1ea8e935640e?q=80&w=2070')] bg-cover bg-center opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#FBFBFD] via-transparent to-transparent" />
        
        <div className="absolute top-6 left-6 right-6 flex justify-between z-20">
          <Link href="/creators" className="h-12 w-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white hover:text-black transition-colors">
            <ChevronLeft size={20} />
          </Link>
          <button 
            onClick={() => setIsBookmarked(!isBookmarked)}
            className={`h-12 w-12 rounded-full backdrop-blur-md border border-white/20 flex items-center justify-center transition-colors ${isBookmarked ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white hover:text-black'}`}
          >
            <Bookmark size={20} fill={isBookmarked ? "currentColor" : "none"} />
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10 -mt-32 md:-mt-48">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Left Column: Core Profile Identity */}
          <div className="w-full lg:w-1/3 space-y-6">
            <div className="bg-white rounded-[2rem] p-8 border border-black/[0.05] shadow-2xl shadow-black/[0.03]">
              <div className="h-32 w-32 md:h-40 md:w-40 rounded-full bg-gray-200 border-4 border-white shadow-xl mx-auto -mt-24 md:-mt-28 overflow-hidden relative">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1064')] bg-cover bg-center" />
              </div>
              
              <div className="text-center mt-6 space-y-3">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-amber-100 to-amber-50 text-amber-700 border border-amber-200 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">
                  <Award size={12} /> Elite Creator
                </div>
                
                <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight flex items-center justify-center gap-2">
                  Sarah Jenkins
                  <Shield size={24} className="text-blue-500" fill="currentColor" />
                </h1>
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#E53935]">Photographer & UGC Creator</p>
                <p className="text-black/40 font-medium flex items-center justify-center gap-1">
                  <MapPin size={14} /> Trivandrum • Available This Week
                </p>
              </div>

              {/* Trust Engine Stats */}
              <div className="grid grid-cols-3 gap-4 mt-8 pt-8 border-t border-black/5">
                <div className="text-center">
                  <p className="text-2xl font-black">100</p>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-black/40 mt-1">Trust Score</p>
                </div>
                <div className="text-center border-l border-r border-black/5">
                  <p className="text-2xl font-black">98%</p>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-black/40 mt-1">Completion</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-black flex items-center justify-center gap-1"><Star size={16} fill="currentColor" /> 5.0</p>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-black/40 mt-1">45 Reviews</p>
                </div>
              </div>

              <div className="mt-8 space-y-3">
                <Button className="w-full h-14 rounded-2xl bg-[#E53935] text-white text-xs font-black uppercase tracking-[0.1em] hover:bg-black shadow-lg shadow-red-500/20">
                  Shortlist & Hire
                </Button>
                <Button className="w-full h-14 rounded-2xl bg-black/5 text-black text-xs font-black uppercase tracking-[0.1em] hover:bg-black/10">
                  Message
                </Button>
              </div>

              <div className="mt-8 pt-8 border-t border-black/5 flex justify-center gap-6 text-black/40">
                <a href="#" className="hover:text-black transition-colors"><Instagram size={24} /></a>
                <a href="#" className="hover:text-black transition-colors"><Globe size={24} /></a>
                <a href="#" className="hover:text-black transition-colors"><Mail size={24} /></a>
              </div>
            </div>

            {/* Repeat Business Stats */}
            <div className="bg-white rounded-[2rem] p-6 border border-black/[0.05]">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                  <Star size={20} fill="currentColor" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-[0.1em]">Client Retention</h3>
                  <p className="text-xs text-black/40 font-medium">Top 5% on Checkout</p>
                </div>
              </div>
              <div className="w-full bg-black/5 rounded-full h-2 mb-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '85%' }}></div>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-black/40">85% Repeat Client Rate</p>
            </div>
          </div>

          {/* Right Column: Premium Portfolio & Case Studies */}
          <div className="w-full lg:w-2/3 space-y-8">
            <div className="bg-white rounded-[2rem] p-8 md:p-10 border border-black/[0.05]">
              <h2 className="text-2xl font-black uppercase tracking-tight mb-4">About the Creator</h2>
              <p className="text-black/60 font-medium leading-relaxed text-lg">
                I am a professional lifestyle photographer and UGC creator with over 5 years of experience working with top brands in fashion, F&B, and tech. My visual storytelling focuses on organic, authentic moments that drive high engagement and conversions for businesses. 
              </p>
              
              <div className="mt-8 flex flex-wrap gap-2">
                {["Brand Identity", "UGC Video", "Product Photography", "Adobe Premiere", "Set Styling"].map((skill) => (
                  <span key={skill} className="px-4 py-2 bg-black/[0.03] text-black rounded-xl text-xs font-bold uppercase tracking-widest border border-black/5">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Premium Tabs */}
            <div className="flex gap-4 border-b border-black/5 pb-4 overflow-x-auto no-scrollbar">
              {["PORTFOLIO", "CASE_STUDIES", "REVIEWS"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-[0.1em] transition-all whitespace-nowrap ${
                    activeTab === tab ? "bg-black text-white shadow-md" : "bg-white border border-black/5 text-black/40 hover:text-black hover:border-black/20"
                  }`}
                >
                  {tab.replace('_', ' ')}
                </button>
              ))}
            </div>

            {/* Portfolio Grid (Behance Style) */}
            {activeTab === "PORTFOLIO" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { img: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=900', title: 'Summer Collection', client: 'Lumina Apparel' },
                  { img: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=900', title: 'Product Launch', client: 'TechFlow' },
                  { img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=900', title: 'Lifestyle Campaign', client: 'Urban Roast' },
                  { img: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=900', title: 'Editorial Shoot', client: 'Vogue India' }
                ].map((item, i) => (
                  <div key={i} className="group relative overflow-hidden rounded-[2rem] bg-black aspect-[4/3] cursor-pointer">
                    <div className={`absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105 opacity-80 group-hover:opacity-100`} style={{ backgroundImage: `url(${item.img})`}} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    <div className="absolute bottom-0 left-0 right-0 p-8 translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <h3 className="text-white text-2xl font-black uppercase tracking-tight">{item.title}</h3>
                      <p className="text-white/70 text-xs font-bold uppercase tracking-[0.2em] mt-1">{item.client}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Case Studies Tab (V2.5 Feature) */}
            {activeTab === "CASE_STUDIES" && (
              <div className="space-y-8">
                <div className="bg-white rounded-[2rem] border border-black/5 overflow-hidden">
                  <div className="h-64 bg-gray-900 relative">
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=2000')] bg-cover bg-center opacity-60" />
                    <div className="absolute bottom-6 left-6 text-white">
                      <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-lg text-[10px] font-black uppercase tracking-[0.2em] mb-3 inline-block">Case Study</span>
                      <h3 className="text-3xl font-black uppercase tracking-tight">Spice Route: 300% Engagement Boost</h3>
                    </div>
                  </div>
                  <div className="p-8 space-y-6">
                    <div className="grid grid-cols-3 gap-6 text-center border-b border-black/5 pb-6">
                      <div>
                        <p className="text-2xl font-black text-[#E53935]">+300%</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-black/40 mt-1">Engagement</p>
                      </div>
                      <div>
                        <p className="text-2xl font-black text-[#E53935]">1.2M</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-black/40 mt-1">Impressions</p>
                      </div>
                      <div>
                        <p className="text-2xl font-black text-[#E53935]">14 Days</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-black/40 mt-1">Turnaround</p>
                      </div>
                    </div>
                    <p className="text-black/60 font-medium">
                      Spice Route needed a complete visual overhaul for their new menu launch. I directed, shot, and edited 15 short-form UGC videos and 40 high-res lifestyle images that were deployed across IG and TikTok, resulting in their highest grossing weekend of the year.
                    </p>
                    <Button className="h-12 rounded-xl bg-black/5 text-black text-xs font-black uppercase tracking-[0.1em] hover:bg-black/10 px-6">
                      Read Full Study
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Testimonials (Reviews) Tab */}
            {activeTab === "REVIEWS" && (
              <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white p-8 rounded-[2rem] border border-black/5">
                    <div className="flex gap-1 text-yellow-400 mb-4">
                      <Star size={16} fill="currentColor" />
                      <Star size={16} fill="currentColor" />
                      <Star size={16} fill="currentColor" />
                      <Star size={16} fill="currentColor" />
                      <Star size={16} fill="currentColor" />
                    </div>
                    <p className="text-lg font-medium italic text-black/80">
                      "Absolutely phenomenal work. Sarah completely understood our brand vision and delivered assets that looked 10x more premium than our budget. We are already booking her for our next quarter campaign."
                    </p>
                    <div className="mt-6 flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gray-200" />
                      <div>
                        <p className="font-bold text-sm">Marcus Director</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-black/40">CMO @ Lumina Apparel</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
