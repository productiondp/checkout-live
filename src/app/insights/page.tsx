import React from "react";
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { 
  Sparkles, 
  Mic, 
  Zap, 
  Lightbulb, 
  ArrowRight,
  BookOpen,
  Play,
  TrendingUp,
  UserCheck
} from "lucide-react";
import Button from "@/components/ui/Button";
import LandingHeader from "@/components/layout/LandingHeader";

export const metadata: Metadata = {
  title: "Learn, Grow, and Stay Updated | Checkout Insights",
  description: "Read useful content, listen to podcasts, and learn from real experiences. Stay informed and grow every day.",
  keywords: ["local insights", "professional podcasts", "success stories", "learn locally", "checkout insights"],
  openGraph: {
    title: "Learn, Grow, and Stay Updated | Checkout Insights",
    description: "Read useful content, listen to podcasts, and learn from real experiences. Stay informed and grow every day.",
    images: [{ url: "/images/content_layer.png" }],
  }
};

export default function InsightsPage() {
  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#1D1D1F] font-sans selection:bg-[#E53935]/10 overflow-x-hidden">
      <LandingHeader />

      <main>
        {/* Hero Section */}
        <section className="pt-32 lg:pt-48 pb-16 px-6 text-center max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E53935]/5 text-[#E53935] text-[10px] font-black uppercase tracking-[0.2em] mb-8 border border-[#E53935]/10">
            <Lightbulb size={12} /> Insights
          </div>
          <h1 className="text-5xl md:text-7xl lg:text-9xl font-black tracking-tighter mb-8 leading-[0.9] text-black uppercase">
            Learn, Grow, and <br className="hidden md:block" /> <span className="text-[#E53935]">Stay Updated.</span>
          </h1>
          <p className="text-lg md:text-xl lg:text-2xl text-black/50 font-medium leading-tight max-w-3xl mx-auto">
            Get useful content that helps you grow. From success stories to industry news, stay informed with Checkout Insights.
          </p>
        </section>

        <div className="max-w-7xl mx-auto px-6 space-y-12 lg:space-y-16 pb-24 lg:pb-32">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { 
                icon: BookOpen, 
                title: "1. Informative Content", 
                desc: "Learn from real stories. Simple and useful content that helps you stay informed and grow every day." 
              },
              { 
                icon: Mic, 
                title: "2. Podcasts & Conversations", 
                desc: "Listen to experts and real people. Learn anytime, anywhere. Our podcasts focus on hyperlocal success." 
              },
              { 
                icon: UserCheck, 
                title: "3. Learn from Experts", 
                desc: "Get tips from advisors and experienced professionals in your field. No jargon, just real advice." 
              }
            ].map((item, i) => (
              <div key={i} className="p-10 rounded-2xl bg-[#FBFBFD] border border-black/[0.05] hover:bg-white hover:shadow-2xl transition-all duration-500">
                <div className="h-16 w-16 rounded-2xl bg-white text-[#E53935] flex items-center justify-center mb-8 shadow-sm">
                  <item.icon size={32} />
                </div>
                <h3 className="text-xl lg:text-2xl font-black mb-4 uppercase tracking-tight">{item.title}</h3>
                <p className="text-black/40 text-base font-medium leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          <section className="text-center py-20 lg:py-32">
             <Link href="/?mode=signup" className="w-full sm:w-auto">
                <Button className="h-16 lg:h-20 px-12 lg:px-16 rounded-2xl bg-black text-white text-[12px] font-black uppercase tracking-widest hover:bg-[#E53935] transition-all w-full sm:w-auto shadow-2xl">
                  Start Learning Now
                </Button>
             </Link>
          </section>
        </div>
      </main>

      <footer className="py-12 lg:py-20 px-6 border-t border-black/[0.05] text-center bg-[#FBFBFD]">
        <Image src="/logo.png" alt="Logo" width={100} height={25} className="opacity-40 grayscale mx-auto mb-6 h-5 w-auto" />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-black/20">© 2026 Checkout Systems. Stay informed.</p>
      </footer>
    </div>
  );
}
