"use client";
// CHECKOUT BUILD VERSION: V.5 | CHECKPOINT 5 SAFE BACKUP


import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { DEFAULT_AVATAR } from "@/utils/constants";
import { useAuth } from "@/hooks/useAuth";
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
  X,
  Users,
  ShoppingBag,
  FileText,
  BarChart3,
  Truck,
  Scale,
  DollarSign,
  Database,
  Megaphone,
  BrainCircuit,
  Wallet,
  Loader2,
  ArrowRight,
  Sparkles,
  Bell
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { detectBaseTag } from "@/utils/match-engine";
import { INDUSTRY_DATA } from "@/utils/industry-data";
import TerminalLayout from "@/components/layout/TerminalLayout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export default function PremiumProfilePage() {
  const [userData, setUserData] = useState({
     id: "",
     full_name: "User",
     role: "Founder",
     company: "Business Name",
     bio: "Professional profile description goes here.",
     checkoutRank: "--",
     avatar_url: "",
     location: "Trivandrum",
     email: "",
     phone: "",
     website: "",
     expertise: [] as string[],
     intents: [] as string[],
     base_tag: "",
     metadata: {} as any,
     postCount: 0,
     postCount: 0,
     connectionCount: 0,
     solvedCount: 0,
     primaryIntent: "Growth & Scaling"
  });
  
  const [settings, setSettings] = useState({
     publicVisibility: true,
     allowMatching: true,
     notifications: true
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [dependencyList, setDependencyList] = useState<any[]>([]);
  const [isAddingDep, setIsAddingDep] = useState(false);
  const [newDep, setNewDep] = useState({ title: "", type: "Hiring" });
  
  const { user: authUser, updateProfile, logout } = useAuth();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const contactInfo = useMemo(() => [
    { label: "Email", value: userData.email || "Verification Pending", icon: Mail },
    { label: "Phone", value: userData.phone || "+91 XXXXXXXXXX", icon: Phone },
    { label: "Website", value: userData.website || "No Website", icon: Globe, link: !!userData.website },
  ], [userData.email, userData.phone, userData.website]);

  const performanceMetrics = [
    { label: "Network Reliability", value: 98, color: "bg-[#292828]", icon: ShieldCheck },
    { label: "Strategic Match", value: userData.metadata?.match_score || 84, color: "bg-[#E53935]", icon: Target },
    { label: "Market Authority", value: 92, color: "bg-[#292828]/60", icon: Award },
    { label: "Activity Level", value: 76, color: "bg-[#E53935]/60", icon: Activity },
  ];

  useEffect(() => {
    async function loadProfile() {
      if (!authUser?.id) return;
      setIsLoading(true);
      
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();
        
        if (error) throw error;

        if (profile) {
          const metadata = profile.metadata || {};
          setUserData({
            id: profile.id,
            full_name: profile.full_name || "User",
            role: profile.role || "Founder",
            company: metadata.company_name || profile.location || "Business Name",
            bio: profile.bio || "Professional profile description goes here.",
            checkoutRank: profile.match_score ? `#${100 - profile.match_score}` : "Elite",
            avatar_url: profile.avatar_url || DEFAULT_AVATAR,
            location: profile.location || "Trivandrum",
            email: profile.email || "",
            phone: profile.phone || "",
            website: profile.website || "",
            expertise: profile.skills || [],
            intents: profile.domains || [],
            base_tag: profile.base_tag || "",
            metadata: metadata
          });

          // Load Needs (Posts)
          const { data: userPosts, error: postsError } = await supabase
            .from('posts')
            .select('*')
            .eq('author_id', authUser.id);

          if (postsError) console.error("[PROFILE] Posts Load Error:", postsError);
          
          if (userPosts) {
            setDependencyList(userPosts.map(p => ({
              id: p.id,
              content: p.content,
              type: p.type === "LEAD" ? "Hiring" : p.type === "PARTNERSHIP" ? "Partnership" : p.type === "MEETUP" ? "Meetup" : "General",
              priority: "High",
              status: p.status || "Active"
            })));
            
            // Set counts
            setUserData(prev => ({
              ...prev,
              postCount: userPosts.length,
              solvedCount: userPosts.filter(p => p.status === 'SOLVED').length
            }));
          }

          // Load Connection Count
          const { count: connCount } = await supabase
            .from('connections')
            .select('*', { count: 'exact', head: true })
            .or(`sender_id.eq.${authUser.id},receiver_id.eq.${authUser.id}`)
            .eq('status', 'ACCEPTED');
          
          setUserData(prev => ({ ...prev, connectionCount: connCount || 0 }));
        }
      } catch (err) {
        console.error("[PROFILE] Load Error:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadProfile();
  }, [authUser?.id]);

  const handleSaveProfile = async (updatedData?: any) => {
    const dataToSave = updatedData || userData;
    if (!dataToSave.id) return;
    
    const detectedBaseTag = detectBaseTag(dataToSave.role, dataToSave.expertise);

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: dataToSave.full_name,
          role: dataToSave.role.toUpperCase(),
          base_tag: detectedBaseTag,
          bio: dataToSave.bio,
          location: dataToSave.location,
          avatar_url: dataToSave.avatar_url,
          skills: dataToSave.expertise,
          domains: dataToSave.intents,
          phone: dataToSave.phone,
          website: dataToSave.website,
          email: dataToSave.email,
          metadata: {
            ...userData.metadata,
            company_name: dataToSave.company
          }
        })
        .eq('id', dataToSave.id);

      if (error) throw error;

      setUserData({ ...dataToSave, base_tag: detectedBaseTag });
      updateProfile({
        full_name: dataToSave.full_name,
        role: dataToSave.role,
        avatar_url: dataToSave.avatar_url,
        bio: dataToSave.bio,
        location: dataToSave.location,
        expertise: dataToSave.expertise,
        intents: dataToSave.intents
      });
      setShowEditModal(false);
    } catch (err: any) {
      console.error("[PROFILE] Save Error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const addDependency = async () => {
    if (!newDep.content || !authUser?.id) return;
    
    const { data, error } = await supabase
      .from('posts')
      .insert([{
        author_id: authUser.id,
        type: newDep.type === "Hiring" ? "LEAD" : newDep.type === "Partnership" ? "PARTNERSHIP" : "GENERAL",
        content: newDep.content,
        status: "ACTIVE"
      }])
      .select()
      .single();

    if (!error && data) {
      setDependencyList([{
        id: data.id,
        content: data.content,
        type: newDep.type,
        priority: "High",
        status: "Active"
      }, ...dependencyList]);
      
      setUserData(prev => ({ ...prev, postCount: prev.postCount + 1 }));
      setNewDep({ content: "", type: "Hiring" });
      setIsAddingDep(false);
    }
  };

  const removeDependency = async (id: string) => {
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', id);
    
    if (!error) {
      setDependencyList(dependencyList.filter(d => d.id !== id));
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !authUser?.id) return;

    setIsSaving(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${authUser.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`; 

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const updatedData = { ...userData, avatar_url: publicUrl };
      setUserData(updatedData);
      await handleSaveProfile(updatedData);
      
    } catch (err) {
      console.error("[AVATAR] Upload Error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#292828] flex flex-col items-center justify-center gap-6">
        <Loader2 className="animate-spin text-[#E53935]" size={48} />
        <p className="text-[10px] font-black uppercase text-white/40  italic animate-pulse">Loading Profile...</p>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      {!authUser ? null : (
        <TerminalLayout>
          <div className="min-h-screen bg-[#FDFDFF] font-sans selection:bg-[#E53935]/10">
          {/* HEADER AREA: PREMIUM GLASSMORPHISM REDESIGN */}
          <div className="bg-[#0A0A0A] h-[320px] relative overflow-hidden flex items-center">
             {/* Animated Background Engine */}
             <div className="absolute inset-0 bg-gradient-to-br from-[#0A0A0A] via-[#1a1a1a] to-[#E53935]/10" />
             <div className="absolute top-[-20%] right-[-10%] h-[600px] w-[600px] bg-[#E53935]/10 blur-[150px] rounded-full animate-pulse" />
             <div className="absolute bottom-[-10%] left-[-5%] h-[400px] w-[400px] bg-blue-500/5 blur-[120px] rounded-full" />
             
             {/* Grid Pattern Overlay */}
             <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:32px_32px]" />

             <div className="max-w-[1440px] mx-auto w-full px-6 relative z-10">
                <motion.div 
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[1.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden group"
                >
                   {/* Shine Animation Overlay */}
                   <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />

                   <div className="flex flex-col md:flex-row items-center gap-12 relative z-10">
                      {/* IDENTITY & AVATAR GLOW */}
                       <div className="relative group/avatar cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                          <div className="absolute inset-0 bg-[#E53935]/20 blur-2xl rounded-full animate-pulse" />
                          <div className="h-40 w-40 rounded-lg overflow-hidden border-4 border-white/10 p-2 backdrop-blur-xl group-hover:border-[#E53935]/50 transition-all duration-700 shadow-4xl relative">
                             <img 
                               src={userData.avatar_url} 
                               className="w-full h-full object-cover rounded-[1.8rem]" 
                               alt={userData.full_name} 
                             />
                             {/* Upload Overlay */}
                             <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center rounded-[1.8rem] transition-all">
                                <div className="flex flex-col items-center gap-2 text-white">
                                   <Plus size={24} />
                                   <span className="text-[10px] font-black uppercase">Change</span>
                                </div>
                             </div>
                             {isSaving && <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-[1.8rem]"><Loader2 className="animate-spin text-white" size={24} /></div>}
                          </div>
                          
                          {/* HIDDEN FILE INPUT */}
                          <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept="image/*"
                            onChange={handleAvatarUpload}
                          />

                          <motion.div 
                             animate={{ y: [0, -5, 0] }}
                             transition={{ duration: 4, repeat: Infinity }}
                             className="absolute -bottom-3 -right-3 h-12 w-12 bg-[#E53935] rounded-[8px] flex items-center justify-center text-white shadow-[0_10px_30px_rgba(229,57,51,0.5)] border-4 border-[#0A0A0A]"
                          >
                             <Award size={20} />
                          </motion.div>
                       </div>

                      {/* PROFILE INFO */}
                      <div className="text-center md:text-left flex-1">
                         <div className="flex flex-col gap-4 mb-4">
                            <div className="flex items-center justify-center md:justify-start gap-3">
                               <h1 className="text-5xl md:text-6xl font-black text-white leading-none  uppercase italic">{userData.full_name}</h1>
                               <CheckCircle2 size={24} className="text-[#E53935] fill-[#E53935]/10" />
                            </div>
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                               <div className="px-4 py-1.5 bg-[#E53935] rounded-[8px] text-[10px] font-black uppercase text-white shadow-lg ">
                                  {userData.role}
                               </div>
                               <div className="px-4 py-1.5 bg-white/10 backdrop-blur-md border border-white/10 rounded-[8px] text-[10px] font-black uppercase text-white ">
                                  Rank {userData.checkoutRank}
                               </div>
                               <div className="px-4 py-1.5 border border-white/5 rounded-[8px] text-[10px] font-black uppercase text-white/40 ">
                                  Elite Verified
                               </div>
                            </div>
                         </div>
                         <div className="flex flex-wrap justify-center md:justify-start gap-8 text-white/30 text-[12px] font-black uppercase  pt-2">
                            <span className="flex items-center gap-2.5 group/info"> 
                               <Building size={16} className="text-[#E53935] group-hover/info:scale-110 transition-transform" /> 
                               <span className="group-hover/info:text-white transition-colors">{userData.company}</span>
                            </span>
                            <span className="flex items-center gap-2.5 group/info"> 
                               <MapPin size={16} className="text-[#E53935] group-hover/info:scale-110 transition-transform" /> 
                               <span className="group-hover/info:text-white transition-colors">{userData.location}</span>
                            </span>
                         </div>
                      </div>

                      {/* ACTION HUB */}
                      <div className="flex flex-wrap items-center gap-4">
                         <button 
                            onClick={() => setShowEditModal(true)} 
                            className="h-16 px-10 bg-white text-[#0A0A0A] rounded-[8px] font-black text-[11px] uppercase  shadow-2xl hover:bg-[#E53935] hover:text-white transition-all transform hover:-translate-y-1 active:scale-95"
                         >
                           Edit Profile
                         </button>
                         <Link 
                            href="/creators/profile" 
                            className="flex items-center h-16 px-10 bg-[#E53935] text-white rounded-[8px] font-black text-[11px] uppercase shadow-2xl hover:bg-white hover:text-[#E53935] transition-all transform hover:-translate-y-1 active:scale-95"
                         >
                           Creator Profile
                         </Link>
                         <button 
                            onClick={() => setShowSettingsModal(true)} 
                            className="h-16 w-16 bg-white/5 backdrop-blur-md border border-white/10 rounded-[8px] flex items-center justify-center text-white hover:bg-white hover:text-[#0A0A0A] transition-all overflow-hidden relative group"
                         >
                            <Settings size={22} className="group-hover:rotate-90 transition-transform duration-500" />
                         </button>
                      </div>
                   </div>
                </motion.div>
             </div>
          </div>

          {/* MAIN CONTENT ARCHITECTURE */}
          <div className="max-w-[1440px] mx-auto px-6 -mt-12 relative z-20 pb-40">
             <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* COLUMN 1: STRATEGIC SIDEBAR */}
                <div className="lg:col-span-3 space-y-8">
                   
                   {/* Skills & Expertise */}
                   <div className="bg-white rounded-[8px] p-8 shadow-2xl border border-[#292828]/5 relative group overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-[#E53935]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                      <div className="flex items-center justify-between mb-8">
                         <h3 className="text-[10px] font-black text-[#292828]/30 uppercase flex items-center gap-3 ">
                            <BrainCircuit size={16} className="text-[#E53935]" /> Your Skills
                         </h3>
                      </div>
                       
                      <div className="mb-6">
                         <select 
                           onChange={(e) => {
                             const s = e.target.value;
                             if (s && s !== "Add expertise...") {
                               const newExpertise = Array.from(new Set([...userData.expertise, s]));
                               setUserData(prev => ({...prev, expertise: newExpertise}));
                               handleSaveProfile({...userData, expertise: newExpertise});
                             }
                           }}
                           className="w-full h-10 bg-slate-50 border border-black/5 rounded-xl px-4 text-[10px] font-black uppercase outline-none focus:border-[#E53935] transition-all cursor-pointer hover:bg-white"
                         >
                           <option>Add expertise...</option>
                           {INDUSTRY_DATA.flatMap(i => i.focusAreas).sort().map(area => (
                             <option key={area} value={area}>{area}</option>
                           ))}
                         </select>
                      </div>
                      <div className="flex flex-wrap gap-2.5">
                          {userData.expertise && userData.expertise.length > 0 ? userData.expertise.map(skill => (
                             <span 
                                key={skill} 
                                className="px-4 py-2 bg-[#0A0A0A]/5 border border-[#0A0A0A]/5 rounded-[8px] text-[10px] font-black text-[#0A0A0A] uppercase flex items-center gap-2 group/skill hover:bg-red-50 hover:text-[#E53935] transition-all cursor-default"
                             >
                                {skill}
                                <X 
                                   size={10} 
                                   className="opacity-0 group-hover/skill:opacity-100 cursor-pointer" 
                                   onClick={() => {
                                      const newExpertise = userData.expertise.filter(sk => sk !== skill);
                                      setUserData({...userData, expertise: newExpertise});
                                      handleSaveProfile({...userData, expertise: newExpertise});
                                   }}
                                />
                             </span>
                          )) : (
                            <p className="text-[11px] font-bold text-slate-300 italic px-2">No skills defined.</p>
                          )}
                      </div>
                   </div>

                   {/* ABOUT & CONTACT BLOCK */}
                   <div className="bg-white rounded-[8px] p-8 shadow-2xl border border-[#292828]/5">
                      <h3 className="text-[10px] font-black text-[#292828]/30 uppercase mb-6 flex items-center gap-2 ">
                         <div className="h-1 w-4 bg-[#E53935] rounded-full" /> Personal Bio
                      </h3>
                      <p className="text-[14px] text-[#0A0A0A] font-bold leading-relaxed mb-10 italic">"{userData.bio}"</p>
                      
                      <div className="pt-8 border-t border-[#0A0A0A]/5 space-y-6">
                         {contactInfo.map((info, i) => (
                            <div key={i} className="flex items-center gap-5 group/item cursor-pointer">
                               <div className="h-11 w-11 bg-[#0A0A0A]/5 rounded-[8px] flex items-center justify-center text-[#0A0A0A] group-hover/item:bg-[#0A0A0A] group-hover/item:text-white transition-all shadow-sm">
                                  <info.icon size={18} />
                               </div>
                               <div className="flex-1 min-w-0">
                                  <p className="text-[8px] font-black text-[#0A0A0A]/30 uppercase leading-none mb-1.5 ">{info.label}</p>
                                  <p className={cn("text-[12px] font-black truncate uppercase ", info.link ? "text-[#E53935]" : "text-[#0A0A0A]")}>{info.value}</p>
                               </div>
                            </div>
                         ))}
                      </div>
                   </div>
                </div>

                 {/* CENTRAL STRATEGIC ROADMAP */}
                 <div className="lg:col-span-6 space-y-8">
                    {/* Network Intent Selector */}
                    <div className="bg-white rounded-3xl p-10 border border-slate-100 shadow-sm relative overflow-hidden group">
                       <div className="absolute top-0 right-0 w-32 h-32 bg-[#E53935]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                       <div className="flex items-center justify-between mb-8">
                          <div>
                             <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                                <Target size={16} className="text-[#E53935]" /> Core Network Mission
                             </h3>
                             <p className="text-xl font-bold text-[#1D1D1F]">What are you solving for?</p>
                          </div>
                          <select 
                             value={userData.primaryIntent}
                             onChange={(e) => setUserData(prev => ({ ...prev, primaryIntent: e.target.value }))}
                             className="h-12 px-6 bg-slate-50 border border-slate-100 rounded-2xl text-[12px] font-bold text-slate-600 outline-none focus:border-[#E53935] transition-all cursor-pointer"
                          >
                             <option>Growth & Scaling</option>
                             <option>Investment & Funding</option>
                             <option>Talent Acquisition</option>
                             <option>Strategic Partnerships</option>
                             <option>Market Entry</option>
                          </select>
                       </div>
                       <p className="text-[13px] text-slate-400 font-medium leading-relaxed">
                          Your primary intent defines your **Strategic Feed**. Advisors and opportunities will be prioritized based on this mission.
                       </p>
                    </div>

                    <div className="bg-white rounded-3xl p-10 border border-slate-100 shadow-sm relative overflow-hidden">
                       <div className="flex items-center justify-between mb-10 pb-6 border-b border-slate-50">
                          <div>
                             <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                <Activity size={16} className="text-[#E53935]" /> Strategic Roadmap
                             </h3>
                          </div>
                          <button 
                             onClick={() => setIsAddingDep(!isAddingDep)} 
                             className="h-11 px-8 bg-[#1D1D1F] text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-[#E53935] transition-all flex items-center gap-3 shadow-xl"
                          >
                             {isAddingDep ? <X size={16} /> : <Plus size={16} />} {isAddingDep ? "Close" : "Add Objective"}
                          </button>
                       </div>

                       {isAddingDep && (
                          <div className="mb-10 p-10 bg-slate-50 rounded-3xl border border-slate-100 animate-in fade-in slide-in-from-top-4 shadow-inner">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
                                <div className="space-y-2">
                                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-1">Objective Title</p>
                                   <input type="text" placeholder="e.g. Expand to Southeast Asia" value={newDep.content || ''} onChange={(e) => setNewDep({...newDep, content: e.target.value})} className="w-full h-14 px-6 rounded-2xl border border-slate-200 text-sm font-bold text-[#1D1D1F] focus:border-[#E53935] outline-none shadow-sm" />
                                </div>
                                <div className="space-y-2">
                                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-1">Category</p>
                                   <select value={newDep.type} onChange={(e) => setNewDep({...newDep, type: e.target.value})} className="w-full h-14 px-5 rounded-2xl border border-slate-200 text-[12px] font-bold text-slate-600 outline-none focus:border-[#E53935] bg-white">
                                      <option>Hiring</option>
                                      <option>Partnership</option>
                                      <option>Procurement</option>
                                      <option>Investment</option>
                                      <option>Technology</option>
                                   </select>
                                </div>
                             </div>
                             <button onClick={addDependency} className="w-full h-16 bg-[#E53935] text-white rounded-2xl text-[11px] font-bold uppercase tracking-widest hover:bg-[#1D1D1F] transition-all shadow-2xl">Publish Objective</button>
                          </div>
                       )}

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
                                         <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[8px] font-bold uppercase rounded-[4px] tracking-widest">{dep.type}</span>
                                         <h4 className="text-[14px] font-bold text-[#1D1D1F] line-clamp-1">{dep.content}</h4>
                                      </div>
                                      <p className="text-[11px] font-medium text-slate-400">Active Priority</p>
                                   </div>
                                </div>
                                <button onClick={() => removeDependency(dep.id)} className="h-10 w-10 flex items-center justify-center rounded-xl text-slate-200 hover:bg-red-50 hover:text-[#E53935] transition-all"><X size={18} /></button>
                             </div>
                          )) : (
                             <div className="py-20 text-center opacity-30">
                                <Sparkles size={40} className="mx-auto mb-4 text-[#1D1D1F]" />
                                <p className="text-[11px] font-bold text-[#1D1D1F] uppercase tracking-widest italic">No active strategic objectives</p>
                             </div>
                          )}
                       </div>
                    </div>
                 </div>

                 {/* COLUMN 3: PERFORMANCE & IMPACT */}
                 <div className="lg:col-span-3 space-y-8">
                   {/* Performance Section */}
                   <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 space-y-8">
                      <div className="flex items-center justify-between">
                         <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            <Activity size={16} className="text-[#E53935]" /> Performance
                         </h3>
                      </div>
                      <div className="grid grid-cols-1 gap-6">
                         {performanceMetrics.map((metric, i) => (
                            <motion.div 
                               key={i} 
                               initial={{ opacity: 0, x: -10 }}
                               animate={{ opacity: 1, x: 0 }}
                               transition={{ delay: i * 0.1 }}
                               className="group"
                            >
                               <div className="flex justify-between items-center mb-3">
                                  <div className="flex items-center gap-3">
                                     <div className={cn("p-2 rounded-lg bg-slate-50 text-slate-400 group-hover:bg-[#E53935]/5 group-hover:text-[#E53935] transition-colors")}>
                                        <metric.icon size={14} />
                                     </div>
                                     <span className="text-[12px] font-semibold text-slate-600 uppercase tracking-wider">
                                        {metric.label}
                                     </span>
                                  </div>
                                  <span className="text-[14px] font-bold text-[#1D1D1F]">{metric.value}%</span>
                               </div>
                               <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden relative">
                                  <motion.div 
                                     initial={{ width: 0 }}
                                     animate={{ width: `${metric.value}%` }}
                                     transition={{ duration: 1.5, delay: i * 0.2, ease: [0.22, 1, 0.36, 1] }}
                                     className={cn("h-full rounded-full shadow-inner relative", metric.color)} 
                                  />
                               </div>
                            </motion.div>
                         ))}
                      </div>
                   </div>

                   {/* Impact Section */}
                   <div className="bg-black rounded-3xl p-8 shadow-2xl space-y-8 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-[#E53935]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                      <h3 className="text-[11px] font-bold text-white/40 uppercase tracking-[0.2em] flex items-center gap-2 relative z-10">
                         <Target size={16} className="text-[#E53935]" /> Network Impact
                      </h3>
                      
                      <div className="grid grid-cols-1 gap-4 relative z-10">
                         {[
                            { label: "Total Posts", value: userData.postCount, icon: Megaphone },
                            { label: "Partner Connections", value: userData.connectionCount, icon: Users },
                            { label: "Issues Solved", value: userData.solvedCount, icon: CheckCircle2 },
                            { label: "Endorsements", value: 0, icon: Award },
                         ].map((item, i) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl group hover:bg-white/10 transition-all">
                               <div className="flex items-center gap-3">
                                  <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center text-white/40 group-hover:text-[#E53935] transition-colors">
                                     <item.icon size={18} />
                                  </div>
                                  <span className="text-[12px] font-medium text-white/60">{item.label}</span>
                               </div>
                               <span className="text-xl font-bold text-white">{item.value}</span>
                            </div>
                         ))}
                      </div>
                   </div>
                </div>
             </div>
          </div>

          {/* EDIT MODAL */}
          {showEditModal && (
             <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-xl bg-black/80 animate-in fade-in duration-500">
                <motion.div 
                   initial={{ opacity: 0, scale: 0.95, y: 40 }}
                   animate={{ opacity: 1, scale: 1, y: 0 }}
                   className="bg-white w-full max-w-3xl rounded-[8px] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] flex flex-col max-h-[90vh] border border-[#0A0A0A]/5"
                >
                   <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                      <h2 className="text-4xl font-black text-[#0A0A0A] uppercase  italic leading-none mb-2">Edit Profile</h2>
                      <button onClick={() => setShowEditModal(false)} className="h-12 w-12 bg-white border border-slate-100 rounded-[8px] flex items-center justify-center text-slate-300 hover:bg-[#E53935] hover:text-white transition-all shadow-sm"><X size={20} /></button>
                   </div>
                   <div className="flex-1 overflow-y-auto p-10 space-y-10 no-scrollbar">
                      <div className="grid grid-cols-2 gap-8">
                         <div className="space-y-3">
                            <p className="text-[9px] font-black text-[#0A0A0A] uppercase ">Full Name</p>
                            <input type="text" value={userData.full_name} onChange={(e) => setUserData({...userData, full_name: e.target.value})} className="w-full h-16 px-6 rounded-[8px] bg-slate-50 border border-slate-100 font-black uppercase text-sm outline-none focus:border-[#E53935] transition-all shadow-inner" />
                         </div>
                         <div className="space-y-3">
                            <p className="text-[9px] font-black text-[#0A0A0A] uppercase ">Strategic Role</p>
                            <input type="text" value={userData.role} onChange={(e) => setUserData({...userData, role: e.target.value})} className="w-full h-16 px-6 rounded-[8px] bg-slate-50 border border-slate-100 font-black uppercase text-sm outline-none focus:border-[#E53935] transition-all shadow-inner" />
                         </div>
                      </div>

                      <div className="grid grid-cols-2 gap-8">
                         <div className="space-y-3">
                            <p className="text-[9px] font-black text-[#0A0A0A] uppercase ">Phone Number</p>
                            <input type="text" value={userData.phone} onChange={(e) => setUserData({...userData, phone: e.target.value})} className="w-full h-16 px-6 rounded-[8px] bg-slate-50 border border-slate-100 font-black uppercase text-sm outline-none focus:border-[#E53935] transition-all shadow-inner" />
                         </div>
                         <div className="space-y-3">
                            <p className="text-[9px] font-black text-[#0A0A0A] uppercase ">Website URL</p>
                            <input type="text" value={userData.website} onChange={(e) => setUserData({...userData, website: e.target.value})} className="w-full h-16 px-6 rounded-[8px] bg-slate-50 border border-slate-100 font-black uppercase text-sm outline-none focus:border-[#E53935] transition-all shadow-inner" />
                         </div>
                      </div>

                      <div className="space-y-3">
                         <p className="text-[9px] font-black text-[#0A0A0A] uppercase ">Email Address (Public)</p>
                         <input type="email" value={userData.email} onChange={(e) => setUserData({...userData, email: e.target.value})} className="w-full h-16 px-6 rounded-[8px] bg-slate-50 border border-slate-100 font-black uppercase text-sm outline-none focus:border-[#E53935] transition-all shadow-inner" />
                      </div>

                      <div className="space-y-3">
                         <p className="text-[9px] font-black text-[#0A0A0A] uppercase ">Node Bio / Intent</p>
                         <textarea value={userData.bio} onChange={(e) => setUserData({...userData, bio: e.target.value})} className="w-full h-32 p-6 rounded-[8px] bg-slate-50 border border-slate-100 font-bold text-sm outline-none focus:border-[#E53935] transition-all resize-none shadow-inner" />
                      </div>
                   </div>
                   <div className="p-10 border-t border-slate-100 bg-slate-50/50 flex gap-5">
                      <button onClick={() => setShowEditModal(false)} className="flex-1 h-16 border border-slate-200 rounded-[8px] font-black text-[11px] uppercase text-slate-200 hover:bg-white hover:text-[#0A0A0A] transition-all">Discard</button>
                      <button onClick={() => handleSaveProfile()} disabled={isSaving} className="flex-[2] h-16 bg-[#0A0A0A] text-white rounded-[8px] font-black text-[11px] uppercase hover:bg-[#E53935] shadow-2xl transition-all disabled:opacity-50 active:scale-95 group">
                         {isSaving ? "Saving..." : "Save Changes"}
                      </button>
                   </div>
                </motion.div>
             </div>
          )}

          {/* SETTINGS CONTROL CENTER */}
          {showSettingsModal && (
             <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-xl bg-black/80 animate-in fade-in duration-500">
                <motion.div 
                   initial={{ opacity: 0, scale: 0.95, y: 40 }}
                   animate={{ opacity: 1, scale: 1, y: 0 }}
                   className="bg-white w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] flex flex-col border border-[#0A0A0A]/5"
                >
                   <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                      <div>
                         <h2 className="text-2xl font-bold text-[#0A0A0A] uppercase tracking-tight leading-none mb-2">Controls</h2>
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Manage your network identity</p>
                      </div>
                      <button onClick={() => setShowSettingsModal(false)} className="h-10 w-10 bg-white border border-slate-100 rounded-full flex items-center justify-center text-slate-300 hover:bg-[#E53935] hover:text-white transition-all shadow-sm"><X size={16} /></button>
                   </div>
                   
                   <div className="p-8 space-y-2">
                      {[
                         { id: 'publicVisibility', label: "Public Visibility", desc: "Make profile discoverable", icon: Globe },
                         { id: 'allowMatching', label: "Strategic Matching", desc: "AI-driven partner suggestions", icon: Target },
                         { id: 'notifications', label: "Real-time Alerts", desc: "Push & email notifications", icon: Bell },
                      ].map((item) => (
                         <div key={item.id} className="flex items-center justify-between p-6 hover:bg-slate-50 rounded-3xl transition-all group">
                            <div className="flex items-center gap-4">
                               <div className="h-12 w-12 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-[#E53935] transition-colors">
                                  <item.icon size={20} />
                               </div>
                               <div>
                                  <p className="text-[13px] font-bold text-[#1D1D1F]">{item.label}</p>
                                  <p className="text-[11px] font-medium text-slate-400">{item.desc}</p>
                               </div>
                            </div>
                            <button 
                               onClick={() => setSettings(prev => ({ ...prev, [item.id]: !prev[item.id as keyof typeof settings] }))}
                               className={cn(
                                  "w-12 h-6 rounded-full p-1 transition-all duration-500 relative",
                                  settings[item.id as keyof typeof settings] ? "bg-[#E53935]" : "bg-slate-200"
                               )}
                            >
                               <motion.div 
                                  animate={{ x: settings[item.id as keyof typeof settings] ? 24 : 0 }}
                                  className="h-4 w-4 bg-white rounded-full shadow-lg" 
                               />
                            </button>
                         </div>
                      ))}
                      
                      <div className="pt-6 mt-4 border-t border-slate-100">
                         <button onClick={() => logout()} className="w-full h-16 bg-red-50 text-[#E53935] rounded-3xl border border-red-100 flex items-center justify-between px-8 hover:bg-[#E53935] hover:text-white transition-all group active:scale-95 shadow-xl shadow-red-500/5">
                            <div className="flex items-center gap-4">
                               <LogOut size={20} className="group-hover:translate-x-[-4px] transition-transform" />
                               <span className="text-[11px] font-black uppercase tracking-[0.2em]">Sign Out</span>
                            </div>
                            <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transition-all" />
                         </button>
                      </div>
                   </div>
                   
                   <div className="p-6 bg-slate-50 text-center">
                      <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Checkout Business OS v.1.2</p>
                   </div>
                </motion.div>
             </div>
          )}
        </div>
        </TerminalLayout>
      )}
    </ProtectedRoute>
  );
}
