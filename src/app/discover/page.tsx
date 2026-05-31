import React from "react";
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { 
  MapPin, 
  Users, 
  Calendar, 
  Search, 
  ArrowRight,
  Sparkles,
  Compass,
  ChevronRight
} from "lucide-react";
import Button from "@/components/ui/Button";
import LandingHeader from "@/components/layout/LandingHeader";

export const metadata: Metadata = {
  title: "Discover Local Opportunities Near You | Checkout",
  description: "Find events, people, and activities near you. Checkout helps you discover real opportunities in your local area.",
  keywords: ["local discovery", "events near me", "hyperlocal opportunities", "checkout app", "local networking"],
  openGraph: {
    title: "Discover Local Opportunities Near You | Checkout",
    description: "Find events, people, and activities near you. Checkout helps you discover real opportunities in your local area.",
    images: [{ url: "/images/hero_bg.png" }],
  }
};

export default function DiscoverPage() {
  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#1D1D1F] font-sans selection:bg-[#E53935]/10 overflow-x-hidden">
      <LandingHeader />

      <main>
        {/* Hero Section */}
        <section className="relative pt-32 lg:pt-48 pb-16 lg:pb-24 px-6 overflow-hidden">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="space-y-8 lg:space-y-10 order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E53935]/5 text-[#E53935] text-[10px] font-black uppercase tracking-[0.2em] border border-[#E53935]/10">
                <Compass size={12} /> Discovery
              </div>
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.95] text-black uppercase">
                Discover What's <br className="hidden md:block" /> <span className="text-[#E53935]">Happening Near You.</span>
              </h1>
              <p className="text-lg md:text-xl lg:text-2xl text-black/40 font-medium leading-tight max-w-xl">
                Checkout is a hyperlocal app. It helps you find real-world opportunities in your neighborhood. No algorithms. Just real human intent.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                 <Link href="/?mode=signup" className="w-full sm:w-auto">
                    <Button className="h-14 lg:h-16 px-10 rounded-xl lg:rounded-2xl bg-[#E53935] text-white text-[11px] font-black uppercase tracking-[0.2em] hover:bg-black transition-all shadow-xl shadow-red-100 w-full sm:w-auto">
                       Start Exploring <ArrowRight className="ml-2" size={16} />
                    </Button>
                 </Link>
              </div>
            </div>
            
            <div className="relative aspect-square order-1 lg:order-2">
               <div className="absolute inset-0 bg-white rounded-2xl shadow-2xl border border-black/[0.03] p-4">
                  <div className="relative w-full h-full rounded-2xl overflow-hidden">
                     <Image src="/images/map_engine.png" alt="Map Discovery" fill className="object-cover" />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  </div>
               </div>
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-6 space-y-24 lg:space-y-32 pb-24 lg:pb-40">
          <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { 
                icon: Calendar, 
                title: "1. Find Events & Meetups", 
                desc: "See what is happening right now. From professional meetups to local workshops. Stay connected with your community." 
              },
              { 
                icon: Users, 
                title: "2. Discover Local People", 
                desc: "Find people with the skills you need. Or connect with neighbors who share your interests." 
              },
              { 
                icon: MapPin, 
                title: "3. Business & Activities", 
                desc: "Find local businesses, grand openings, and community projects. Support local growth." 
              }
            ].map((item, i) => (
              <div key={i} className="p-10 rounded-2xl bg-white border border-black/[0.05] shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-500">
                <div className="h-14 w-14 rounded-2xl bg-[#E53935]/5 text-[#E53935] flex items-center justify-center mb-8">
                  <item.icon size={28} />
                </div>
                <h3 className="text-xl lg:text-2xl font-black mb-4 uppercase tracking-tight">{item.title}</h3>
                <p className="text-black/40 text-base font-medium leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </section>
        </div>
      </main>

      <footer className="py-12 lg:py-20 px-6 border-t border-black/[0.05] text-center bg-[#FBFBFD]">
        <Image src="/logo.png" alt="Logo" width={100} height={25} className="opacity-40 grayscale mx-auto mb-6 h-5 w-auto" />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-black/20">Hyperlocal Intelligence · Since 2026</p>
      </footer>
    </div>
  );
}
