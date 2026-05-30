"use client";

import React, { useState, useEffect } from "react";
import {
  Star, CheckCircle2, MapPin, Mail, Instagram, Globe, Play,
  ChevronLeft, Bookmark, Shield, Award, Edit3, Ruler, Video,
  Camera, Link2, Youtube, ExternalLink
} from "lucide-react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import CreatorProfileEditor from "@/components/creators/CreatorProfileEditor";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const supabase = createClient();

export default function CreatorProfilePage({ params }: { params: { id: string } }) {
  const { user, profile: authProfile } = useAuth();
  const isOwner = authProfile?.id === params.id || user?.id === params.id;

  const [activeTab, setActiveTab] = useState<"PORTFOLIO" | "VIDEOS" | "REVIEWS" | "MEASUREMENTS">("PORTFOLIO");
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [creatorData, setCreatorData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCreatorProfile = async () => {
      setLoading(true);
      
      // Handle mock data for demo feed
      if (params.id.startsWith("mock-")) {
        setTimeout(() => {
          setCreatorData({
            id: params.id,
            bio: "I am a professional content creator specializing in high-end fashion, commercial modeling, and user-generated content for lifestyle brands. I've worked with top-tier agencies and always deliver exceptional quality.",
            specialties: ["Fashion Modeling", "Commercial Modeling", "Editorial", "Beauty / Makeup", "UGC Creator"],
            availability: "AVAILABLE THIS WEEK",
            rate_card: "Hourly Rate: $150/hr\nDaily Rate: $1000/day\nContact for bulk content packages and custom deliverables.",
            portfolio_images: [
              "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=900",
              "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=900",
              "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=900",
              "https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=900"
            ],
            video_links: ["https://youtube.com/watch?v=dQw4w9WgXcQ"],
            measurements: { height: "5'9\"", bust: "34\"", waist: "24\"", hips: "35\"", shoe: "8" },
            social_links: { instagram: "https://instagram.com/creator", youtube: "https://youtube.com/creator" },
            profiles: {
              full_name: params.id === "mock-1" ? "Sarah Jenkins" : params.id === "mock-2" ? "Rajat Menon" : "Priya Patel",
              location: "Los Angeles, CA",
              avatar_url: null
            },
            trust_score: params.id === "mock-1" ? 95 : 88,
            is_verified: true,
            category: "Model / Creator"
          });
          setLoading(false);
        }, 500);
        return;
      }

      try {
        const { data } = await supabase
          .from("creator_profiles")
          .select("*, profiles(*)")
          .eq("id", params.id)
          .maybeSingle();

        const local = localStorage.getItem(`creator_profile_${params.id}`);
        const localData = local ? JSON.parse(local) : {};

        if (data) {
          setCreatorData({ ...data, ...localData });
        } else {
          if (local) setCreatorData(localData);
        }
      } catch (e) {
        const local = localStorage.getItem(`creator_profile_${params.id}`);
        if (local) setCreatorData(JSON.parse(local));
      } finally {
        setLoading(false);
      }
    };
    fetchCreatorProfile();
  }, [params.id]);

  const portfolioImages: string[] = creatorData?.portfolio_images || [
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=900",
    "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=900",
    "https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=900",
    "https://images.unsplash.com/photo-1581044777550-4cfa60707c03?q=80&w=900",
  ];

  const videoLinks: string[] = creatorData?.video_links || [];
  const specialties: string[] = creatorData?.specialties || ["Fashion Modeling", "UGC Creator", "Editorial"];
  const bio = creatorData?.bio || "Professional lifestyle creator with a passion for authentic storytelling. Working with brands across fashion, beauty, and lifestyle to create content that connects and converts.";
  const measurements = creatorData?.measurements || {};
  const socials = creatorData?.social_links || {};
  const rateCard = creatorData?.rate_card || "";
  const availability = creatorData?.availability || "Available This Week";

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

  return (
    <div className="bg-[#FBFBFD] min-h-screen pb-32">
      {/* Premium Cover */}
      <div className="h-64 md:h-[360px] w-full bg-black relative">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542038784456-1ea8e935640e?q=80&w=2070')] bg-cover bg-center opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#FBFBFD] via-transparent to-transparent" />
        <div className="absolute top-6 left-6 right-6 flex justify-between z-20">
          <Link href="/creators" className="h-12 w-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white hover:text-black transition-colors">
            <ChevronLeft size={20} />
          </Link>
          <div className="flex gap-2">
            {isOwner && (
              <button
                onClick={() => setEditMode(!editMode)}
                className={cn(
                  "h-12 px-5 rounded-full backdrop-blur-md border border-white/20 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all",
                  editMode ? "bg-white text-black" : "bg-white/10 text-white hover:bg-white hover:text-black"
                )}
              >
                <Edit3 size={14} />
                {editMode ? "View Profile" : "Edit Profile"}
              </button>
            )}
            <button
              onClick={() => setIsBookmarked(!isBookmarked)}
              className={cn(
                "h-12 w-12 rounded-full backdrop-blur-md border border-white/20 flex items-center justify-center transition-colors",
                isBookmarked ? "bg-white text-black" : "bg-white/10 text-white hover:bg-white hover:text-black"
              )}
            >
              <Bookmark size={20} fill={isBookmarked ? "currentColor" : "none"} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10 -mt-28 md:-mt-40">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* LEFT: Identity Card */}
          <div className="w-full lg:w-[340px] shrink-0 space-y-5">
            <div className="bg-white rounded-[2rem] p-8 border border-black/[0.05] shadow-xl">
              {/* Avatar */}
              <div className="h-32 w-32 rounded-full bg-gray-200 border-4 border-white shadow-xl mx-auto -mt-24 overflow-hidden">
                <img
                  src={portfolioImages[0] || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1064"}
                  className="w-full h-full object-cover"
                  alt="Creator"
                />
              </div>

              <div className="text-center mt-5 space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-amber-100 to-amber-50 text-amber-700 border border-amber-200 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">
                  <Award size={12} /> Elite Creator
                </div>
                <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight flex items-center justify-center gap-2">
                  {authProfile?.full_name || "Creator"}
                  <Shield size={20} className="text-blue-500" fill="currentColor" />
                </h1>
                <p className="text-[11px] font-black uppercase tracking-[0.15em] text-[#E53935]">
                  {specialties.slice(0, 2).join(" · ")}
                </p>
                <p className="text-black/40 font-medium text-sm flex items-center justify-center gap-1">
                  <MapPin size={12} /> {authProfile?.location || "India"}
                </p>
                {availability && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#34C759]/10 text-[#34C759] rounded-full text-[9px] font-black uppercase tracking-widest">
                    <div className="h-1.5 w-1.5 rounded-full bg-[#34C759] animate-pulse" />
                    {availability}
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-black/5">
                <div className="text-center">
                  <p className="text-xl font-black">100</p>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-black/30 mt-0.5">Trust</p>
                </div>
                <div className="text-center border-l border-r border-black/5">
                  <p className="text-xl font-black">{portfolioImages.length}+</p>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-black/30 mt-0.5">Photos</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-black flex items-center justify-center gap-1"><Star size={14} fill="currentColor" /> 5.0</p>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-black/30 mt-0.5">Rating</p>
                </div>
              </div>

              {!isOwner && (
                <div className="mt-6 space-y-2">
                  <Button className="w-full h-12 rounded-2xl bg-[#E53935] text-white text-[10px] font-black uppercase tracking-widest hover:bg-black shadow-lg shadow-red-500/20">
                    Shortlist &amp; Hire
                  </Button>
                  <Button className="w-full h-12 rounded-2xl bg-black/5 text-black text-[10px] font-black uppercase tracking-widest hover:bg-black/10">
                    Message
                  </Button>
                </div>
              )}

              {/* Socials */}
              {(socials.instagram || socials.youtube || socials.website || socials.tiktok) && (
                <div className="mt-6 pt-6 border-t border-black/5 flex flex-wrap justify-center gap-4">
                  {socials.instagram && (
                    <a href={socials.instagram} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-[#E53935] transition-colors">
                      <Instagram size={20} />
                    </a>
                  )}
                  {socials.youtube && (
                    <a href={socials.youtube} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-[#E53935] transition-colors">
                      <Youtube size={20} />
                    </a>
                  )}
                  {socials.tiktok && (
                    <a href={socials.tiktok} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-[#E53935] transition-colors">
                      <Video size={20} />
                    </a>
                  )}
                  {socials.website && (
                    <a href={socials.website} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-[#E53935] transition-colors">
                      <Globe size={20} />
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Rate Card */}
            {rateCard && !editMode && (
              <div className="bg-white rounded-[2rem] p-6 border border-black/[0.05]">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Rate Card</h3>
                <p className="text-sm font-medium text-slate-700 leading-relaxed whitespace-pre-line">{rateCard}</p>
              </div>
            )}
          </div>

          {/* RIGHT: Main Content */}
          <div className="flex-1 min-w-0 space-y-6">

            {editMode ? (
              /* EDIT MODE */
              <div className="bg-white rounded-[2rem] p-6 md:p-8 border border-black/[0.05] shadow-sm">
                <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100">
                  <div className="h-10 w-10 bg-black text-white rounded-2xl flex items-center justify-center">
                    <Edit3 size={18} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black uppercase tracking-tight">Edit Creator Profile</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Update your portfolio, bio, videos, measurements & rates</p>
                  </div>
                </div>
                <CreatorProfileEditor
                  profileId={params.id}
                  initialData={creatorData || {}}
                  onSave={(saved) => {
                    setCreatorData(saved);
                    setEditMode(false);
                  }}
                />
              </div>
            ) : (
              /* VIEW MODE */
              <>
                {/* Bio */}
                <div className="bg-white rounded-[2rem] p-8 border border-black/[0.05]">
                  <h2 className="text-xl font-black uppercase tracking-tight mb-3">About</h2>
                  <p className="text-black/60 font-medium leading-relaxed">{bio}</p>
                  {specialties.length > 0 && (
                    <div className="mt-5 flex flex-wrap gap-2">
                      {specialties.map(s => (
                        <span key={s} className="px-4 py-2 bg-black/[0.03] text-black rounded-xl text-[10px] font-bold uppercase tracking-widest border border-black/5">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Tabs */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                  {[
                    { id: "PORTFOLIO", label: "Photos", icon: Camera },
                    ...(videoLinks.length > 0 ? [{ id: "VIDEOS", label: "Videos", icon: Video }] : []),
                    ...(measurementRows.length > 0 ? [{ id: "MEASUREMENTS", label: "Measurements", icon: Ruler }] : []),
                    { id: "REVIEWS", label: "Reviews", icon: Star },
                  ].map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => setActiveTab(id as any)}
                      className={cn(
                        "flex items-center gap-2 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border",
                        activeTab === id
                          ? "bg-black text-white border-black"
                          : "bg-white text-slate-400 border-slate-100 hover:border-slate-300"
                      )}
                    >
                      <Icon size={13} />
                      {label}
                    </button>
                  ))}
                </div>

                {/* PORTFOLIO GRID */}
                {activeTab === "PORTFOLIO" && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {portfolioImages.map((img, i) => (
                      <div key={i} className="group relative overflow-hidden rounded-[1.5rem] bg-black aspect-[3/4] cursor-pointer">
                        <img src={img} alt="" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition-all">
                          <p className="text-white text-[10px] font-black uppercase">Photo {i + 1}</p>
                        </div>
                      </div>
                    ))}
                    {portfolioImages.length === 0 && (
                      <div className="col-span-3 h-40 flex items-center justify-center text-slate-300">
                        <div className="text-center">
                          <Camera size={32} className="mx-auto mb-2" />
                          <p className="text-[10px] font-black uppercase">No photos yet</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* VIDEOS */}
                {activeTab === "VIDEOS" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {videoLinks.map((link, i) => {
                      const thumb = getVideoThumbnail(link);
                      const label = getVideoLabel(link);
                      return (
                        <a
                          key={i}
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group relative overflow-hidden rounded-2xl bg-black aspect-video flex items-center justify-center"
                        >
                          {thumb ? (
                            <img src={thumb} alt="" className="w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-all" />
                          ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-black" />
                          )}
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                            <div className="h-14 w-14 bg-white/90 rounded-full flex items-center justify-center shadow-xl group-hover:scale-110 transition-all">
                              <Play size={22} className="text-black fill-black ml-1" />
                            </div>
                            <span className="text-white text-[10px] font-black uppercase tracking-widest bg-black/50 px-3 py-1 rounded-full">
                              {label}
                            </span>
                          </div>
                          <ExternalLink size={14} className="absolute top-3 right-3 text-white/50" />
                        </a>
                      );
                    })}
                  </div>
                )}

                {/* MEASUREMENTS */}
                {activeTab === "MEASUREMENTS" && (
                  <div className="bg-white rounded-[2rem] p-6 border border-black/[0.05]">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-5">Model Stats & Measurements</h3>
                    <div className="divide-y divide-slate-50">
                      {measurementRows.map(({ label, value }) => (
                        <div key={label} className="flex items-center justify-between py-3">
                          <p className="text-[11px] font-black uppercase text-slate-400">{label}</p>
                          <p className="text-[13px] font-black text-[#1D1D1F]">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* REVIEWS */}
                {activeTab === "REVIEWS" && (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="bg-white p-6 rounded-[2rem] border border-black/5">
                        <div className="flex gap-1 text-yellow-400 mb-3">
                          {[...Array(5)].map((_, j) => <Star key={j} size={14} fill="currentColor" />)}
                        </div>
                        <p className="text-base font-medium italic text-black/70 leading-relaxed">
                          "Absolutely phenomenal work. Completely understood our brand vision and delivered assets that looked 10x more premium. Already booking for next quarter."
                        </p>
                        <div className="mt-4 flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-slate-100" />
                          <div>
                            <p className="font-bold text-sm">Marcus Director</p>
                            <p className="text-[9px] font-bold uppercase tracking-widest text-black/30">CMO @ Lumina Apparel</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
