"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Edit3, Eye, User, Camera, Video, Ruler, Link2,
  Save, Check, Plus, X, Play, ExternalLink,
  Instagram, Youtube, Globe, Star, MapPin, Award, Shield, Bookmark
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import CreatorProfileEditor from "@/components/creators/CreatorProfileEditor";
import Button from "@/components/ui/Button";

const supabase = createClient();

const SPECIALTY_LABELS: Record<string, string> = {
  "Fashion Modeling": "Fashion",
  "UGC Creator": "UGC",
  "Editorial": "Editorial",
  "Fitness / Sports": "Fitness",
  "Beauty / Makeup": "Beauty",
};

export default function MyCreatorProfilePage() {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<"PORTFOLIO" | "VIDEOS" | "MEASUREMENTS">("PORTFOLIO");
  const [editMode, setEditMode] = useState(false);
  const [creatorData, setCreatorData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const userId = profile?.id || user?.id;

  useEffect(() => {
    if (!userId) return;
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const { data } = await supabase
          .from("creator_profiles")
          .select("*")
          .eq("id", userId)
          .maybeSingle();
          
        const local = localStorage.getItem(`creator_profile_${userId}`);
        const localData = local ? JSON.parse(local) : {};

        if (data) {
          setCreatorData({ ...data, ...localData }); // Merge so local payload overrides missing db columns
        } else {
          if (local) setCreatorData(localData);
        }
      } catch {
        const local = localStorage.getItem(`creator_profile_${userId}`);
        if (local) setCreatorData(JSON.parse(local));
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [userId]);

  if (!user && !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-slate-400 text-sm font-bold uppercase">Please log in to view your creator profile.</p>
      </div>
    );
  }

  const portfolioImages: string[] = creatorData?.portfolio_gallery || creatorData?.portfolio_images || [];
  const videoLinks: string[] = creatorData?.videos || creatorData?.video_links || [];
  const specialties: string[] = creatorData?.subcategories || creatorData?.specialties || [];
  const bio = creatorData?.bio || "";
  const measurements = creatorData?.measurements || {};
  const socials = creatorData?.social_links || {};
  const rateCard = creatorData?.rate_card || "";
  const availability = creatorData?.availability || "";

  // Social metrics (from seed data or stored profile)
  const socialMetrics = creatorData?.social_metrics || null;
  const instagramFollowers = socialMetrics?.followers?.instagram || 0;
  const totalFollowers = socialMetrics ? (Object.values(socialMetrics.followers) as number[]).reduce((a: number, b: number) => a + b, 0) : 0;
  const engagementRate = socialMetrics?.engagement_rate || 0;
  const growthRate = socialMetrics?.growth_rate || 0;

  const formatFollowers = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };
  const hasProfile = bio || portfolioImages.length > 0 || specialties.length > 0;

  const measurementRows = [
    { label: "Height", value: measurements.height },
    { label: "Weight", value: measurements.weight },
    { label: "Bust / Chest", value: measurements.bust },
    { label: "Waist", value: measurements.waist },
    { label: "Hips", value: measurements.hips },
    { label: "Dress Size", value: measurements.dress_size },
    { label: "Shoe Size", value: measurements.shoe_size },
    { label: "Hair Color", value: measurements.hair_color },
    { label: "Eye Color", value: measurements.eye_color },
    { label: "Skin Tone", value: measurements.skin_tone },
  ].filter(r => r.value);

  const getVideoThumbnail = (url: string) => {
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    if (ytMatch) return `https://img.youtube.com/vi/${ytMatch[1]}/mqdefault.jpg`;
    return null;
  };

  const getVideoLabel = (url: string) => {
    if (url.includes("youtube") || url.includes("youtu.be")) return "YouTube";
    if (url.includes("instagram")) return "Instagram";
    if (url.includes("tiktok")) return "TikTok";
    if (url.includes("vimeo")) return "Vimeo";
    return "Video";
  };

  return (
    <div className="px-4 lg:px-8 space-y-6 pb-20 mt-8 max-w-[1200px] mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight">My Creator Profile</h1>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            {hasProfile ? "Your public creator portfolio" : "Set up your creator portfolio to get discovered"}
          </p>
        </div>
        <button
          onClick={() => setEditMode(!editMode)}
          className={cn(
            "flex items-center gap-2 h-11 px-5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
            editMode
              ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
              : "bg-black text-white hover:bg-[#E53935]"
          )}
        >
          {editMode ? <><Eye size={14} /> View</> : <><Edit3 size={14} /> Edit Profile</>}
        </button>
      </div>

      {/* Empty State — no profile yet */}
      {!hasProfile && !editMode && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border border-black/[0.05] p-10 text-center space-y-5"
        >
          <div className="h-16 w-16 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto">
            <User size={28} className="text-slate-200" />
          </div>
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight mb-2">Your creator profile is empty</h2>
            <p className="text-slate-400 font-medium text-sm max-w-md mx-auto">
              Add your bio, portfolio photos, video links, measurements, and rate card so brands can discover and hire you.
            </p>
          </div>
          <button
            onClick={() => setEditMode(true)}
            className="h-12 px-8 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#E53935] transition-all inline-flex items-center gap-2"
          >
            <Edit3 size={14} /> Set Up Profile
          </button>
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {/* EDIT MODE */}
        {editMode && userId && (
          <motion.div
            key="edit"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-3xl border border-black/[0.05] shadow-sm p-6 md:p-8"
          >
            <div className="flex items-center gap-3 mb-6 pb-5 border-b border-slate-100">
              <div className="h-10 w-10 bg-black text-white rounded-2xl flex items-center justify-center">
                <Edit3 size={18} />
              </div>
              <div>
                <h2 className="text-lg font-black uppercase tracking-tight">Edit Your Portfolio</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Bio · Photos · Videos · Measurements · Rates</p>
              </div>
            </div>
            <CreatorProfileEditor
              profileId={userId}
              initialData={creatorData || {}}
              onSave={(saved) => {
                setCreatorData(saved);
                setEditMode(false);
              }}
            />
          </motion.div>
        )}

        {/* VIEW MODE */}
        {!editMode && hasProfile && (
          <motion.div
            key="view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col lg:flex-row gap-8 items-start relative max-w-7xl mx-auto w-full"
          >
            {/* LEFT SIDEBAR: Sticky Identity Profile */}
            <div className="w-full lg:w-[340px] shrink-0 lg:sticky lg:top-24 space-y-6">
              {/* 1. PRIMARY IDENTITY CARD */}
              <div className="bg-white rounded-2xl p-8 border border-black/[0.04] shadow-xl text-center space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 blur-2xl rounded-full" />
                
                {/* Avatar image frame */}
                <div className="h-32 w-32 rounded-full bg-slate-100 border-4 border-white shadow-2xl mx-auto -mt-4 overflow-hidden relative">
                  <img
                    src={portfolioImages[0] || profile?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&fit=crop"}
                    className="w-full h-full object-cover"
                    alt=""
                  />
                </div>

                <div className="space-y-3">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-amber-100 to-amber-50 text-amber-700 border border-amber-200 rounded-full text-[9px] font-black uppercase tracking-[0.2em]">
                    <Award size={12} fill="currentColor" /> {creatorData?.creator_level || "Rising"} Creator
                  </div>
                  
                  <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight flex items-center justify-center gap-1.5">
                    {profile?.full_name || "Creator"}
                    {creatorData?.is_verified && <Shield size={18} className="text-blue-500 fill-blue-500/20" />}
                  </h1>
                  
                  <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1 max-w-[280px] mx-auto">
                    {specialties.length > 0 ? (
                      specialties.map((sub: string, idx: number) => (
                        <span key={idx} className="px-2.5 py-1 bg-black/[0.03] border border-black/[0.05] text-[9px] font-black uppercase tracking-[0.2em] text-black/70 rounded-md">
                          {sub}
                        </span>
                      ))
                    ) : (
                      <span className="px-2.5 py-1 bg-black/[0.03] border border-black/[0.05] text-[9px] font-black uppercase tracking-[0.2em] text-black/70 rounded-md">Creator</span>
                    )}
                  </div>
                  
                  {profile?.location && (
                    <p className="text-black/40 font-medium text-sm flex items-center justify-center gap-1">
                      <MapPin size={13} className="text-black/30" /> {profile.location}
                    </p>
                  )}
                  
                  {availability && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#34C759]/10 text-[#34C759] rounded-full text-[9px] font-black uppercase tracking-widest">
                      <div className="h-1.5 w-1.5 rounded-full bg-[#34C759] animate-pulse" />
                      {availability.replace("_", " ")}
                    </div>
                  )}
                </div>

                {/* Instagram Followers Badge */}
                {instagramFollowers > 0 && (
                  <div className="flex items-center justify-center gap-3 px-4 py-3 bg-gradient-to-r from-rose-50 via-pink-50 to-fuchsia-50 rounded-2xl border border-rose-100/60">
                    <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#E53935] to-[#C2185B] text-white flex items-center justify-center shadow-lg shadow-rose-200/50">
                      <Instagram size={16} />
                    </div>
                    <div className="text-left">
                      <p className="text-xl font-black text-black leading-none">{formatFollowers(instagramFollowers)}</p>
                      <p className="text-[8px] font-black uppercase tracking-[0.2em] text-rose-400">Instagram Followers</p>
                    </div>
                  </div>
                )}

                {/* Verified Trust stats */}
                <div className="grid grid-cols-3 gap-2 pt-6 border-t border-black/[0.04] text-center">
                  <div>
                    <p className="text-xl font-black text-black">{creatorData?.trust_score || 70}</p>
                    <p className="text-[8px] font-black uppercase tracking-widest text-black/30 mt-0.5">Trust</p>
                  </div>
                  <div className="border-l border-r border-black/5">
                    <p className="text-xl font-black text-black">{engagementRate}%</p>
                    <p className="text-[8px] font-black uppercase tracking-widest text-black/30 mt-0.5">Engagement</p>
                  </div>
                  <div>
                    <p className="text-xl font-black text-black">{creatorData?.completion_rate || 90}%</p>
                    <p className="text-[8px] font-black uppercase tracking-widest text-black/30 mt-0.5">Completion</p>
                  </div>
                </div>
              </div>

              {/* 2. PROFILE STRENGTH GAUGES */}
              <div className="bg-white rounded-2xl p-6 border border-black/[0.04] space-y-6 shadow-sm">
                <div className="space-y-3">
                  <span className="text-[9px] font-black uppercase tracking-widest text-black/30">Profile Strength</span>
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-black/[0.02]">
                    <div>
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest bg-blue-600 text-white mb-1.5">
                        {creatorData?.completion_rate >= 90 ? "Excellent" : "Growing"}
                      </span>
                      <h4 className="text-[11px] font-black uppercase text-black/60 tracking-wider">Completeness</h4>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-black text-black leading-none">{creatorData?.completion_rate || 90}%</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Rate Card & Commercial Rates */}
              {rateCard && (
                <div className="bg-white rounded-2xl p-6 border border-black/[0.04]">
                  <h3 className="text-[9px] font-black uppercase tracking-widest text-black/30 mb-3">Rate Card Matrix</h3>
                  <p className="text-xs font-bold text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-2xl border border-black/[0.02]">
                    {rateCard}
                  </p>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: Media Kit Showcase & Portfolios */}
            <div className="flex-1 min-w-0 space-y-6">

              {/* About & Specialties */}
              <div className="bg-white rounded-2xl p-8 border border-black/[0.04] space-y-5">
                <h2 className="text-xl font-black uppercase tracking-tight">Talent Narrative</h2>
                <p className="text-black/60 font-medium leading-relaxed text-base">{bio}</p>
                {creatorData?.skills && creatorData.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {creatorData.skills.map((s: string) => (
                      <span key={s} className="px-4 py-2 bg-slate-50 text-black border border-black/[0.04] rounded-xl text-[9px] font-black uppercase tracking-widest">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* SOCIAL CHANNELS & GROWTH STATISTICS */}
              <div className="bg-white rounded-2xl p-8 border border-black/[0.04] space-y-6">
                <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                  <Award size={20} className="text-[#E53935]" /> Audience Intelligence &amp; Verified Socials
                </h2>

                {/* Social Channel metrics table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-[10px] font-black uppercase tracking-wider text-black/50">
                    <thead>
                      <tr className="border-b border-black/[0.04] text-[9px] font-black text-black/30">
                        <th className="pb-3">Social Network</th>
                        <th className="pb-3">Followers</th>
                        <th className="pb-3 text-right">Engagement</th>
                        <th className="pb-3 text-right">Growth Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-black">
                      {socials.instagram && socialMetrics?.followers?.instagram && (
                        <tr>
                          <td className="py-4 flex items-center gap-2 text-slate-800"><Instagram size={14} className="text-rose-500" /> Instagram</td>
                          <td className="py-4 font-black">{(socialMetrics.followers.instagram / 1000).toFixed(0)}K</td>
                          <td className="py-4 text-right font-black text-[#E53935]">{socialMetrics.engagement_rate}%</td>
                          <td className="py-4 text-right font-black text-emerald-600">+{socialMetrics.growth_rate}%</td>
                        </tr>
                      )}
                      {socials.youtube && socialMetrics?.followers?.youtube && (
                        <tr>
                          <td className="py-4 flex items-center gap-2 text-slate-800"><Youtube size={14} className="text-red-600" /> YouTube</td>
                          <td className="py-4 font-black">{(socialMetrics.followers.youtube / 1000).toFixed(0)}K</td>
                          <td className="py-4 text-right font-black text-black/60">3.2%</td>
                          <td className="py-4 text-right font-black text-emerald-600">+4.5%</td>
                        </tr>
                      )}
                      {socials.tiktok && socialMetrics?.followers?.tiktok && (
                        <tr>
                          <td className="py-4 flex items-center gap-2 text-slate-800"><Video size={14} className="text-black" /> TikTok</td>
                          <td className="py-4 font-black">{(socialMetrics.followers.tiktok / 1000).toFixed(0)}K</td>
                          <td className="py-4 text-right font-black text-[#E53935]">6.5%</td>
                          <td className="py-4 text-right font-black text-emerald-600">+12.4%</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Demographic Breakdown graphs */}
                {socialMetrics?.audience_geography && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                    <div className="bg-slate-50 p-5 rounded-2xl border border-black/[0.02] space-y-3">
                      <p className="text-[9px] font-black uppercase tracking-widest text-black/30">Audience Geography</p>
                      {Object.entries(socialMetrics.audience_geography).map(([geo, pct]) => (
                        <div key={geo} className="space-y-1">
                          <div className="flex justify-between text-[9px] font-black uppercase text-black">
                            <span>{geo}</span>
                            <span>{pct as number}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-slate-800" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="bg-slate-50 p-5 rounded-2xl border border-black/[0.02] space-y-3">
                      <p className="text-[9px] font-black uppercase tracking-widest text-black/30">Audience Interests</p>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {(socialMetrics.audience_interests || []).map((interest: string) => (
                          <span key={interest} className="px-3 py-1.5 bg-white border border-black/5 rounded-lg text-[9px] font-black uppercase text-black">
                            {interest}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation Tabbed Grid */}
              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {[
                  { id: "PORTFOLIO", label: "Catalog Photos", icon: Camera },
                  ...(videoLinks.length > 0 ? [{ id: "VIDEOS", label: "Video Loops", icon: Video }] : []),
                  ...(measurementRows.length > 0 ? [{ id: "MEASUREMENTS", label: "Specs & Physicals", icon: Ruler }] : []),
                  { id: "REVIEWS", label: "Endorsement Reviews", icon: Star }
                ].map((tb) => (
                  <button
                    key={tb.id}
                    onClick={() => setActiveTab(tb.id as any)}
                    className={cn(
                      "flex items-center gap-2 px-5 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border",
                      activeTab === tb.id
                        ? "bg-black text-white border-black"
                        : "bg-white text-black/40 border-black/[0.04] hover:border-black/10"
                    )}
                  >
                    <tb.icon size={13} />
                    {tb.label}
                  </button>
                ))}
              </div>

              {/* TABCONTENT: Photos Grid */}
              {activeTab === "PORTFOLIO" && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 animate-in fade-in duration-300">
                  {portfolioImages.length > 0 ? portfolioImages.map((img, i) => (
                    <div key={i} className="group relative overflow-hidden rounded-2xl aspect-[3/4] bg-slate-100 shadow-sm border border-black/[0.03]">
                      <img src={img} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent opacity-0 group-hover:opacity-100 transition-all z-10" />
                      <div className="absolute bottom-4 left-4 opacity-0 group-hover:opacity-100 transition-all z-20">
                        <p className="text-white text-[9px] font-black uppercase tracking-wider">Catalog Asset {i + 1}</p>
                      </div>
                    </div>
                  )) : (
                    <div className="col-span-full h-32 bg-slate-50 rounded-2xl flex items-center justify-center border-2 border-dashed border-slate-200">
                      <button onClick={() => setEditMode(true)} className="text-[10px] font-black text-slate-300 uppercase flex items-center gap-2 hover:text-[#E53935]">
                        <Camera size={16} /> Add photos to your portfolio
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* TABCONTENT: Video Embeds */}
              {activeTab === "VIDEOS" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-300">
                  {videoLinks.map((link, i) => {
                    const ytThumb = link.includes('youtu') ? (() => {
                      let videoId = '';
                      try {
                        if (link.includes('youtube.com/watch')) {
                          videoId = new URL(link).searchParams.get('v') || '';
                        } else if (link.includes('youtu.be/')) {
                          videoId = link.split('youtu.be/')[1]?.split('?')[0];
                        }
                      } catch(e) {}
                      return videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : null;
                    })() : null;

                    return (
                      <a
                        key={i}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative overflow-hidden rounded-2xl aspect-video bg-black flex items-center justify-center border border-black/5 shadow-sm"
                      >
                        {ytThumb ? (
                          <img src={ytThumb} alt="" className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-40 transition-opacity" />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-black opacity-90" />
                        )}
                        <div className="relative z-10 flex flex-col items-center gap-2 text-center">
                          <div className="h-14 w-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(0,0,0,0.5)] group-hover:bg-[#E53935] transition-all text-white ml-1 group-hover:scale-110 group-hover:shadow-[#E53935]/50">
                            <Play size={20} fill="currentColor" />
                          </div>
                          <span className="text-white text-[9px] font-black uppercase tracking-widest bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full border border-white/10 mt-2 drop-shadow-md">
                            Play Reel Loop {i + 1}
                          </span>
                        </div>
                        <ExternalLink size={14} className="absolute top-4 right-4 text-white/80 drop-shadow-md" />
                      </a>
                    );
                  })}
                </div>
              )}

              {/* TABCONTENT: Measurements & Physicals */}
              {activeTab === "MEASUREMENTS" && (
                <div className="bg-white rounded-2xl p-8 border border-black/[0.04] space-y-6 animate-in fade-in duration-300">
                  <div>
                    <h3 className="text-lg font-black uppercase tracking-tight">Physical Index Specs</h3>
                    <p className="text-xs text-black/30 font-bold uppercase tracking-widest mt-1">Verified physical portfolio measurements</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {measurementRows.map(({ label, value }) => (
                      <div key={label} className="bg-slate-50 p-4 rounded-2xl border border-black/[0.02] flex items-center justify-between">
                        <span className="text-[9px] font-black uppercase text-black/45">{label}</span>
                        <span className="text-sm font-black text-black">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TABCONTENT: Reviews */}
              {activeTab === "REVIEWS" && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="bg-white p-12 rounded-2xl border border-black/5 text-center text-black/30 uppercase text-[10px] font-black">
                    No strategic reviews submitted yet.
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
