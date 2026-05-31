"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  ArrowRight, 
  MapPin, 
  User,
  Users, 
  Zap, 
  BrainCircuit, 
  Mic, 
  Target, 
  Sparkles,
  ShieldCheck,
  Compass,
  GraduationCap,
  Briefcase,
  Store,
  Hammer,
  CheckCircle2,
  TrendingUp,
  Globe,
  Layers,
  Cpu,
  MousePointer2,
  Lock,
  Search,
  MessageSquare,
  Radio
} from "lucide-react";
import Button from "@/components/ui/Button";
import LandingHeader from "@/components/layout/LandingHeader";

export default function WhatIsCheckout() {
  return (
    <div className="relative bg-[#FFFFFF] text-[#1D1D1F] font-sans selection:bg-[#E53935]/10 overflow-x-hidden min-h-screen">
      <LandingHeader />

      {/* 1. HERO - CORE CONCEPT */}
      <section className="relative pt-32 lg:pt-48 pb-20 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col items-center text-center space-y-8 lg:space-y-12">
            <div className="inline-flex items-center gap-3 px-5 py-2 rounded-2xl bg-red-50 border border-red-100 shadow-sm">
               <Sparkles size={16} className="text-[#E53935]" />
               <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#E53935]">The Core Concept</span>
            </div>

            <div className="max-w-4xl space-y-6">
              <h1 className="text-5xl md:text-7xl lg:text-9xl font-black tracking-tighter leading-[0.9] text-black uppercase">
                Hyperlocal <br /> Opportunity <span className="text-[#E53935]">Engine.</span>
              </h1>
              <p className="text-xl md:text-2xl lg:text-3xl text-black/50 font-medium leading-tight max-w-3xl mx-auto">
                Checkout connects people, skills, and businesses within a specific area.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 lg:gap-6 pt-6">
               <Link href="/?mode=signup" className="w-full sm:w-auto">
                  <Button className="h-16 lg:h-20 px-12 lg:px-16 rounded-2xl lg:rounded-3xl bg-[#E53935] text-white text-[12px] font-black uppercase tracking-[0.2em] hover:bg-black transition-all duration-500 shadow-xl shadow-red-200">
                    Join Checkout
                  </Button>
               </Link>
               <button 
                 onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
                 className="h-16 lg:h-20 px-10 rounded-2xl lg:rounded-3xl border-2 border-black/5 flex items-center justify-center text-[11px] font-black uppercase tracking-[0.2em] hover:bg-black/5 transition-all w-full sm:w-auto"
               >
                 Learn How It Works
               </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. HOW IT WORKS */}
      <section className="py-24 lg:py-40 px-6 bg-[#FBFBFD] border-y border-black/[0.05]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 lg:mb-24 space-y-4">
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tighter uppercase">It works on</h2>
            <div className="h-1 w-20 bg-[#E53935] mx-auto" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: BrainCircuit, title: "Intent-based AI matching", desc: "Our engine detects exactly what you need and matches you with the right solution instantly." },
              { icon: Briefcase, title: "Industry-specific onboarding", desc: "A tailored entry process designed for your specific profession or business goals." },
              { icon: Search, title: "Hyperlocal discovery", desc: "Find everything within your immediate vicinity, focusing on real-world proximity." },
              { icon: Lock, title: "No public noise", desc: "We eliminate the clutter. You only see connections that are relevant to your intent." }
            ].map((item, i) => (
              <div key={i} className="bg-white p-8 lg:p-10 rounded-2xl border border-black/[0.05] shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-500 group">
                <div className="h-14 w-14 rounded-2xl bg-red-50 text-[#E53935] flex items-center justify-center mb-8 group-hover:bg-[#E53935] group-hover:text-white transition-colors">
                  <item.icon size={28} />
                </div>
                <h3 className="text-xl lg:text-2xl font-black mb-4 tracking-tight leading-tight uppercase">{item.title}</h3>
                <p className="text-black/40 font-medium leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. WHO IT SERVES */}
      <section className="py-24 lg:py-40 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-32 items-center">
            <div className="space-y-10 lg:space-y-16">
              <div className="space-y-6">
                <h2 className="text-4xl md:text-6xl lg:text-8xl font-black tracking-tighter leading-none uppercase">
                  It serves <br /> <span className="text-[#E53935]">The Community.</span>
                </h2>
                <p className="text-xl text-black/40 font-medium">Empowering every individual and entity in the local economy.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[
                  { icon: GraduationCap, title: "Students", desc: "Unlock campus opportunities and skill-based growth." },
                  { icon: Store, title: "SMB Owners", desc: "Scale local operations with verified talent." },
                  { icon: User, title: "Professionals", desc: "High-value networking and career progression." },
                  { icon: Hammer, title: "Daily Wage Workers", desc: "Immediate access to local work and projects." }
                ].map((target, i) => (
                  <div key={i} className="flex gap-5 items-start p-6 rounded-2xl border border-black/[0.03] hover:bg-red-50/50 transition-colors">
                    <div className="h-10 w-10 rounded-xl bg-black text-white flex items-center justify-center shrink-0">
                      <target.icon size={20} />
                    </div>
                    <div>
                      <h4 className="text-lg font-black tracking-tight uppercase">{target.title}</h4>
                      <p className="text-sm text-black/40 font-medium leading-snug">{target.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 shadow-2xl group">
               <Image src="/images/collaboration.png" alt="Checkout Community" fill className="object-cover group-hover:scale-105 transition-transform duration-1000" />
               <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
               <div className="absolute bottom-10 left-10 text-white">
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] mb-2 opacity-60">Impact</p>
                  <h4 className="text-3xl font-black uppercase tracking-tight">Real Connections. <br /> Real Growth.</h4>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. ADDITIONAL FEATURES */}
      <section className="py-24 lg:py-40 px-6 bg-black text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
           <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_20%,#E53935/0.2,transparent_50%)]" />
           <div className="absolute bottom-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_80%,#3b82f6/0.1,transparent_50%)]" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16 lg:mb-24 space-y-4">
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tighter uppercase italic">It also includes</h2>
            <p className="text-white/40 font-medium">Expanding the boundaries of local interaction.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-16">
            {[
              { icon: Radio, title: "Content storytelling", subtitle: "feeds, podcasts", desc: "Immersive local narratives that bring your community's journey to life." },
              { icon: ShieldCheck, title: "Advisor system", subtitle: "Expert guidance", desc: "Connect with verified mentors who help you navigate local opportunities." },
              { icon: Users, title: "Meetup system", subtitle: "Real-world events", desc: "Transition from digital intent to physical presence through curated gatherings." }
            ].map((feature, i) => (
              <div key={i} className="text-center space-y-6 group">
                <div className="h-20 w-20 lg:h-24 lg:w-24 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto group-hover:bg-[#E53935] group-hover:border-[#E53935] transition-all duration-500 group-hover:scale-110">
                  <feature.icon size={36} className="text-white" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-black tracking-tight uppercase italic">{feature.title}</h3>
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#E53935]">{feature.subtitle}</p>
                  <p className="text-white/40 text-base leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. THE GOAL - CTA */}
      <section className="py-24 lg:py-48 px-6 text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto space-y-12 lg:space-y-20">
          <div className="space-y-6">
            <div className="h-16 w-16 lg:h-24 lg:w-24 rounded-3xl bg-white shadow-2xl border border-black/[0.03] mx-auto flex items-center justify-center text-[#E53935]">
               <MousePointer2 size={32} className="animate-bounce" />
            </div>
            <h2 className="text-5xl md:text-7xl lg:text-9xl font-black tracking-tighter leading-[0.9] uppercase italic">
              Needs <span className="text-[#E53935]">↔</span> Solutions.
            </h2>
            <p className="text-2xl lg:text-3xl text-black/40 font-medium max-w-2xl mx-auto leading-tight">
              Our goal: Create real opportunities where both sides benefit.
            </p>
          </div>

          <Link href="/?mode=signup" className="inline-block w-full sm:w-auto">
            <Button className="h-16 lg:h-24 px-12 lg:px-20 rounded-2xl lg:rounded-2xl bg-black text-white text-[12px] lg:text-[14px] font-black uppercase tracking-[0.3em] hover:bg-[#E53935] transition-all duration-500 shadow-2xl shadow-black/20 w-full sm:w-auto">
               Get Started Today
            </Button>
          </Link>
        </div>
      </section>

      <footer className="py-12 lg:py-20 px-6 border-t border-black/[0.05] bg-[#FBFBFD]">
         <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 lg:gap-10">
            <div className="flex flex-col sm:flex-row items-center gap-4 lg:gap-6">
               <Image src="/logo.png" alt="Checkout" width={120} height={30} className="opacity-40 h-6 w-auto grayscale" />
               <div className="hidden sm:block h-4 w-px bg-black/10" />
               <span className="text-[10px] font-black uppercase tracking-[0.4em] text-black/20">Hyperlocal OS</span>
            </div>
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-black/20 text-center md:text-right">
               © 2026 Checkout Systems. Operating at the Hyperlocal Edge.
            </div>
         </div>
      </footer>
    </div>
  );
}
