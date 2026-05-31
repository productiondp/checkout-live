"use client";
import React, { useState, useEffect } from "react";
import { 
  ArrowLeft, 
  ShieldCheck, 
  Zap, 
  MapPin, 
  ArrowRight,
  Sparkles,
  Target,
  Lock,
  CheckCircle2,
  Info,
  Loader2,
  Calendar
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";
import TerminalLayout from "@/components/layout/TerminalLayout";
import { ConnectButton } from "@/components/connection/ConnectButton";
import { useAuth } from "@/hooks/useAuth";

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const listingId = params.id as string;
  const { user } = useAuth();
  const supabase = createClient();

  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchListing() {
      if (!listingId) return;
      setLoading(true);
      try {
        const { data } = await supabase
          .from("posts")
          .select(`
            *,
            author:profiles!posts_author_id_fkey(id, full_name, avatar_url, role, location, match_score, is_verified)
          `)
          .eq("id", listingId)
          .single();
        setListing(data);
      } catch (err) {
        console.error("Listing fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchListing();
  }, [listingId]);

  if (loading) {
    return (
      <TerminalLayout>
        <div className="flex items-center justify-center h-full p-20">
          <Loader2 size={40} className="animate-spin text-[#E53935]" />
        </div>
      </TerminalLayout>
    );
  }

  if (!listing) {
    return (
      <TerminalLayout>
        <div className="p-20 text-center space-y-6">
          <h3 className="text-xl font-black text-[#1D1D1F] uppercase font-outfit">Listing not found</h3>
          <button onClick={() => router.push('/marketplace')} className="h-12 px-8 bg-black text-white rounded-2xl text-[10px] font-black uppercase">Back to Marketplace</button>
        </div>
      </TerminalLayout>
    );
  }

  const tags = listing.tags || listing.metadata?.tags || [];
  const budget = listing.metadata?.budget || listing.budget;
  const timeline = listing.metadata?.timeline;
  const matchScore = listing.author?.match_score || 80;

  return (
    <TerminalLayout
      topbarChildren={
         <div className="flex items-center gap-6">
            <button 
               onClick={() => router.push('/marketplace')}
               className="h-10 px-4 bg-[#F5F5F7] text-black/40 rounded-2xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:text-black transition-all"
            >
               <ArrowLeft size={14} /> Back
            </button>
         </div>
      }
    >
      <div className="p-8 max-w-7xl mx-auto space-y-12">
        {/* HERO */}
        <div className="bg-black rounded-2xl p-12 text-white relative overflow-hidden shadow-2xl">
           <div className="absolute inset-0 bg-gradient-to-br from-black via-black to-[#E53935]/10 opacity-60" />
           <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-12">
              <div className="flex-1 space-y-10">
                 <div className="flex flex-wrap items-center gap-4">
                    <div className="px-4 py-1.5 bg-[#E53935] text-white text-[9px] font-black uppercase tracking-widest rounded-full flex items-center gap-2"><Zap size={14} />{listing.type || "REQUIREMENT"}</div>
                    {matchScore && <div className="px-4 py-1.5 bg-white/5 border border-white/10 text-white text-[9px] font-black uppercase tracking-widest rounded-full flex items-center gap-2"><Sparkles size={14} className="text-[#E53935]" />{matchScore}% Match</div>}
                 </div>
                 <h1 className="text-5xl lg:text-8xl font-black uppercase font-outfit leading-[0.8] tracking-tighter">{listing.title}</h1>
                 <div className="flex flex-wrap items-center gap-10">
                    <div className="flex items-center gap-4">
                       <div className="h-12 w-12 rounded-2xl overflow-hidden border border-white/10 shrink-0">
                         <img src={listing.author?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${listing.author?.full_name}`} className="h-full w-full object-cover grayscale" alt="" />
                       </div>
                       <div>
                         <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">Posted by</p>
                         <p className="text-xl font-black uppercase font-outfit">{listing.author?.full_name || "Network Member"}</p>
                       </div>
                    </div>
                    {listing.location && (
                      <>
                        <div className="h-10 w-px bg-white/10 hidden sm:block" />
                        <div>
                          <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">Location</p>
                          <p className="text-xl font-black uppercase font-outfit">{listing.location}</p>
                        </div>
                      </>
                    )}
                    {budget && (
                      <>
                        <div className="h-10 w-px bg-white/10 hidden sm:block" />
                        <div>
                          <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">Budget</p>
                          <p className="text-xl font-black uppercase font-outfit">₹{Number(budget).toLocaleString('en-IN')}</p>
                        </div>
                      </>
                    )}
               </div>
              </div>
              {listing.author?.id !== user?.id && (
                <div className="flex flex-col gap-3 min-w-[240px]">
                   <ConnectButton 
                      userId={listing.author?.id} 
                      userName={listing.author?.full_name}
                      label="Connect & Apply"
                      className="!h-20 !rounded-2xl !bg-white !text-black !font-black !text-xs !uppercase !tracking-widest !shadow-xl hover:!bg-[#E53935] hover:!text-white transition-all" 
                   />
                   <p className="text-center text-[8px] font-black text-white/20 uppercase tracking-[0.2em]">Verified Network Connection</p>
                </div>
              )}
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-12">
           <div className="space-y-12">
              <section>
                 <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-black/20 mb-8 flex items-center gap-2"><Info size={16} /> Details</h3>
                 <p className="text-3xl font-black text-black uppercase font-outfit leading-relaxed italic">"{listing.content}"</p>
              </section>
              {tags.length > 0 && (
                <section className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-12 border-t border-black/[0.03]">
                   <div>
                     <h4 className="text-[10px] font-black uppercase tracking-widest text-black/20 mb-8">Tags</h4>
                     <div className="flex flex-wrap gap-2">{tags.map((tag: string) => <span key={tag} className="px-4 py-2 bg-[#F5F5F7] text-black/40 rounded-2xl text-[10px] font-black uppercase tracking-widest">{tag}</span>)}</div>
                   </div>
                   <div>
                     <h4 className="text-[10px] font-black uppercase tracking-widest text-black/20 mb-8">Requirements</h4>
                     <div className="space-y-4">
                       {["Verified profile", "Connect to collaborate", "Respond within 24h"].map((req, i) => (
                         <div key={i} className="flex items-center gap-3 text-black/40 font-black uppercase text-[10px] tracking-widest"><CheckCircle2 size={16} className="text-emerald-500" />{req}</div>
                       ))}
                     </div>
                   </div>
                </section>
              )}
           </div>
           <aside className="space-y-10">
              <div className="bg-white p-10 rounded-2xl border border-black/[0.03] shadow-sm">
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-black/20 mb-10 flex items-center gap-2"><Target size={16} className="text-[#E53935]" /> Quick Info</h3>
                <div className="space-y-6">
                  {timeline && <div className="flex items-center justify-between py-3 border-b border-black/[0.03]"><span className="text-[9px] font-black text-black/20 uppercase tracking-widest flex items-center gap-2"><Calendar size={12} /> Timeline</span><span className="text-[11px] font-black text-black uppercase">{timeline}</span></div>}
                  <div className="flex items-center justify-between py-3 border-b border-black/[0.03]"><span className="text-[9px] font-black text-black/20 uppercase tracking-widest">Type</span><span className="text-[11px] font-black text-black uppercase">{listing.type}</span></div>
                  <div className="flex items-center justify-between py-3"><span className="text-[9px] font-black text-black/20 uppercase tracking-widest">Posted</span><span className="text-[11px] font-black text-black uppercase">{new Date(listing.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span></div>
                  {listing.author?.is_verified && (
                    <div className="flex items-center gap-2 pt-4">
                      <ShieldCheck size={16} className="text-emerald-500" />
                      <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Verified Member</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="p-10 bg-[#F5F5F7] rounded-2xl">
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-black/20 mb-8 flex items-center gap-2"><Lock size={16} className="text-[#E53935]" /> Network Rules</h3>
                <ul className="space-y-5">
                  {["Connect before messaging", "Verified members only", "Professional conduct required"].map((rule, i) => (
                    <li key={i} className="text-[9px] font-black text-black/20 uppercase tracking-widest flex items-center gap-3"><div className="h-1.5 w-1.5 rounded-full bg-[#E53935] shadow-[0_0_8px_rgba(229,57,53,0.4)]" />{rule}</li>
                  ))}
                </ul>
              </div>
           </aside>
        </div>
      </div>
    </TerminalLayout>
  );
}
