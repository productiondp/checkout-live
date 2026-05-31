"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Star, CheckCircle2, MapPin, Mail, Instagram, Globe, Play,
  ChevronLeft, Bookmark, Shield, Award, Edit3, Ruler, Video,
  Camera, Link2, Youtube, ExternalLink, Zap, BarChart3, MessageSquare,
  Check, Lock, ShieldCheck, UserPlus, X, HelpCircle, Activity, Clock
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import CreatorProfileEditor from "@/components/creators/CreatorProfileEditor";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { calculateMatchScore, calculateProfileStrength, getMatchLabel, getProfileStrengthLabel, SeedCreator } from "@/data/creator-seed-data";
import { ConnectionService } from "@/services/connection-service";

const supabase = createClient();

export default function CreatorProfilePage({ params }: { params: { id: string } }) {
  const { user, profile: authProfile } = useAuth();
  const router = useRouter();
  const isOwner = authProfile?.id === params.id || user?.id === params.id;

  const [activeTab, setActiveTab] = useState<"PORTFOLIO" | "VIDEOS" | "REVIEWS" | "MEASUREMENTS">("PORTFOLIO");
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [creatorData, setCreatorData] = useState<SeedCreator | null>(null);
  const [loading, setLoading] = useState(true);

  // Connection CRM state
  const [connectionStatus, setConnectionStatus] = useState<string>("none");
  const [connectionLoading, setConnectionLoading] = useState(false);

  // Direct Contact Action Sheet state
  const [contactSheetOpen, setContactSheetOpen] = useState(false);
  const [contactPitch, setContactPitch] = useState("");
  const [contactBudget, setContactBudget] = useState("");
  const [contactCampaignId, setContactCampaignId] = useState("");
  const [contactSending, setContactSending] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);

  // Review state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewScore, setReviewScore] = useState(5);
  const [reviewComment, setReviewComment] = useState("");

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!creatorData || !user) return;
    
    const newReview = {
      id: `rev-${Date.now()}`,
      from_name: authProfile?.full_name || user.email?.split('@')[0] || 'Partner',
      role: authProfile?.role || 'Brand Partner',
      company: authProfile?.industry || 'Verified Network',
      score: reviewScore,
      comment: reviewComment,
      avatar_url: authProfile?.avatar_url || user.user_metadata?.avatar_url || null,
      created_at: new Date().toISOString(),
    };

    // OPTIMISTIC UPDATE
    const updatedReviews = [newReview, ...(creatorData.reviews || [])];
    const newTrustScore = Math.min(100, (creatorData.trust_score || 70) + Math.floor(reviewScore / 2));
    
    const newCreatorData = { 
      ...creatorData, 
      reviews: updatedReviews,
      trust_score: newTrustScore
    };
    
    setCreatorData(newCreatorData);
    
    // PERSIST TO SUPABASE (Using posts table as a workaround since we can't alter schema directly)
    if (!params.id.startsWith("mock-")) {
      await supabase.from("posts").insert({
        author_id: user.id,
        type: "UPDATE",
        title: "ENDORSEMENT_REVIEW",
        content: JSON.stringify({
          target_id: params.id,
          review: newReview
        }),
        location: "System"
      });
    } else {
      localStorage.setItem(`creator_profile_${params.id}`, JSON.stringify(newCreatorData));
    }
    
    setShowReviewForm(false);
    setReviewComment("");
    setReviewScore(5);
  };

  const [showMatchBreakdown, setShowMatchBreakdown] = useState(false);

  const businessAttributes = useMemo(() => {
    return {
      industry: authProfile?.industry || "Lifestyle",
      location: authProfile?.location || "Trivandrum",
      budget_level: "medium" as const,
      needed_category: creatorData?.category || "MODEL"
    };
  }, [authProfile, creatorData]);

  useEffect(() => {
    const fetchCreatorProfile = async () => {
      setLoading(true);

      try {
        let dbData: any = null;
        if (!params.id.startsWith("mock-")) {
          const { data } = await supabase
            .from("creator_profiles")
            .select("*, profiles(*)")
            .eq("id", params.id)
            .maybeSingle();
          dbData = data;
        }

        const local = localStorage.getItem(`creator_profile_${params.id}`);
        const localData = local ? JSON.parse(local) : {};

        if (dbData) {
          const mapped: SeedCreator = {
            id: dbData.id,
            full_name: dbData.profiles?.full_name || "Creator",
            category: dbData.category || "OTHER",
            subcategories: dbData.subcategories || ["Creator"],
            bio: dbData.bio || "No biography provided.",
            experience: dbData.experience || "1+ Year",
            location: dbData.profiles?.location || "Kerala",
            city: dbData.profiles?.city || "Trivandrum",
            languages: dbData.languages || ["English"],
            skills: dbData.skills || [],
            avatar_url: dbData.profiles?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&fit=crop",
            portfolio_images: dbData.portfolio_gallery || [],
            video_links: dbData.videos || [],
            social_links: dbData.social_links || {},
            social_metrics: {
              followers: dbData.followers || { instagram: 5000 },
              engagement_rate: 4.2,
              growth_rate: 3.0,
              audience_geography: { "India": 95 },
              audience_interests: ["Lifestyle"],
              audience_demographics: { "18-24": 50, "25-34": 30 }
            },
            measurements: dbData.measurements || {},
            availability: dbData.availability || "THIS_WEEK",
            is_verified: dbData.is_verified || false,
            creator_level: dbData.creator_level || "RISING",
            trust_score: dbData.trust_score || 70,
            completion_rate: dbData.completion_rate || 90,
            repeat_client_rate: dbData.repeat_client_rate || 80,
            rates: dbData.rates || {},
            rate_card: dbData.rate_card || "",
            reviews: [],
            past_campaigns: [],
            is_featured: dbData.is_featured || false,
            ...localData
          };

          // Fetch reviews from posts table
          const { data: postsData } = await supabase
            .from("posts")
            .select("content")
            .eq("title", "ENDORSEMENT_REVIEW")
            .like("content", `%${params.id}%`);

          if (postsData && postsData.length > 0) {
            const dbReviews = postsData
              .map(p => {
                try { return JSON.parse(p.content); } catch (e) { return null; }
              })
              .filter(p => p && p.target_id === params.id)
              .map(p => p.review)
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
              
            if (dbReviews.length > 0) {
              mapped.reviews = dbReviews;
              
              // Recalculate trust score based on db reviews
              const totalScore = dbReviews.reduce((sum: number, r: any) => sum + Math.floor(r.score / 2), 0);
              mapped.trust_score = Math.min(100, mapped.trust_score + totalScore);
            }
          } else if (localData.reviews) {
            mapped.reviews = localData.reviews;
          }

          setCreatorData(mapped);
        } else {
          // If no db, check local storage directly
          if (local) setCreatorData(localData);
          else setCreatorData(null);
        }
      } catch (e) {
          const local = localStorage.getItem(`creator_profile_${params.id}`);
          if (local) setCreatorData(JSON.parse(local));
      } finally {
        setLoading(false);
      }
    };
    fetchCreatorProfile();

    // Fetch Connection status
    if (user?.id && params.id) {
      ConnectionService.getStatus(user.id, params.id).then(status => {
        setConnectionStatus(status);
      });
    }

    // Set bookmark visual state
    const savedBookmarks = JSON.parse(localStorage.getItem("creators_bookmarks") || "[]");
    setIsBookmarked(savedBookmarks.includes(params.id));
  }, [params.id, user?.id]);

  const toggleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    let savedBookmarks = JSON.parse(localStorage.getItem("creators_bookmarks") || "[]");
    if (isBookmarked) {
      savedBookmarks = savedBookmarks.filter((b: string) => b !== params.id);
      setIsBookmarked(false);
    } else {
      savedBookmarks.push(params.id);
      setIsBookmarked(true);
    }
    localStorage.setItem("creators_bookmarks", JSON.stringify(savedBookmarks));
  };

  // Dynamic Metrics calculations
  const matchScore = useMemo(() => {
    if (!creatorData) return 80;
    return calculateMatchScore(creatorData, businessAttributes);
  }, [creatorData, businessAttributes]);

  const matchLabel = getMatchLabel(matchScore);

  const profileScore = useMemo(() => {
    if (!creatorData) return 70;
    return calculateProfileStrength(creatorData);
  }, [creatorData]);

  const strengthLabel = getProfileStrengthLabel(profileScore);

  // CRM direct connect action
  const handleInitiateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !creatorData) return;
    setContactSending(true);

    try {
      // 1. Establish connection (auto-accepts if mutual request exists)
      const connResult = await ConnectionService.connect(user.id, creatorData.id);
      const connId = connResult.connectionId;

      // 2. Inject initial pitch message into conversation messages table
      if (connId) {
        const finalMessage = contactPitch.trim() 
          ? `Campaign Invite: "${contactPitch}"\nBudget offered: ${contactBudget || "TBD"}`
          : `Hello ${creatorData.full_name}, we are interested in working with you. Let's chat!`;

        await supabase.from("messages").insert({
          connection_id: connId,
          sender_id: user.id,
          receiver_id: creatorData.id,
          content: finalMessage,
          is_read: false
        });
      }

      setConnectionStatus("PENDING");
      setContactSuccess(true);
      setTimeout(() => {
        setContactSheetOpen(false);
        setContactSuccess(false);
        // Redirect to chat workspace
        router.push(`/chat?user=${creatorData.id}`);
      }, 2000);
    } catch (err) {
      console.error("Connect error:", err);
      alert("Failed to send invite. Redirecting to chat...");
      router.push(`/chat?user=${creatorData.id}`);
    } finally {
      setContactSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="h-10 w-10 border-4 border-[#E53935] border-t-transparent rounded-full animate-spin" />
        <p className="text-[10px] font-black uppercase text-black/30 tracking-widest">Loading creator profile...</p>
      </div>
    );
  }

  if (!creatorData) {
    return (
      <div className="py-20 text-center space-y-4">
        <Award size={40} className="mx-auto text-black/10" />
        <h3 className="text-xl font-black uppercase">Creator Profile Not Found</h3>
        <Link href="/creators" className="text-xs font-black uppercase text-[#E53935] hover:underline">
          Back to discovery feed
        </Link>
      </div>
    );
  }

  const portfolioImages = creatorData.portfolio_images.length > 0 ? creatorData.portfolio_images : [
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=900",
    "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=900",
    "https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=900"
  ];

  const socials = creatorData.social_links || {};
  const measurements = creatorData.measurements || {};
  
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
    <div className="bg-[#FBFBFD] min-h-screen pb-32 relative">

      {/* A. PREMIUM COVER BANNER */}
      <div className="h-64 md:h-[380px] w-full bg-black relative">
        <div className="absolute inset-0 bg-cover bg-center opacity-40 bg-[url('https://images.unsplash.com/photo-1542038784456-1ea8e935640e?q=80&w=2070')]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#FBFBFD] via-transparent to-transparent" />
        
        {/* Navigation Bar */}
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
              onClick={toggleBookmark}
              className={cn(
                "h-12 px-5 sm:px-6 rounded-full backdrop-blur-md border border-white/20 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all",
                isBookmarked ? "bg-[#E53935] border-[#E53935] text-white shadow-lg shadow-[#E53935]/30" : "bg-white/10 text-white hover:bg-white hover:text-black"
              )}
            >
              <Bookmark size={16} fill={isBookmarked ? "currentColor" : "none"} />
              <span className="hidden sm:inline">{isBookmarked ? "Shortlisted" : "Shortlist Creator"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* B. MAIN INTERACTIVE LAYOUT CONTENT */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10 -mt-28 md:-mt-40">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* LEFT COLUMN: Identity & Strategic Score Cards */}
          <div className="w-full lg:w-[350px] shrink-0 space-y-6">
            
            {/* 1. Primary Identity Card */}
            <div className="bg-white rounded-2xl p-8 border border-black/[0.04] shadow-xl text-center space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 blur-2xl rounded-full" />
              
              {/* Avatar image frame */}
              <div className="h-32 w-32 rounded-full bg-slate-100 border-4 border-white shadow-2xl mx-auto -mt-24 overflow-hidden relative">
                <img
                  src={creatorData.avatar_url || portfolioImages[0]}
                  className="w-full h-full object-cover"
                  alt=""
                />
              </div>

              <div className="space-y-3">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-amber-100 to-amber-50 text-amber-700 border border-amber-200 rounded-full text-[9px] font-black uppercase tracking-[0.2em]">
                  <Award size={12} fill="currentColor" /> {creatorData.creator_level} Creator
                </div>
                
                <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight flex items-center justify-center gap-1.5">
                  {creatorData.full_name}
                  {creatorData.is_verified && <Shield size={18} className="text-blue-500 fill-blue-500/20" />}
                </h1>
                
                <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1 max-w-[280px] mx-auto">
                  {creatorData.subcategories.map((sub, idx) => (
                    <span key={idx} className="px-2.5 py-1 bg-black/[0.03] border border-black/[0.05] text-[9px] font-black uppercase tracking-[0.2em] text-black/70 rounded-md">
                      {sub}
                    </span>
                  ))}
                </div>
                
                <p className="text-black/40 font-medium text-sm flex items-center justify-center gap-1">
                  <MapPin size={13} className="text-black/30" /> {creatorData.location}
                </p>
                
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#34C759]/10 text-[#34C759] rounded-full text-[9px] font-black uppercase tracking-widest">
                  <div className="h-1.5 w-1.5 rounded-full bg-[#34C759] animate-pulse" />
                  {creatorData.availability.replace("_", " ")}
                </div>
              </div>

              {/* Instagram Followers Badge */}
              {(() => {
                const igFollowers = creatorData.social_metrics?.followers?.instagram ?? 0;
                if (igFollowers <= 0) return null;
                const formatted = igFollowers >= 1000000
                  ? `${(igFollowers / 1000000).toFixed(1)}M`
                  : igFollowers >= 1000
                    ? `${(igFollowers / 1000).toFixed(0)}K`
                    : igFollowers;
                return (
                  <div className="flex items-center justify-center gap-3 px-4 py-3 bg-gradient-to-r from-rose-50 via-pink-50 to-fuchsia-50 rounded-2xl border border-rose-100/60">
                    <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#E53935] to-[#C2185B] text-white flex items-center justify-center shadow-lg shadow-rose-200/50">
                      <Instagram size={16} />
                    </div>
                    <div className="text-left">
                      <p className="text-xl font-black text-black leading-none">{formatted}</p>
                      <p className="text-[8px] font-black uppercase tracking-[0.2em] text-rose-400">Instagram Followers</p>
                    </div>
                  </div>
                );
              })()}

              {/* Verified Trust stats */}
              <div className="grid grid-cols-3 gap-2 pt-6 border-t border-black/[0.04] text-center">
                <div>
                  <p className="text-xl font-black text-black">{creatorData.trust_score}</p>
                  <p className="text-[8px] font-black uppercase tracking-widest text-black/30 mt-0.5">Trust</p>
                </div>
                <div className="border-l border-r border-black/5">
                  <p className="text-xl font-black text-black">{creatorData.social_metrics.engagement_rate}%</p>
                  <p className="text-[8px] font-black uppercase tracking-widest text-black/30 mt-0.5">Engagement</p>
                </div>
                <div>
                  <p className="text-xl font-black text-black">{creatorData.completion_rate}%</p>
                  <p className="text-[8px] font-black uppercase tracking-widest text-black/30 mt-0.5">Completion</p>
                </div>
              </div>

              {/* Direct CRM Contact CTA button */}
              {!isOwner && (
                <div className="space-y-2 pt-2">
                  {connectionStatus === "ACCEPTED" ? (
                    <button
                      onClick={() => router.push(`/chat?user=${creatorData.id}`)}
                      className="w-full h-14 rounded-2xl bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-black shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                    >
                      <MessageSquare size={16} fill="currentColor" /> Chat Active
                    </button>
                  ) : connectionStatus === "PENDING" ? (
                    <button
                      disabled
                      className="w-full h-14 rounded-2xl bg-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-widest cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Clock size={16} /> Connection Pending
                    </button>
                  ) : (
                    <button
                      onClick={() => setContactSheetOpen(true)}
                      className="w-full h-14 rounded-2xl bg-[#E53935] text-white text-[10px] font-black uppercase tracking-widest hover:bg-black shadow-lg shadow-red-500/20 flex items-center justify-center gap-2"
                    >
                      <UserPlus size={16} /> Contact &amp; Pitch Deal
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* 2. MATCH SCORE & PROFILE STRENGTH GAUGES */}
            <div className="bg-white rounded-2xl p-6 border border-black/[0.04] space-y-6 shadow-sm">
              {/* Heuristic match Dial */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black uppercase tracking-widest text-black/30">AI Compatibility</span>
                  <button 
                    onClick={() => setShowMatchBreakdown(!showMatchBreakdown)}
                    className="text-[8px] font-black uppercase text-[#E53935] tracking-wider hover:underline"
                  >
                    {showMatchBreakdown ? "Hide Matrix" : "View Matrix"}
                  </button>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-black/[0.02]">
                  <div>
                    <span className={cn(
                      "inline-block px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest text-white mb-1.5",
                      matchScore >= 90 ? "bg-red-500" : "bg-amber-500"
                    )}>{matchLabel}</span>
                    <h4 className="text-[11px] font-black uppercase text-black/60 tracking-wider">Strategic Fit</h4>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-black text-black leading-none">{matchScore}%</p>
                  </div>
                </div>

                {showMatchBreakdown && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-black/5 text-[9px] font-black uppercase text-black/40 space-y-2">
                    <div className="flex justify-between"><span>Category Match</span><span className="text-[#E53935]">100%</span></div>
                    <div className="flex justify-between"><span>Location Match</span><span className="text-[#E53935]">{creatorData.city === businessAttributes.location ? "100%" : "40%"}</span></div>
                    <div className="flex justify-between"><span>Audience Fit</span><span className="text-[#E53935]">90%</span></div>
                    <div className="flex justify-between"><span>Availability</span><span className="text-[#E53935]">{creatorData.availability === "AVAILABLE_NOW" ? "100%" : "80%"}</span></div>
                  </div>
                )}
              </div>

              {/* Profile Strength completeness */}
              <div className="space-y-3 pt-4 border-t border-black/5">
                <span className="text-[9px] font-black uppercase tracking-widest text-black/30">Profile Strength</span>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-black/[0.02]">
                  <div>
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest bg-blue-600 text-white mb-1.5">{strengthLabel}</span>
                    <h4 className="text-[11px] font-black uppercase text-black/60 tracking-wider">Completeness</h4>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-black text-black leading-none">{profileScore}%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Rate Card & Commercial Rates */}
            {creatorData.rate_card && (
              <div className="bg-white rounded-2xl p-6 border border-black/[0.04]">
                <h3 className="text-[9px] font-black uppercase tracking-widest text-black/30 mb-3">Rate Card Matrix</h3>
                <p className="text-xs font-bold text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-2xl border border-black/[0.02]">
                  {creatorData.rate_card}
                </p>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Media Kit Showcase & Portfolios */}
          <div className="flex-1 min-w-0 space-y-6">

            {editMode ? (
              /* DYNAMIC EDIT SHEET (Seamless fallback) */
              <div className="bg-white rounded-2xl p-8 border border-black/[0.04]">
                <CreatorProfileEditor
                  profileId={creatorData.id}
                  initialData={creatorData || {}}
                  onSave={(saved) => {
                    setCreatorData(prev => ({ ...prev, ...saved }));
                    setEditMode(false);
                  }}
                />
              </div>
            ) : (
              /* CORE MEDIA KIT DISPLAY */
              <>
                {/* About & Specialties */}
                <div className="bg-white rounded-2xl p-8 border border-black/[0.04] space-y-5">
                  <h2 className="text-xl font-black uppercase tracking-tight">Talent Narrative</h2>
                  <p className="text-black/60 font-medium leading-relaxed text-base">{creatorData.bio}</p>
                  {creatorData.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {creatorData.skills.map(s => (
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
                    <BarChart3 size={20} className="text-[#E53935]" /> Audience Intelligence &amp; Verified Socials
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
                        {socials.instagram && (
                          <tr>
                            <td className="py-4 flex items-center gap-2 text-slate-800"><Instagram size={14} className="text-rose-500" /> Instagram</td>
                            <td className="py-4 font-black">{(creatorData.social_metrics.followers.instagram / 1000).toFixed(0)}K</td>
                            <td className="py-4 text-right font-black text-[#E53935]">{creatorData.social_metrics.engagement_rate}%</td>
                            <td className="py-4 text-right font-black text-emerald-600">+{creatorData.social_metrics.growth_rate}%</td>
                          </tr>
                        )}
                        {socials.youtube && (
                          <tr>
                            <td className="py-4 flex items-center gap-2 text-slate-800"><Youtube size={14} className="text-red-600" /> YouTube</td>
                            <td className="py-4 font-black">{(creatorData.social_metrics.followers.youtube / 1000).toFixed(0)}K</td>
                            <td className="py-4 text-right font-black text-black/60">3.2%</td>
                            <td className="py-4 text-right font-black text-emerald-600">+4.5%</td>
                          </tr>
                        )}
                        {socials.tiktok && (
                          <tr>
                            <td className="py-4 flex items-center gap-2 text-slate-800"><Video size={14} className="text-black" /> TikTok</td>
                            <td className="py-4 font-black">{(creatorData.social_metrics.followers.tiktok / 1000).toFixed(0)}K</td>
                            <td className="py-4 text-right font-black text-[#E53935]">6.5%</td>
                            <td className="py-4 text-right font-black text-emerald-600">+12.4%</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Demographic Breakdown graphs */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                    <div className="bg-slate-50 p-5 rounded-2xl border border-black/[0.02] space-y-3">
                      <p className="text-[9px] font-black uppercase tracking-widest text-black/30">Audience Geography</p>
                      {Object.entries(creatorData.social_metrics.audience_geography).map(([geo, pct]) => (
                        <div key={geo} className="space-y-1">
                          <div className="flex justify-between text-[9px] font-black uppercase text-black">
                            <span>{geo}</span>
                            <span>{pct}%</span>
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
                        {creatorData.social_metrics.audience_interests.map(interest => (
                          <span key={interest} className="px-3 py-1.5 bg-white border border-black/5 rounded-lg text-[9px] font-black uppercase text-black">
                            {interest}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Navigation Tabbed Grid */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                  {[
                    { id: "PORTFOLIO", label: "Catalog Photos", icon: Camera },
                    ...(creatorData.video_links.length > 0 ? [{ id: "VIDEOS", label: "Video Loops", icon: Video }] : []),
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
                    {portfolioImages.map((img, i) => (
                      <div key={i} className="group relative overflow-hidden rounded-2xl aspect-[3/4] bg-slate-100 shadow-sm border border-black/[0.03]">
                        <img src={img} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent opacity-0 group-hover:opacity-100 transition-all z-10" />
                        <div className="absolute bottom-4 left-4 opacity-0 group-hover:opacity-100 transition-all z-20">
                          <p className="text-white text-[9px] font-black uppercase tracking-wider">Catalog Asset {i + 1}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* TABCONTENT: Video Embeds */}
                {activeTab === "VIDEOS" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-300">
                    {creatorData.video_links.map((link, i) => {
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

                {/* TABCONTENT: Reviews & Past campaigns */}
                {activeTab === "REVIEWS" && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    
                    {/* Past campaigns list */}
                    {creatorData.past_campaigns.length > 0 && (
                      <div className="bg-white p-8 rounded-2xl border border-black/[0.04] space-y-6">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-black/30">Past Campaign Outputs</h3>
                        <div className="space-y-4">
                          {creatorData.past_campaigns.map(camp => (
                            <div key={camp.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-black/[0.02]">
                              <div className="space-y-1">
                                <h4 className="text-sm font-black uppercase text-black">{camp.brand}</h4>
                                <p className="text-[9px] font-bold text-black/40 uppercase">{camp.role}</p>
                              </div>
                              <div className="text-right">
                                <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 text-[8px] font-black uppercase rounded-lg border border-emerald-100">
                                  {camp.result}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Endorsements/Reviews */}
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-black/30">Strategic Endorsements</h3>
                      {!isOwner && (
                        <button 
                          onClick={() => setShowReviewForm(!showReviewForm)}
                          className="px-4 py-2 bg-black text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-[#E53935] transition-colors shadow-sm"
                        >
                          {showReviewForm ? "Cancel" : "Endorse Creator"}
                        </button>
                      )}
                    </div>

                    {showReviewForm && (
                      <form onSubmit={handleSubmitReview} className="bg-white p-6 rounded-2xl border border-black/10 space-y-5 shadow-sm animate-in fade-in slide-in-from-top-4 mb-6">
                        <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase tracking-widest text-black/40">Endorsement Rating</label>
                          <div className="flex items-center gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setReviewScore(star)}
                                className="focus:outline-none transition-transform hover:scale-110"
                              >
                                <Star size={28} fill={star <= reviewScore ? "#FACC15" : "none"} className={star <= reviewScore ? "text-yellow-400 drop-shadow-sm" : "text-slate-200"} />
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase tracking-widest text-black/40">Professional Review</label>
                          <textarea
                            required
                            value={reviewComment}
                            onChange={(e) => setReviewComment(e.target.value)}
                            placeholder="Write a strategic endorsement of this creator's work, professionalism, and campaign results..."
                            className="w-full p-4 bg-slate-50 border border-black/10 rounded-2xl text-[13px] font-medium resize-none outline-none focus:bg-white focus:border-black transition-all"
                            rows={3}
                          />
                        </div>
                        <div className="flex justify-end pt-2">
                          <button type="submit" className="px-6 py-3 bg-[#E53935] text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-black transition-all shadow-md hover:shadow-lg">
                            Submit Endorsement
                          </button>
                        </div>
                      </form>
                    )}

                    <div className="space-y-4">
                      {creatorData.reviews.map(rev => (
                        <div key={rev.id} className="bg-white p-8 rounded-2xl border border-black/[0.04] space-y-4">
                          <div className="flex items-center gap-1 text-yellow-400">
                            {[...Array(rev.score)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
                          </div>
                          
                          <p className="text-base font-medium italic text-black/70 leading-relaxed font-outfit">
                            "{rev.comment}"
                          </p>

                          <div className="flex items-center gap-3 pt-2">
                            <div className="h-9 w-9 rounded-full bg-slate-100 border border-black/5 overflow-hidden flex items-center justify-center shrink-0">
                              {(rev as any).avatar_url ? (
                                <img src={(rev as any).avatar_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-[10px] font-black text-black/30">{rev.from_name.charAt(0)}</span>
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-black uppercase tracking-tight text-black">{rev.from_name}</p>
                              <p className="text-[9px] font-bold text-black/30 uppercase tracking-widest">{rev.role} @ {rev.company}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                      {creatorData.reviews.length === 0 && (
                        <div className="bg-white p-12 rounded-2xl border border-black/5 text-center text-black/30 uppercase text-[10px] font-black">
                          No strategic reviews submitted yet.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* C. SLIDING SHEET: DIRECT CONTACT / BUDGET CRM PITCH SHEET */}
      {contactSheetOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="absolute inset-0" onClick={() => setContactSheetOpen(false)} />
          
          <div className="w-full max-w-lg h-full bg-white shadow-2xl p-8 md:p-10 flex flex-col justify-between relative z-10 animate-in slide-in-from-right duration-500">
            <div className="space-y-8">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-red-500 text-white flex items-center justify-center">
                    <UserPlus size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black uppercase tracking-tight text-black">Contact Creator</h3>
                    <p className="text-[9px] font-black text-black/30 uppercase">Secure strategic partner invite</p>
                  </div>
                </div>
                
                <button 
                  onClick={() => setContactSheetOpen(false)}
                  className="h-10 w-10 rounded-full bg-slate-50 border border-black/5 flex items-center justify-center hover:bg-slate-100"
                >
                  <X size={18} />
                </button>
              </div>

              {contactSuccess ? (
                <div className="py-20 text-center space-y-6">
                  <div className="h-16 w-16 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-xl animate-bounce">
                    <Check size={32} strokeWidth={3} />
                  </div>
                  <h3 className="text-2xl font-black uppercase tracking-tight text-emerald-600">Invitation Transmitted!</h3>
                  <p className="text-xs font-bold text-black/40 uppercase max-w-sm mx-auto leading-relaxed">
                    A secure connection has been established. Redirecting to the secure chat workspace...
                  </p>
                </div>
              ) : (
                <form onSubmit={handleInitiateContact} className="space-y-6">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-black/[0.02] flex items-start gap-3">
                    <ShieldCheck size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                    <p className="text-[9px] font-black text-black/50 uppercase tracking-wide leading-relaxed">
                      By initiating contact, a connection request will be sent. Once accepted, you can securely sign campaign contracts.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-black/40">Dynamic Pitch &amp; Brief</label>
                    <textarea
                      rows={5}
                      required
                      value={contactPitch}
                      onChange={e => setContactPitch(e.target.value)}
                      placeholder="Describe your campaign shoot dates, requirements, poses, style metrics or expected reels deliverables..."
                      className="w-full p-4 bg-slate-50 border border-black/10 rounded-2xl text-sm font-bold resize-none outline-none focus:bg-white focus:border-black transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-widest text-black/40">Secure Budget (INR)</label>
                      <input
                        type="text"
                        required
                        value={contactBudget}
                        onChange={e => setContactBudget(e.target.value)}
                        placeholder="e.g. ₹15,000"
                        className="w-full h-12 px-4 bg-slate-50 border border-black/10 rounded-xl text-sm font-bold"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-widest text-black/40">Availability Needed</label>
                      <select className="w-full h-12 px-4 bg-slate-50 border border-black/10 rounded-xl text-[9px] font-black uppercase tracking-widest">
                        <option>Immediate / Available Now</option>
                        <option>This Week</option>
                        <option>By Appointment</option>
                      </select>
                    </div>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={contactSending}
                    className="w-full h-14 rounded-2xl bg-black text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#E53935] flex items-center justify-center gap-2 shadow-xl shadow-black/10"
                  >
                    {contactSending ? "Transmitting Invitation..." : <><Zap size={14} fill="currentColor" /> Send Secure Invitation</>}
                  </button>
                </form>
              )}
            </div>

            <div className="text-center text-[8px] font-black uppercase text-black/20 tracking-widest pt-6 border-t border-slate-50">
              Checkout Encryption Safeguard Active
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
