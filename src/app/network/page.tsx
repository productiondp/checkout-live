import React from "react";
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { 
  Users, 
  Zap, 
  ShieldCheck, 
  Target, 
  ArrowRight,
  BrainCircuit,
  Handshake
} from "lucide-react";
import Button from "@/components/ui/Button";
import LandingHeader from "@/components/layout/LandingHeader";

export const metadata: Metadata = {
  title: "Build Strong Local Connections | Checkout Network",
  description: "Connect with students, professionals, and business owners near you. Build real relationships that create growth.",
  keywords: ["local networking", "business connections", "student networking", "hyperlocal community", "checkout network"],
  openGraph: {
    title: "Build Strong Local Connections | Checkout Network",
    description: "Connect with students, professionals, and business owners near you. Build real relationships that create growth.",
    images: [{ url: "/images/collaboration.png" }],
  }
};

export default function NetworkPage() {
  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#1D1D1F] font-sans selection:bg-[#E53935]/10 overflow-x-hidden">
      <LandingHeader />

      <main>
        {/* Hero Section */}
        <section className="pt-32 lg:pt-48 pb-16 px-6 text-center max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E53935]/5 text-[#E53935] text-[10px] font-black uppercase tracking-[0.2em] mb-8 border border-[#E53935]/10">
            <Users size={12} /> The Network
          </div>
          <h1 className="text-5xl md:text-7xl lg:text-9xl font-black tracking-tighter mb-8 leading-[0.9] text-black uppercase">
            Connect with the <br className="hidden md:block" /> <span className="text-[#E53935]">Right People.</span>
          </h1>
          <p className="text-lg md:text-xl lg:text-2xl text-black/50 font-medium leading-tight max-w-3xl mx-auto">
            Build your professional network right where you live. Checkout connects students, business owners, and professionals in one secure space.
          </p>
        </section>

        <div className="max-w-7xl mx-auto px-6 space-y-12 lg:space-y-16 pb-24 lg:pb-32">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              { 
                icon: Handshake, 
                title: "1. Connect with the Right People", 
                desc: "Whether you are a student, professional, or business owner, we help you find people who match your goals." 
              },
              { 
                icon: BrainCircuit, 
                title: "2. Intent-based Networking", 
                desc: "Our AI matches you based on your intent. You see only relevant profiles that align with your immediate needs." 
              },
              { 
                icon: ShieldCheck, 
                title: "3. Verified Profiles & Trust", 
                desc: "Build relationships with real people. Every profile is verified to maintain a safe and professional environment." 
              },
              { 
                icon: Target, 
                title: "4. Industry Specific", 
                desc: "Network within your specific field. Find mentors, partners, or talent in your industry." 
              }
            ].map((item, i) => (
              <div key={i} className="bg-[#FBFBFD] p-10 rounded-2xl border border-black/[0.05] hover:shadow-2xl hover:bg-white transition-all duration-500 group">
                <div className="h-16 w-16 rounded-2xl bg-white text-[#E53935] flex items-center justify-center mb-8 shadow-sm group-hover:bg-[#E53935] group-hover:text-white transition-colors">
                  <item.icon size={32} />
                </div>
                <h3 className="text-xl lg:text-2xl font-black mb-4 uppercase tracking-tight">{item.title}</h3>
                <p className="text-black/40 text-base font-medium leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          <section className="text-center py-20 lg:py-32 space-y-10">
            <h2 className="text-4xl lg:text-6xl font-black tracking-tighter uppercase">Ready to grow?</h2>
            <Link href="/?mode=signup" className="w-full sm:w-auto">
              <Button className="h-16 lg:h-20 px-12 lg:px-16 rounded-2xl bg-black text-white text-[12px] font-black uppercase tracking-widest hover:bg-[#E53935] transition-all w-full sm:w-auto shadow-2xl">
                Start Connecting Now
              </Button>
            </Link>
          </section>
        </div>
      </main>

      <footer className="py-12 lg:py-20 px-6 border-t border-black/[0.05] text-center bg-[#FBFBFD]">
        <Image src="/logo.png" alt="Logo" width={100} height={25} className="opacity-40 grayscale mx-auto mb-6 h-5 w-auto" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black/20">© 2026 Checkout Systems. Your local growth partner.</p>
      </footer>
    </div>
  );
}
