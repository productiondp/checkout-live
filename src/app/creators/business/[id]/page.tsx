"use client";

import React from "react";
import { Star, MapPin, Globe, Users, Briefcase, CheckCircle } from "lucide-react";
import Link from "next/link";
import Button from "@/components/ui/Button";

export default function BusinessProfilePage({ params }: { params: { id: string } }) {
  return (
    <div className="bg-[#FBFBFD] min-h-screen pb-32">
      <div className="bg-black text-white pt-32 pb-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=2070')] bg-cover bg-center opacity-30" />
        <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row items-center md:items-end gap-8">
          <div className="h-32 w-32 md:h-48 md:w-48 bg-white rounded-[2rem] shadow-2xl flex items-center justify-center shrink-0 overflow-hidden p-4">
             {/* Logo Placeholder */}
             <div className="w-full h-full bg-black/5 rounded-xl flex items-center justify-center">
               <span className="text-black font-black text-4xl">LA</span>
             </div>
          </div>
          <div className="flex-1 text-center md:text-left space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-[0.2em]">
              <CheckCircle size={14} className="text-green-400" /> Premium Verified Business
            </div>
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight">Lumina Apparel</h1>
            <p className="text-lg text-white/60 font-medium max-w-2xl">
              Sustainable, high-performance activewear born in Trivandrum. We partner with creators who share our vision for authentic movement.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col lg:flex-row gap-8">
        
        {/* Left Column: Stats & Trust Engine */}
        <div className="w-full lg:w-1/3 space-y-6">
          <div className="bg-white rounded-[2rem] p-8 border border-black/5">
            <h3 className="font-black uppercase tracking-tight mb-6">Business Reputation</h3>
            
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm font-bold mb-2">
                  <span>Trust Score</span>
                  <span>95/100</span>
                </div>
                <div className="w-full bg-black/5 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '95%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm font-bold mb-2">
                  <span>Payment Reliability</span>
                  <span>100%</span>
                </div>
                <div className="w-full bg-black/5 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '100%' }}></div>
                </div>
                <p className="text-[10px] text-black/40 font-medium mt-1">Never missed or delayed an escrow release.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-black/5">
              <div>
                <p className="text-2xl font-black">24</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-black/40 mt-1">Creators Hired</p>
              </div>
              <div>
                <p className="text-2xl font-black">12</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-black/40 mt-1">Active Projects</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Open Opportunities */}
        <div className="w-full lg:w-2/3 space-y-8">
          <h2 className="text-2xl font-black uppercase tracking-tight">Open Opportunities</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white p-8 rounded-[2rem] border border-black/5 hover:border-black/10 transition-colors">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 bg-blue-50 px-2 py-1 rounded-md mb-3 inline-block">Apparel Shoot</span>
                    <h3 className="text-xl font-black uppercase tracking-tight">Summer Lookbook</h3>
                    <p className="text-black/40 font-medium text-sm mt-1">Trivandrum • 3 Days</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black">$1,500</p>
                    <p className="text-[10px] text-black/40 font-bold uppercase tracking-widest">Budget</p>
                  </div>
                </div>
                <Button className="w-full h-12 rounded-xl bg-black text-white text-xs font-black uppercase tracking-[0.1em] hover:bg-[#E53935] transition-colors">
                  Apply Now
                </Button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
