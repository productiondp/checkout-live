"use client";
import React, { useState, useEffect, useMemo } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Plus, 
  MapPin, 
  CheckCircle2, 
  Sparkles, 
  Filter,
  Zap,
  Star
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { BusinessListing } from "@/types/directory";
import { ConnectButton } from "@/components/connection/ConnectButton";
import { createClient } from "@/utils/supabase/client";
import { DEFAULT_AVATAR } from "@/utils/constants";
import dynamic from "next/dynamic";
import TerminalLayout from "@/components/layout/TerminalLayout";

const PostModal = dynamic(() => import("@/components/modals/PostModal"), { ssr: false });

const CATEGORIES: string[] = [
  "Business Owner", "Professional", "Advisor", "Student"
];

export default function DirectoryPage() {
  return (
    <ProtectedRoute>
      <DirectoryContent />
    </ProtectedRoute>
  );
}

function DirectoryContent() {
  const [advisors, setAdvisors] = useState<BusinessListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | "All">("All");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function loadDirectory() {
      const supabase = createClient();
      try {
        const { data } = await supabase.from('profiles').select('*').limit(30);
        if (data) {
          const mapped: BusinessListing[] = data.map(p => ({
            id: p.id,
            name: p.full_name || "Anonymous Profile",
            logo: p.avatar_url || DEFAULT_AVATAR,
            category: p.role?.split('_').map((s: string) => s.charAt(0) + s.slice(1).toLowerCase()).join(' ') || "Professional",
            description: p.bio || "Professional in the network.",
            services: p.skills || [],
            location: p.city || p.location || "Regional Hub",
            matchScore: p.matchScore || Math.floor(Math.random() * 15) + 85,
            isVerified: true,
            expertise: p.skills || []
          }));
          setAdvisors(mapped);
        }
      } catch (err) { console.error(err); } finally { setLoading(false); }
    }
    loadDirectory();
  }, []);

  const filteredBusinesses = useMemo(() => advisors.filter(biz => {
    const matchesSearch = biz.name.toLowerCase().includes(searchQuery.toLowerCase()) || biz.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "All" || biz.category.toLowerCase() === activeCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  }), [advisors, searchQuery, activeCategory]);

  return (
    <TerminalLayout
      topbarChildren={
         <div className="flex items-center gap-6">
            <div className="flex p-1 bg-[#F5F5F7] rounded-2xl border border-black/[0.03]">
               <button onClick={() => setActiveCategory("All")} className={cn("px-6 h-9 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all", activeCategory === "All" ? "bg-white text-black shadow-sm" : "text-black/40 hover:text-black")}>All</button>
               {CATEGORIES.map(cat => (
                 <button key={cat} onClick={() => setActiveCategory(cat)} className={cn("px-6 h-9 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all", activeCategory === cat ? "bg-white text-black shadow-sm" : "text-black/40 hover:text-black")}>{cat}</button>
               ))}
            </div>
         </div>
      }
    >
      <div className="p-8 max-w-7xl mx-auto space-y-12">
         {/* SEARCH AREA */}
         <div className="relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-black/10 group-focus-within:text-[#E53935] transition-colors" size={20} />
            <input type="text" placeholder="Search business directory..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full h-16 bg-white border border-black/[0.03] rounded-2xl pl-16 pr-6 text-sm font-bold text-[#1D1D1F] outline-none focus:bg-white focus:border-[#E53935]/20 transition-all shadow-sm" />
         </div>

         {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
               {[1, 2].map(i => <div key={i} className="h-80 bg-[#F5F5F7] rounded-2xl animate-pulse" />)}
            </div>
         ) : filteredBusinesses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
               {filteredBusinesses.map((biz) => <UltimateBusinessCard key={biz.id} business={biz} />)}
            </div>
         ) : (
            <div className="py-40 text-center space-y-6">
               <div className="h-20 w-20 bg-[#F5F5F7] rounded-2xl mx-auto flex items-center justify-center text-black/10"><Zap size={32} /></div>
               <h3 className="text-xl font-black text-[#1D1D1F] uppercase font-outfit">No listings found</h3>
               <p className="text-black/20 text-[11px] font-black uppercase tracking-widest mt-2">Try different search terms.</p>
            </div>
         )}
      </div>

      {isCreateModalOpen && <PostModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onPostSuccess={() => { setIsCreateModalOpen(false); }} initialFormType="Lead" />}
    </TerminalLayout>
  );
}

function UltimateBusinessCard({ business }: { business: BusinessListing }) {
  const router = useRouter();
  return (
    <div onClick={() => router.push(`/directory/${business.id}`)} className="bg-white rounded-2xl p-10 border border-black/[0.03] shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 group cursor-pointer flex flex-col h-full">
       <div className="flex items-start justify-between mb-8">
          <div className="h-20 w-20 rounded-2xl bg-black flex items-center justify-center shadow-lg relative overflow-hidden shrink-0"><img src={business.logo} className="w-full h-full object-cover grayscale opacity-60 group-hover:opacity-100 group-hover:grayscale-0 transition-all duration-500" alt="" /></div>
          <div className="flex flex-col items-end gap-1.5">
             <span className="text-[8px] font-black uppercase text-black/20 tracking-widest">Match Accuracy</span>
             <div className="flex items-center gap-2">
                <div className="h-6 w-32 bg-[#F5F5F7] rounded-full border border-black/[0.03] overflow-hidden relative">
                   <motion.div 
                     initial={{ width: 0 }}
                     animate={{ width: `${business.matchScore}%` }}
                     transition={{ duration: 1, ease: "easeOut" }}
                     className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#E53935]/80 to-[#E53935] shadow-[0_0_15px_rgba(229,57,53,0.3)]"
                   />
                </div>
                <span className="text-[14px] font-black font-outfit text-[#E53935]">{business.matchScore}%</span>
             </div>
          </div>
       </div>
       <div className="flex-1 space-y-6">
          <div>
             <h3 className="text-xl font-black uppercase font-outfit group-hover:text-[#E53935] transition-colors leading-none mb-2">{business.name}</h3>
             <div className="flex items-center gap-2"><div className="flex items-center gap-1 text-yellow-500"><Star size={10} fill="currentColor" /><span className="text-[8px] font-black uppercase">4.9</span></div><span className="h-1 w-1 bg-black/5 rounded-full" /><p className="text-[9px] font-black text-black/20 uppercase tracking-widest">{business.category}</p></div>
          </div>
          <div className="flex items-center gap-2 text-black/20"><MapPin size={14} className="text-[#E53935]" /><span className="text-[9px] font-black uppercase tracking-widest">{business.location}</span></div>
          <p className="text-[13px] font-bold text-black/40 leading-relaxed italic uppercase line-clamp-3">"{business.description}"</p>
       </div>
       <div className="pt-8 border-t border-black/[0.03] flex items-center justify-between mt-auto"><div className="flex -space-x-3">{[1, 2, 3].map(i => <div key={i} className="h-10 w-10 rounded-2xl bg-[#F5F5F7] border-2 border-white shadow-sm overflow-hidden"><img src={`https://i.pravatar.cc/150?u=biz${i}${business.id}`} alt="" /></div>)}<div className="h-10 w-10 rounded-2xl bg-white border-2 border-black/[0.03] flex items-center justify-center text-[8px] font-black text-black/20">+12</div></div><ConnectButton userId={business.id} userName={business.name} label="Connect" /></div>
    </div>
  );
}


