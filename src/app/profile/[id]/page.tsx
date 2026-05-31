"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { motion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import { 
  User, 
  Mail, 
  Phone, 
  Building, 
  MapPin, 
  Globe, 
  CreditCard, 
  ChevronRight, 
  LogOut, 
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  LayoutGrid,
  Settings,
  Briefcase,
  Target,
  Zap,
  Activity,
  Award,
  Plus,
  Play,
  FileText,
  Image as ImageIcon,
  Compass,
  Layout,
  BookOpen,
  Sparkles,
  Users,
  ShoppingBag
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";

import TerminalLayout from "@/components/layout/TerminalLayout";
import ConnectButton from "@/components/ui/ConnectButton";

export default function DynamicProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}

function ProfileContent() {
  const params = useParams();
  const router = useRouter();
  const { user: authUser } = useAuth();
  const profileId = params.id as string;
  const [profile, setProfile] = useState<any>(null);
  const [creatorData, setCreatorData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();
  const [dependencyList, setDependencyList] = useState<any[]>([]);

  React.useEffect(() => {
    async function fetchProfile() {
      setIsLoading(true);
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .single();
      
      if (data) {
        setProfile({
          ...data,
          name: data.full_name || "Expert",
          avatar: data.avatar_url || `https://i.pravatar.cc/150?u=${data.id}`,
          role: data.role || "Professional",
          company: data.location || "Global",
          city: data.location || "Virtual",
          match: data.match_score || 95,
          primaryIntent: data.primaryIntent || "Growth & Scaling"
        });

        if (data.role?.toUpperCase() === "CREATOR") {
          const { data: creatorData } = await supabase
            .from("creator_profiles")
            .select("*")
            .eq("id", profileId)
            .maybeSingle();
            
          const local = localStorage.getItem(`creator_profile_${profileId}`);
          const localData = local ? JSON.parse(local) : {};
          
          if (creatorData) {
            setCreatorData({ ...creatorData, ...localData });
          } else if (localData) {
            setCreatorData(localData);
          }
        }
      }

      const { data: posts } = await supabase
        .from('posts')
        .select('*')
        .eq('author_id', profileId)
        .order('created_at', { ascending: false });

      if (posts) {
        setDependencyList(posts.map((p: any) => ({
          id: p.id,
          content: p.content,
          type: p.type === "LEAD" ? "Hiring" : p.type === "PARTNERSHIP" ? "Partnership" : p.type === "MEETUP" ? "Meetup" : "General",
          priority: "High",
          status: p.status || "Active"
        })));
      }

      setIsLoading(false);
    }
    if (profileId) fetchProfile();
  }, [profileId]);

  const [activeTab, setActiveTab] = useState("Overview");

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-white text-black">Loading Profile...</div>;
  if (!profile) return <div className="min-h-screen flex items-center justify-center bg-white text-black">Profile Not Found</div>;

  const performanceMetrics = [
    { label: "Network Reliability", value: profile.match + 2, color: "bg-emerald-500", icon: ShieldCheck },
    { label: "Strategic Match", value: profile.match, color: "bg-[#E53935]", icon: Target },
    { label: "Market Authority", value: 92, color: "bg-black", icon: Award },
    { label: "Activity Level", value: 76, color: "bg-red-600", icon: Activity },
  ];

  const contactInfo = [
    { label: "Email", value: profile.email || "No email listed", icon: Mail },
    { label: "Phone", value: profile.phone || "No phone listed", icon: Phone },
    { label: "Website", value: profile.website || "No website listed", icon: Globe, link: !!profile.website },
  ];

  return (
    <TerminalLayout>
      <div className="bg-white font-sans selection:bg-[#E53935]/10 pb-40">
        
        {/* PROFILE HEADER */}
        <div className="relative h-[380px] w-full overflow-hidden bg-black shadow-2xl">
           <div className="absolute inset-0 bg-gradient-to-br from-black via-black to-[#E53935]/20 opacity-80" />
           <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2000')] bg-cover bg-center mix-blend-overlay opacity-30 grayscale" />
           
           <div className="max-w-7xl mx-auto px-10 h-full flex items-center relative z-10">
              <div className="flex flex-col md:flex-row items-center gap-12 w-full pt-10">
                 <div className="relative shrink-0">
                    <div className="h-44 w-44 lg:h-48 lg:w-48 rounded-2xl bg-white p-3 shadow-4xl relative z-10 overflow-hidden border border-white/20">
                       <img src={profile.avatar} className="w-full h-full object-cover rounded-2xl" alt="Profile" />
                    </div>
                    <div className="absolute -bottom-2 -right-2 h-10 w-10 bg-[#E53935] border-4 border-white rounded-lg flex items-center justify-center text-white shadow-2xl z-20">
                       <CheckCircle2 size={20} />
                    </div>
                 </div>

                 <div className="text-center md:text-left flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-4">
                       <h1 className="text-4xl lg:text-5xl font-black text-white leading-none uppercase font-outfit">{profile.name}</h1>
                       <div className="px-4 py-1.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-[9px] font-black uppercase text-white tracking-widest">
                          Verified Partner
                       </div>
                    </div>
                    <div className="flex flex-wrap justify-center md:justify-start gap-8 text-white/40 text-[10px] font-black uppercase tracking-widest">
                       <span className="flex items-center gap-2"><Building size={14} className="text-[#E53935]" /> {profile.role}</span>
                       <span className="flex items-center gap-2"><Globe size={14} className="text-[#E53935]" /> {profile.company}</span>
                       <span className="flex items-center gap-2"><MapPin size={14} className="text-[#E53935]" /> {profile.city}</span>
                    </div>
                 </div>

                 <div className="flex items-center gap-4">
                    {authUser?.id === profileId ? (
                       <button 
                          onClick={() => router.push('/profile')} 
                          className="h-16 px-10 bg-black text-white rounded-2xl font-black text-[11px] uppercase shadow-2xl hover:bg-[#E53935] transition-all active:scale-95 flex items-center gap-3"
                       >
                          <Settings size={18} />
                          Edit Profile
                       </button>
                    ) : (
                       <ConnectButton 
                          targetId={profileId} 
                          className="h-16 px-10 rounded-2xl text-[11px] font-black uppercase"
                       />
                    )}
                    <button className="h-16 w-16 bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl flex items-center justify-center text-white hover:bg-white hover:text-black transition-all">
                       <Plus size={24} />
                    </button>
                 </div>
              </div>
           </div>
        </div>

        {/* MAIN CONTENT ARCHITECTURE */}
        <div className="max-w-7xl mx-auto px-10 py-16 relative z-20">
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              
              {/* CONTENT SIDEBAR (LEFT) */}
              <div className="lg:col-span-4 space-y-12">
                 
                 <div className="bg-white rounded-2xl p-10 shadow-sm border border-black/[0.03]">
                    <h3 className="text-[10px] font-black text-black/20 uppercase mb-8 flex items-center gap-2 tracking-[0.2em]">
                       <div className="h-1 w-4 bg-[#E53935] rounded-full" />
                       About
                    </h3>
                    <p className="text-lg text-black font-bold leading-relaxed uppercase italic opacity-60">
                       "{profile.bio || `${profile.name} is a high-trust partner focused on strategic growth and collaboration.`}"
                    </p>
                    
                    <div className="mt-10 pt-10 border-t border-black/[0.03] space-y-8">
                       {contactInfo.map((info, i) => (
                          <div key={i} className="flex items-center gap-4 group cursor-pointer">
                             <div className="h-12 w-12 bg-black/[0.03] rounded-2xl flex items-center justify-center text-black/20 group-hover:bg-[#E53935] group-hover:text-white transition-all">
                                <info.icon size={18} />
                             </div>
                             <div className="flex-1 min-w-0">
                                <p className="text-[9px] font-black text-black/20 uppercase leading-none mb-2 tracking-widest">{info.label}</p>
                                <p className={cn(
                                   "text-[14px] font-bold uppercase truncate",
                                   info.link ? "text-[#E53935]" : "text-black"
                                 )}>{info.value}</p>
                             </div>
                          </div>
                       ))}
                    </div>
                 </div>

                 {/* RANK CARD */}
                 <div className="bg-black rounded-2xl p-10 shadow-2xl relative overflow-hidden group border border-black">
                    <div className="absolute -bottom-10 -right-10 p-8 text-white opacity-5 group-hover:opacity-10 transition-opacity rotate-12">
                       <TrendingUp size={240} />
                    </div>
                    
                    <div className="relative z-10">
                       <div className="flex items-center gap-4 mb-10">
                          <div className="h-14 w-14 bg-[#E53935] rounded-2xl flex items-center justify-center text-white shadow-xl">
                             <Zap size={28} />
                          </div>
                          <div>
                             <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Analytics</p>
                             <h4 className="text-xl font-black text-white uppercase font-outfit">Platform Rank</h4>
                          </div>
                       </div>

                       <div className="grid grid-cols-2 gap-4 mb-10 text-center">
                          <div className="bg-white/5 p-5 rounded-2xl border border-white/5">
                             <p className="text-[9px] font-black text-white/30 uppercase mb-2 tracking-widest">Global</p>
                             <p className="text-2xl font-black text-white font-outfit">#{100 + (profile.id?.length || 0)}</p>
                          </div>
                          <div className="bg-white/5 p-5 rounded-2xl border border-white/5">
                             <p className="text-[9px] font-black text-white/30 uppercase mb-2 tracking-widest">Network</p>
                             <p className="text-2xl font-black text-[#E53935] font-outfit">TOP 1%</p>
                          </div>
                       </div>

                       <div className="space-y-6">
                          <p className="text-[10px] font-bold text-white/40 uppercase flex items-center gap-2 mb-2 tracking-[0.2em]">
                             Performance Indicators
                          </p>
                          {performanceMetrics.map((param, i) => (
                             <motion.div 
                                key={i} 
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="space-y-2"
                             >
                                <div className="flex justify-between text-[10px] font-semibold text-white/30 uppercase tracking-widest">
                                   <span>{param.label}</span>
                                   <span className="text-white">{param.value}%</span>
                                </div>
                                <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                                   <motion.div 
                                      initial={{ width: 0 }}
                                      animate={{ width: `${param.value}%` }}
                                      transition={{ duration: 1.5, delay: i * 0.2, ease: [0.22, 1, 0.36, 1] }}
                                      className={cn("h-full rounded-full transition-all", param.color.replace('bg-', 'bg-opacity-80 bg-'))} 
                                      style={{ backgroundColor: param.color.includes('#') ? param.color : undefined }}
                                   />
                                </div>
                             </motion.div>
                          ))}
                       </div>
                    </div>
                 </div>

              </div>

              {/* MAIN DATA FEED (RIGHT) */}
              <div className="lg:col-span-8 space-y-12">
                 
                 <div className="flex items-center gap-12 border-b border-black/[0.03] pb-1 overflow-x-auto no-scrollbar">
                    {["Overview", "History", "Collaboration", "Reviews"].map(tab => (
                      <button 
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={cn(
                          "pb-4 text-[10px] font-black uppercase tracking-widest transition-all relative",
                          activeTab === tab ? "text-[#E53935]" : "text-black/30 hover:text-black"
                        )}
                      >
                        {tab}
                        {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#E53935] rounded-full" />}
                      </button>
                    ))}
                 </div>

                 {/* OVERVIEW TAB CONTENT */}
                 {activeTab === "Overview" && (
                   <div className="space-y-8">
                     {creatorData ? (
                       /* CREATOR PORTFOLIO VIEW */
                       <div className="space-y-8">
                         {/* Specialties */}
                         {creatorData.specialties && creatorData.specialties.length > 0 && (
                           <div className="bg-white rounded-3xl p-10 border border-slate-100 shadow-sm relative overflow-hidden">
                             <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                               <Award size={16} className="text-[#E53935]" /> Creator Specialties
                             </h3>
                             <div className="flex flex-wrap gap-2">
                               {creatorData.specialties.map((s: string) => (
                                 <span key={s} className="px-4 py-2 bg-black/5 text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#E53935] hover:text-white transition-all">
                                   {s}
                                 </span>
                               ))}
                             </div>
                           </div>
                         )}

                         {/* Portfolio Images */}
                         {creatorData.portfolio_images && creatorData.portfolio_images.length > 0 && (
                           <div className="bg-white rounded-3xl p-10 border border-slate-100 shadow-sm">
                             <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                               <ImageIcon size={16} className="text-[#E53935]" /> Portfolio Highlights
                             </h3>
                             <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                               {creatorData.portfolio_images.map((img: string, i: number) => (
                                 <div key={i} className="aspect-[4/5] rounded-2xl overflow-hidden bg-slate-100 group relative">
                                   <img src={img} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                   <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                                 </div>
                               ))}
                             </div>
                           </div>
                         )}

                         {/* Video Links */}
                         {creatorData.video_links && creatorData.video_links.length > 0 && (
                           <div className="bg-white rounded-3xl p-10 border border-slate-100 shadow-sm">
                             <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                               <Play size={16} className="text-[#E53935]" /> Featured Content
                             </h3>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               {creatorData.video_links.map((link: string, i: number) => {
                                  const ytMatch = link.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
                                  const thumb = ytMatch ? `https://img.youtube.com/vi/${ytMatch[1]}/mqdefault.jpg` : null;
                                  return (
                                    <a key={i} href={link} target="_blank" rel="noopener noreferrer" className="group relative aspect-video rounded-2xl overflow-hidden bg-black flex items-center justify-center">
                                      {thumb ? (
                                        <img src={thumb} alt="" className="w-full h-full object-cover opacity-50 group-hover:opacity-30 transition-opacity" />
                                      ) : (
                                        <div className="absolute inset-0 bg-gradient-to-br from-black to-slate-900" />
                                      )}
                                      <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white group-hover:scale-110 group-hover:bg-[#E53935] transition-all">
                                          <Play size={20} className="ml-1" fill="currentColor" />
                                        </div>
                                      </div>
                                    </a>
                                  );
                               })}
                             </div>
                           </div>
                         )}

                         {/* Rate Card */}
                         {creatorData.rate_card && (
                           <div className="bg-white rounded-3xl p-10 border border-slate-100 shadow-sm">
                             <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                               <FileText size={16} className="text-[#E53935]" /> Standard Rates
                             </h3>
                             <p className="text-sm font-medium text-slate-700 leading-relaxed whitespace-pre-line">{creatorData.rate_card}</p>
                           </div>
                         )}
                       </div>
                     ) : (
                       /* DEFAULT B2B VIEW (Strategic Roadmap) */
                       <>
                         {/* Network Intent */}
                         <div className="bg-white rounded-3xl p-10 border border-slate-100 shadow-sm relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#E53935]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                            <div className="flex items-center justify-between mb-8">
                               <div>
                                  <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                                     <Target size={16} className="text-[#E53935]" /> Core Network Mission
                                  </h3>
                                  <p className="text-xl font-bold text-[#1D1D1F]">{profile.primaryIntent}</p>
                               </div>
                            </div>
                            <p className="text-[13px] text-slate-400 font-medium leading-relaxed">
                               This partner's primary intent defines their strategic feed. Advisors and opportunities are prioritized based on this mission.
                            </p>
                         </div>

                         {/* Strategic Roadmap List */}
                         <div className="bg-white rounded-3xl p-10 border border-slate-100 shadow-sm relative overflow-hidden">
                            <div className="flex items-center justify-between mb-10 pb-6 border-b border-slate-50">
                               <div>
                                  <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                     <Activity size={16} className="text-[#E53935]" /> Strategic Roadmap
                                  </h3>
                               </div>
                            </div>

                            <div className="space-y-5">
                               {dependencyList.length > 0 ? dependencyList.map(dep => (
                                  <div key={dep.id} className="p-8 bg-slate-50/50 border border-slate-50 rounded-3xl flex items-center justify-between group hover:bg-white hover:shadow-xl hover:border-[#E53935]/20 transition-all duration-500">
                                     <div className="flex items-center gap-6">
                                        <div className="h-14 w-14 bg-white rounded-2xl flex items-center justify-center text-slate-400 shadow-sm border border-slate-100 group-hover:bg-[#E53935] group-hover:text-white transition-all duration-500">
                                           {dep.type === "Hiring" && <Briefcase size={22} />}
                                           {dep.type === "Partnership" && <Users size={22} />}
                                           {dep.type === "Investment" && <TrendingUp size={22} />}
                                           {dep.type === "Technology" && <Database size={22} />}
                                           {dep.type === "Procurement" && <ShoppingBag size={22} />}
                                        </div>
                                        <div>
                                           <div className="flex items-center gap-3 mb-2">
                                              <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[8px] font-bold uppercase rounded-2xl tracking-widest">{dep.type}</span>
                                              <h4 className="text-[14px] font-bold text-[#1D1D1F] line-clamp-1">{dep.content}</h4>
                                           </div>
                                           <p className="text-[11px] font-medium text-slate-400">Active Priority</p>
                                        </div>
                                     </div>
                                  </div>
                               )) : (
                                  <div className="py-20 text-center opacity-30">
                                     <Sparkles size={40} className="mx-auto mb-4 text-[#1D1D1F]" />
                                     <p className="text-[11px] font-bold text-[#1D1D1F] uppercase tracking-widest italic">No active strategic objectives</p>
                                  </div>
                               )}
                            </div>
                         </div>
                       </>
                     )}
                   </div>
                 )}

              </div>

           </div>
        </div>
      </div>
    </TerminalLayout>
  );
}
