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
        if (data) {
          setCreatorData(data);
        } else {
          const local = localStorage.getItem(`creator_profile_${userId}`);
          if (local) setCreatorData(JSON.parse(local));
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

  const portfolioImages: string[] = creatorData?.portfolio_images || [];
  const videoLinks: string[] = creatorData?.video_links || [];
  const specialties: string[] = creatorData?.specialties || [];
  const bio = creatorData?.bio || "";
  const measurements = creatorData?.measurements || {};
  const socials = creatorData?.social_links || {};
  const rateCard = creatorData?.rate_card || "";
  const availability = creatorData?.availability || "";
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
    <div className="space-y-6 pb-20 mt-8">

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
            className="space-y-6"
          >
            {/* Identity card */}
            <div className="bg-white rounded-3xl border border-black/[0.05] p-6 md:p-8 flex flex-col md:flex-row gap-6">
              {/* Avatar */}
              <div className="h-24 w-24 rounded-2xl bg-slate-100 overflow-hidden shrink-0">
                {portfolioImages[0] ? (
                  <img src={portfolioImages[0]} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <User size={32} />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0 space-y-3">
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-tight">{profile?.full_name || "Creator"}</h2>
                  <p className="text-[11px] font-black text-[#E53935] uppercase tracking-widest mt-0.5">
                    {specialties.slice(0, 3).join(" · ") || "Creator"}
                  </p>
                  {profile?.location && (
                    <p className="text-sm text-slate-400 font-medium flex items-center gap-1 mt-1">
                      <MapPin size={13} /> {profile.location}
                    </p>
                  )}
                </div>
                {availability && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#34C759]/10 text-[#34C759] rounded-full text-[9px] font-black uppercase tracking-widest">
                    <div className="h-1.5 w-1.5 rounded-full bg-[#34C759] animate-pulse" />
                    {availability}
                  </div>
                )}
                {bio && <p className="text-slate-600 font-medium text-sm leading-relaxed">{bio}</p>}

                {/* Socials */}
                {(socials.instagram || socials.youtube || socials.website || socials.tiktok) && (
                  <div className="flex items-center gap-3 pt-1">
                    {socials.instagram && <a href={socials.instagram} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-[#E53935]"><Instagram size={18} /></a>}
                    {socials.youtube && <a href={socials.youtube} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-[#E53935]"><Youtube size={18} /></a>}
                    {socials.tiktok && <a href={socials.tiktok} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-[#E53935]"><Video size={18} /></a>}
                    {socials.website && <a href={socials.website} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-[#E53935]"><Globe size={18} /></a>}
                  </div>
                )}
              </div>
              {/* Stats */}
              <div className="flex md:flex-col gap-4 md:gap-3 shrink-0 md:text-right">
                <div className="bg-slate-50 rounded-2xl px-4 py-3 text-center">
                  <p className="text-xl font-black">{portfolioImages.length}</p>
                  <p className="text-[9px] font-black text-slate-300 uppercase">Photos</p>
                </div>
                <div className="bg-slate-50 rounded-2xl px-4 py-3 text-center">
                  <p className="text-xl font-black">{videoLinks.length}</p>
                  <p className="text-[9px] font-black text-slate-300 uppercase">Videos</p>
                </div>
              </div>
            </div>

            {/* Rate Card */}
            {rateCard && (
              <div className="bg-white rounded-3xl border border-black/[0.05] p-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Rate Card</p>
                <p className="text-sm font-medium text-slate-700 leading-relaxed whitespace-pre-line">{rateCard}</p>
              </div>
            )}

            {/* Tabs */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {[
                { id: "PORTFOLIO", label: "Photos", icon: Camera, count: portfolioImages.length },
                ...(videoLinks.length > 0 ? [{ id: "VIDEOS", label: "Videos", icon: Video, count: videoLinks.length }] : []),
                ...(measurementRows.length > 0 ? [{ id: "MEASUREMENTS", label: "Measurements", icon: Ruler, count: measurementRows.length }] : []),
              ].map(({ id, label, icon: Icon, count }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as any)}
                  className={cn(
                    "flex items-center gap-2 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border",
                    activeTab === id
                      ? "bg-black text-white border-black"
                      : "bg-white text-slate-400 border-slate-100"
                  )}
                >
                  <Icon size={13} /> {label}
                  {count > 0 && <span className={cn("h-4 w-4 rounded-full text-[8px] flex items-center justify-center", activeTab === id ? "bg-white/20 text-white" : "bg-slate-100 text-slate-400")}>{count}</span>}
                </button>
              ))}
            </div>

            {/* PORTFOLIO */}
            {activeTab === "PORTFOLIO" && (
              portfolioImages.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {portfolioImages.map((img, i) => (
                    <div key={i} className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-slate-100 group">
                      <img src={img} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-32 bg-slate-50 rounded-2xl flex items-center justify-center border-2 border-dashed border-slate-200">
                  <button onClick={() => setEditMode(true)} className="text-[10px] font-black text-slate-300 uppercase flex items-center gap-2">
                    <Camera size={16} /> Add photos
                  </button>
                </div>
              )
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
                        <img src={thumb} alt="" className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-all" />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-black" />
                      )}
                      <div className="relative z-10 flex flex-col items-center gap-2">
                        <div className="h-12 w-12 bg-white/90 rounded-full flex items-center justify-center shadow-xl group-hover:scale-110 transition-all">
                          <Play size={18} className="text-black fill-black ml-1" />
                        </div>
                        <span className="text-white text-[9px] font-black uppercase tracking-widest bg-black/50 px-3 py-1 rounded-full">{label}</span>
                      </div>
                    </a>
                  );
                })}
              </div>
            )}

            {/* MEASUREMENTS */}
            {activeTab === "MEASUREMENTS" && (
              <div className="bg-white rounded-3xl border border-black/[0.05] p-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Model Stats & Measurements</p>
                <div className="grid grid-cols-2 gap-3">
                  {measurementRows.map(({ label, value }) => (
                    <div key={label} className="bg-slate-50 rounded-2xl p-4">
                      <p className="text-[9px] font-black uppercase text-slate-300 mb-1">{label}</p>
                      <p className="text-[15px] font-black text-[#1D1D1F]">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
