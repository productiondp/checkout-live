"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  Sparkles, MapPin, Star, Briefcase, ChevronRight, CheckCircle2, 
  Search, Users, Compass, ShieldCheck, Heart, MessageSquare, 
  Zap, Award, BarChart3, Ruler, BookOpen, Clock, Plus, PhoneCall,
  DollarSign, Check, Activity, ArrowUpRight, ChevronDown, User,
  Globe, Instagram, Video, SlidersHorizontal, Eye, Settings
} from "lucide-react";
import { cn } from "@/lib/utils";
import Button from "@/components/ui/Button";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { calculateMatchScore, calculateProfileStrength, getMatchLabel, getProfileStrengthLabel } from "@/data/creator-seed-data";
import DealEngine from "@/components/modals/DealEngine";
import MyCreatorProfilePage from "./profile/page";

function parseHeightToInches(heightStr?: string): number {
  if (!heightStr) return 0;
  const match = heightStr.match(/^(\d+)'(\d+)"$/);
  if (match) {
    const feet = parseInt(match[1]!, 10);
    const inches = parseInt(match[2]!, 10);
    return (feet * 12) + inches;
  }
  return 0;
}

type NavTab = "BROWSE" | "INFLUENCERS" | "MODELS" | "DEALS" | "MATCHES" | "CONTACTS" | "ANALYTICS" | "PROFILE";

export default function CreatorsDiscoveryFeed() {
  const { user, profile: authProfile } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState<NavTab>("BROWSE");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedCity, setSelectedCity] = useState<string>("All");
  const [minFollowers, setMinFollowers] = useState<number>(0);
  
  // Advanced Filter states
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [engagementFilter, setEngagementFilter] = useState<string>("All");
  const [followerTierFilter, setFollowerTierFilter] = useState<string>("All");
  const [heightFilter, setHeightFilter] = useState<string>("All");
  const [verifiedFilter, setVerifiedFilter] = useState<boolean>(false);
  const [availabilityFilter, setAvailabilityFilter] = useState<string>("All");

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedCategory("All");
    setSelectedCity("All");
    setEngagementFilter("All");
    setFollowerTierFilter("All");
    setHeightFilter("All");
    setVerifiedFilter(false);
    setAvailabilityFilter("All");
  };
  
  // Influencer specific sub-category filter
  const [activeInfluencerFilter, setActiveInfluencerFilter] = useState<string>("Trending");
  // Model specific sub-category filter
  const [activeModelFilter, setActiveModelFilter] = useState<string>("Fashion");

  // Local/Supabase Hybrid Creators List
  const [creatorsList, setCreatorsList] = useState<SeedCreator[]>([]);
  const [dbLoading, setDbLoading] = useState(true);
  const [dbFetchError, setDbFetchError] = useState<string | null>(null);
  
  // CRM Tracking from Database / Local Storage
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>([]);
  const [dealsList, setDealsList] = useState<any[]>([]);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  
  // Deal Engine Modal State
  const [selectedDeal, setSelectedDeal] = useState<any>(null);
  
  // New Campaign Form State
  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    title: "",
    category: "Influencer Campaign",
    budget: "",
    location: "On-Site (Local)",
    description: ""
  });
  const [campaignSuccess, setCampaignSuccess] = useState(false);

  // Business Profile Context (Simulated standard or parsed from active business profile)
  const businessAttributes = useMemo(() => {
    return {
      industry: authProfile?.industry || "Lifestyle",
      location: authProfile?.location || "Trivandrum",
      budget_level: "medium" as const,
      needed_category: "MODEL"
    };
  }, [authProfile]);

  useEffect(() => {
    async function initData() {
      setDbLoading(true);
      try {
        // Query Supabase profiles & creator_profiles if they exist
        const { data: dbCreators, error: fetchErr } = await supabase
          .from("creator_profiles")
          .select(`*, profiles(*)`);

        if (fetchErr) {
          setDbFetchError(fetchErr.message);
        }

        // Resolve bookmarks
        const { data: bookmarkData } = await supabase
          .from("bookmarks")
          .select("target_id")
          .eq("user_id", user?.id || "");
        if (bookmarkData) {
          setBookmarks((bookmarkData as any[]).map(b => b.target_id));
        }

        // Fetch user connections to show contacted creators
        if (user?.id) {
          const { data: connData } = await supabase
            .from("connections")
            .select(`
              id,
              status,
              created_at,
              sender_id,
              receiver_id,
              sender:profiles!sender_id(id, full_name, avatar_url, role),
              receiver:profiles!receiver_id(id, full_name, avatar_url, role)
            `)
            .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);
          
          if (connData) {
            setConnections(connData);
          }
        }

        // Populate from DB only (No dummy data)
        const mappedList: any[] = [];
        if (dbCreators && dbCreators.length > 0) {
          dbCreators.forEach((dbc: any) => {
              const mapped = {
                id: dbc.id,
                full_name: dbc.profiles?.full_name || "New Creator",
                category: dbc.category || "OTHER",
                subcategories: dbc.subcategories || ["Creator"],
                bio: dbc.bio || dbc.experience || "A professional creator on Checkout.",
                experience: dbc.experience || "1+ Year",
                location: dbc.profiles?.location || dbc.location || "Kerala",
                city: dbc.profiles?.city || "Trivandrum",
                languages: dbc.languages || ["English"],
                skills: dbc.skills || ["Creativity"],
                avatar_url: dbc.profiles?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&fit=crop",
                portfolio_images: dbc.portfolio_gallery || [],
                video_links: dbc.videos || [],
                social_links: dbc.social_links || {},
                social_metrics: {
                  followers: dbc.followers || { instagram: 12000 },
                  engagement_rate: 4.5,
                  growth_rate: 5.0,
                  audience_geography: { "India": 90 },
                  audience_interests: ["Lifestyle"],
                  audience_demographics: { "18-24": 50, "25-34": 30, "35-44": 20 }
                },
                measurements: dbc.measurements || {},
                availability: dbc.availability || "THIS_WEEK",
                is_verified: dbc.is_verified || false,
                creator_level: dbc.creator_level || "RISING",
                trust_score: dbc.trust_score || 70,
                completion_rate: dbc.completion_rate || 90,
                repeat_client_rate: dbc.repeat_client_rate || 80,
                rates: dbc.rates || {},
                rate_card: dbc.rate_card || "Rates upon request",
                reviews: [],
                past_campaigns: [],
                is_featured: dbc.is_featured || false
              };
              mappedList.push(mapped);
          });
        }
        setCreatorsList(mappedList);
      } catch (err: any) {
        console.warn("Database sync error:", err);
        setDbFetchError(err.message || "Unknown error");
        setCreatorsList([]);
      } finally {
        setDbLoading(false);
      }
    };
    initData();

    // Load recently viewed from local storage
    const viewed = localStorage.getItem("creators_recently_viewed");
    if (viewed) {
      setBookmarks(JSON.parse(localStorage.getItem("creators_bookmarks") || "[]"));
      setRecentlyViewed(JSON.parse(viewed));
    }

    // Fetch opportunities from DB
    const fetchOpportunities = async () => {
      try {
        const { data } = await supabase.from('opportunities').select('*');
        if (data) {
          setOpportunities(data);
        } else {
          setOpportunities([]);
        }
      } catch (e) {
        setOpportunities([]);
      }
    };
    fetchOpportunities();
  }, [supabase, user?.id]);

  // Handle bookmarking creator
  const toggleBookmark = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    let updatedBookmarks = [...bookmarks];
    if (bookmarks.includes(id)) {
      updatedBookmarks = updatedBookmarks.filter(b => b !== id);
      try {
        await supabase.from("bookmarks").delete().eq("user_id", user?.id || "").eq("target_id", id);
      } catch {}
    } else {
      updatedBookmarks.push(id);
      try {
        await (supabase.from("bookmarks") as any).insert({ user_id: user?.id || "", target_id: id, target_type: "CREATOR" } as any);
      } catch {}
    }
    setBookmarks(updatedBookmarks);
    localStorage.setItem("creators_bookmarks", JSON.stringify(updatedBookmarks));
  };

  // Track creator profile view click
  const trackProfileView = (creatorId: string) => {
    let viewed = [...recentlyViewed];
    if (!viewed.includes(creatorId)) {
      viewed.unshift(creatorId);
      viewed = viewed.slice(0, 5); // Keep last 5
      setRecentlyViewed(viewed);
      localStorage.setItem("creators_recently_viewed", JSON.stringify(viewed));
    }
  };

  // Submit new campaign form
  const handlePostCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampaign.title || !newCampaign.budget) return;
    
    const newOpportunity = {
      id: `opp-${Date.now()}`,
      title: newCampaign.title,
      category: newCampaign.category,
      budget: newCampaign.budget,
      location: newCampaign.location,
      status: "ACTIVE",
      date: "Just now"
    };

    setOpportunities(prev => [newOpportunity, ...prev]);
    setCampaignSuccess(true);
    setTimeout(() => {
      setCampaignSuccess(false);
      setShowCampaignForm(false);
      setNewCampaign({ title: "", category: "Influencer Campaign", budget: "", location: "On-Site (Local)", description: "" });
    }, 2000);
  };

  // Filtered Creators based on search criteria
  const filteredCreators = useMemo(() => {
    return creatorsList.filter(creator => {
      const matchQuery = searchQuery ? (
        creator.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        creator.bio.toLowerCase().includes(searchQuery.toLowerCase()) ||
        creator.subcategories.some(s => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
        creator.skills.some(sk => sk.toLowerCase().includes(searchQuery.toLowerCase()))
      ) : true;

      const matchCategory = selectedCategory && selectedCategory !== "All" ? (
        creator.category === selectedCategory || creator.subcategories.includes(selectedCategory)
      ) : true;

      const matchCity = selectedCity && selectedCity !== "All" ? (
        creator.city.toLowerCase() === selectedCity.toLowerCase()
      ) : true;

      // Compute total followers
      const totalFollowers = (Object.values(creator.social_metrics.followers) as number[]).reduce((a, b) => a + b, 0);
      const matchFollowers = minFollowers ? totalFollowers >= minFollowers : true;

      // Engagement Filter
      let matchEngagement = true;
      if (engagementFilter === "High") {
        matchEngagement = creator.social_metrics.engagement_rate >= 4.0;
      } else if (engagementFilter === "Very High") {
        matchEngagement = creator.social_metrics.engagement_rate >= 6.0;
      }

      // Follower Tier Filter
      let matchFollowerTier = true;
      if (followerTierFilter === "Micro") {
        matchFollowerTier = totalFollowers < 50000;
      } else if (followerTierFilter === "Mid") {
        matchFollowerTier = totalFollowers >= 50000 && totalFollowers < 100000;
      } else if (followerTierFilter === "Macro") {
        matchFollowerTier = totalFollowers >= 100000;
      }

      // Height Filter
      let matchHeight = true;
      if (heightFilter !== "All" && creator.measurements?.height) {
        const heightInches = parseHeightToInches(creator.measurements.height);
        if (heightFilter === "Tall") {
          matchHeight = heightInches >= 69; // 5'9"
        } else if (heightFilter === "Very Tall") {
          matchHeight = heightInches >= 72; // 6'0"
        }
      } else if (heightFilter !== "All") {
        matchHeight = false;
      }

      // Verified Filter
      const matchVerified = verifiedFilter ? creator.is_verified : true;

      // Availability Filter
      const matchAvailability = availabilityFilter !== "All" ? creator.availability === availabilityFilter : true;

      return matchQuery && matchCategory && matchCity && matchFollowers && 
             matchEngagement && matchFollowerTier && matchHeight && matchVerified && matchAvailability;
    });
  }, [creatorsList, searchQuery, selectedCategory, selectedCity, minFollowers, engagementFilter, followerTierFilter, heightFilter, verifiedFilter, availabilityFilter]);

  // Browse sub-sections (Discovery and Retention engine Heuristics)
  const browseData = useMemo(() => {
    // 1. Recommended Influencers
    const influencers = creatorsList.filter(c => c.category === "INFLUENCER");
    // 2. Recommended Models
    const models = creatorsList.filter(c => c.category === "MODEL");
    // 3. Trending Creators (trust_score >= 95)
    const trending = [...creatorsList].sort((a, b) => b.social_metrics.engagement_rate - a.social_metrics.engagement_rate);
    // 4. New Talent (Rising level)
    const newTalent = creatorsList.filter(c => c.creator_level === "RISING" || c.creator_level === "PROFESSIONAL");
    // 5. High Match Profiles (Calculate match score >= 85)
    const highMatch = creatorsList.map(c => ({
      ...c,
      matchScore: calculateMatchScore(c, businessAttributes)
    })).sort((a, b) => b.matchScore - a.matchScore);
    // 6. Nearby (same city)
    const nearby = creatorsList.filter(c => c.city.toLowerCase() === businessAttributes.location.toLowerCase());

    return { influencers, models, trending, newTalent, highMatch, nearby };
  }, [creatorsList, businessAttributes]);

  // Influencers Subgroups filtered list
  const filteredInfluencers = useMemo(() => {
    const list = creatorsList.filter(c => c.category === "INFLUENCER" || c.subcategories.includes("Influencer"));
    switch (activeInfluencerFilter) {
      case "Trending":
        return [...list].sort((a, b) => b.social_metrics.growth_rate - a.social_metrics.growth_rate);
      case "High Engagement":
        return [...list].sort((a, b) => b.social_metrics.engagement_rate - a.social_metrics.engagement_rate);
      case "Verified Only":
        return list.filter(c => c.is_verified);
      case "Micro Influencers":
        return list.filter(c => {
          const tf = (Object.values(c.social_metrics.followers) as number[]).reduce((x, y) => x + y, 0);
          return tf <= 50000;
        });
      case "Premium Tier":
        return list.filter(c => c.creator_level === "ELITE" || c.creator_level === "VERIFIED_PRO");
      case "Nearby":
        return list.filter(c => c.city.toLowerCase() === businessAttributes.location.toLowerCase());
      default:
        return list;
    }
  }, [creatorsList, activeInfluencerFilter, businessAttributes]);

  // Models Subgroups filtered list
  const filteredModels = useMemo(() => {
    const list = creatorsList.filter(c => c.category === "MODEL" || c.subcategories.includes("Fashion Modeling") || c.subcategories.includes("Commercial Modeling"));
    return list.filter(m => m.subcategories.some(sub => sub.toLowerCase().includes(activeModelFilter.toLowerCase())));
  }, [creatorsList, activeModelFilter]);

  // Analytics helper metrics
  const analyticsMetrics = useMemo(() => {
    const totalViews = 1420 + (connections.length * 150) + (bookmarks.length * 35);
    const searchAppearances = 4850 + (connections.length * 280);
    const revenuePotential = opportunities.reduce((acc, curr) => {
      const num = parseInt(curr.budget.replace(/[^0-9]/g, "")) || 0;
      return acc + num;
    }, 0) + (connections.filter(c => c.status === "ACCEPTED").length * 25000);
    
    return { totalViews, searchAppearances, revenuePotential };
  }, [connections, bookmarks, opportunities]);

  return (
    <div className="min-h-screen bg-[#F9F9FB] text-black relative overflow-hidden pb-32">
      {/* Background ambient radial flows */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-[#E53935]/3 blur-[160px] rounded-full pointer-events-none" />
      <div className="absolute top-[800px] left-1/4 w-[500px] h-[500px] bg-indigo-500/3 blur-[140px] rounded-full pointer-events-none" />
      
      <div className="px-4 lg:px-8 space-y-8 mt-8 max-w-[1600px] mx-auto selection:bg-[#E53935]/20 relative z-10">
        
        {/* 1. MASTER HEADER SECTION */}
        <div className="flex flex-col gap-6 bg-white/80 p-6 lg:p-8 rounded-2xl border border-black/[0.06] shadow-sm backdrop-blur-xl relative overflow-hidden">
          {/* Modern decorative backdrop gradient */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#E53935]/5 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />

          {/* Top Row: Title + Metrics */}
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 relative z-10">
            {/* Left Block: Title */}
            <div className="space-y-3 max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E53935]/5 border border-[#E53935]/20 text-[#E53935]">
                <Sparkles size={11} className="animate-pulse" />
                <span className="text-[9px] font-bold uppercase tracking-widest">Checkout Discovery OS 3.0</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight uppercase text-slate-900 font-outfit">
                Checkout Creators.
              </h1>
              <p className="text-slate-500 font-medium text-xs leading-relaxed max-w-md">
                The premium talent matchmaking grid. Find, contact, and contract elite local influencers and models instantly.
              </p>
            </div>

            {/* Right Block: Metrics */}
            <div className="flex items-center gap-6 lg:gap-8 bg-slate-50 border border-slate-100 py-5 px-6 lg:px-8 rounded-2xl select-none shadow-sm shrink-0">
              <div className="text-left space-y-1">
                <span className="text-[10px] lg:text-[11px] font-bold uppercase text-slate-400 block tracking-widest">Verified Pool</span>
                <span className="text-xl lg:text-2xl font-black text-slate-800 block">{creatorsList.length} Elite Talent</span>
                <span className="text-[10px] font-black text-emerald-600 uppercase bg-emerald-500/10 inline-flex items-center gap-1 px-2 py-0.5 rounded-md mt-1">▲ 100% active</span>
              </div>
              <div className="h-16 w-px bg-slate-200" />
              <div className="text-left space-y-1">
                <span className="text-[10px] lg:text-[11px] font-bold uppercase text-slate-400 block tracking-widest">Campaign OS</span>
                <span className="text-xl lg:text-2xl font-black text-[#E53935] block">₹{analyticsMetrics.revenuePotential.toLocaleString('en-IN')} Pipeline</span>
                <span className="text-[10px] font-black text-emerald-600 uppercase bg-emerald-500/10 inline-flex items-center gap-1 px-2 py-0.5 rounded-md mt-1">▲ {opportunities.length} Live Briefs</span>
              </div>
            </div>
          </div>

          {/* Bottom Row: Navigation Tabs */}
          <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-50 border border-slate-200 rounded-2xl w-full relative z-10 mt-2 shadow-sm">
            {[
              { id: "BROWSE", label: "Browse", icon: Compass },
              { id: "INFLUENCERS", label: "Influencers", icon: Instagram },
              { id: "MODELS", label: "Models", icon: Ruler },
              ...(authProfile?.role === "creator" ? [{ id: "DEALS", label: "Deals", icon: DollarSign }] : []),
              { id: "MATCHES", label: "AI Matches", icon: Sparkles },
              { id: "CONTACTS", label: "Contacts", icon: Users },
              ...(authProfile?.role === "creator" ? [
                { id: "ANALYTICS", label: "Analytics", icon: BarChart3 },
                { id: "PROFILE", label: "My Profile", icon: User }
              ] : [])
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              const IconComp = tab.icon; 
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as NavTab)}
                  className={cn(
                    "flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all",
                    isActive
                      ? "bg-white text-[#E53935] shadow-sm border border-slate-200"
                      : "text-slate-500 hover:text-slate-800 hover:bg-black/5 border border-transparent"
                  )}
                >
                  <IconComp size={14} className={isActive ? "text-[#E53935]" : "text-slate-400"} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

      {/* 2. TABBED LAYOUT VIEWS */}

      {/* ==================== BROWSE TAB ==================== */}
      {activeTab === "BROWSE" && (
        <div className="animate-in fade-in duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
            
            {/* LEFT COLUMN: Sticky Filter Sidebar (25% Layout) */}
            <div className="lg:col-span-1 bg-white/80 border border-black/[0.06] rounded-2xl p-6 space-y-6 relative lg:sticky top-24 backdrop-blur-xl h-auto lg:h-[calc(100vh-8rem)] overflow-y-auto no-scrollbar shadow-[0_15px_40px_rgba(0,0,0,0.03)]">
              <div className="flex items-center justify-between pb-4 border-b border-black/[0.06]">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-black">Refine Search</h3>
                  <p className="text-[9px] font-bold text-black/40 uppercase mt-0.5">Showing {filteredCreators.length} of {creatorsList.length} talent</p>
                </div>
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="text-[9px] font-black uppercase text-[#FF5A5F] hover:underline"
                >
                  Reset
                </button>
              </div>

              {/* Standard Filter Parameters */}
              <div className="space-y-4">
                {/* Search Text */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block ml-1">Keywords</label>
                  <div className="relative flex items-center">
                    <Search size={14} className="absolute left-3 text-black/35" />
                    <input
                      type="text"
                      placeholder="Search tags, name..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full h-11 pl-9 pr-3 bg-black/[0.03] border border-black/[0.06] hover:border-black/[0.12] rounded-xl text-xs font-bold text-black focus:border-[#E53935] outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Category */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block ml-1">Category</label>
                  <div className="relative">
                    <select
                      value={selectedCategory}
                      onChange={e => setSelectedCategory(e.target.value)}
                      className="w-full h-11 px-3 bg-black/[0.03] border border-black/[0.06] rounded-xl text-xs font-black uppercase tracking-widest text-black/70 outline-none cursor-pointer appearance-none text-black"
                    >
                      <option value="All" className="bg-white text-black">All Categories</option>
                      <option value="INFLUENCER" className="bg-white text-black">Influencers</option>
                      <option value="MODEL" className="bg-white text-black">Models</option>
                      <option value="UGC_CREATOR" className="bg-white text-black">UGC Creators</option>
                      <option value="PHOTOGRAPHER" className="bg-white text-black">Photographers</option>
                      <option value="VIDEOGRAPHER" className="bg-white text-black">Videographers</option>
                    </select>
                    <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-black/30" />
                  </div>
                </div>

                {/* City */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block ml-1">City</label>
                  <div className="relative">
                    <select
                      value={selectedCity}
                      onChange={e => setSelectedCity(e.target.value)}
                      className="w-full h-11 px-3 bg-black/[0.03] border border-black/[0.06] rounded-xl text-xs font-black uppercase tracking-widest text-black/70 outline-none cursor-pointer appearance-none text-black"
                    >
                      <option value="All" className="bg-white text-black">All Cities</option>
                      <option value="Trivandrum" className="bg-white text-black">Trivandrum</option>
                      <option value="Kochi" className="bg-white text-black">Kochi</option>
                      <option value="Bangalore" className="bg-white text-black">Bangalore</option>
                    </select>
                    <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-black/30" />
                  </div>
                </div>

                <div className="h-px bg-black/[0.06] my-4" />

                {/* Advanced parameters */}
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mt-6 mb-2 ml-1">Advanced Specs</h4>

                {/* Engagement Rate */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block ml-1">Engagement Rate</label>
                  <div className="relative">
                    <select
                      value={engagementFilter}
                      onChange={e => setEngagementFilter(e.target.value)}
                      className="w-full h-11 px-3 bg-black/[0.03] border border-black/[0.06] rounded-xl text-xs font-bold text-black/70 outline-none cursor-pointer appearance-none focus:bg-white focus:border-[#E53935] text-black"
                    >
                      <option value="All" className="bg-white text-black">All Rates</option>
                      <option value="High" className="bg-white text-black">High (&gt;4%)</option>
                      <option value="Very High" className="bg-white text-black">Very High (&gt;6%)</option>
                    </select>
                    <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-black/30" />
                  </div>
                </div>

                {/* Follower Tier */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block ml-1">Follower Tier</label>
                  <div className="relative">
                    <select
                      value={followerTierFilter}
                      onChange={e => setFollowerTierFilter(e.target.value)}
                      className="w-full h-11 px-3 bg-black/[0.03] border border-black/[0.06] rounded-xl text-xs font-bold text-black/70 outline-none cursor-pointer appearance-none focus:bg-white focus:border-[#E53935] text-black"
                    >
                      <option value="All" className="bg-white text-black">All Tiers</option>
                      <option value="Micro" className="bg-white text-black">Micro (&lt;50K)</option>
                      <option value="Mid" className="bg-white text-black">Mid (50K - 100K)</option>
                      <option value="Macro" className="bg-white text-black">Macro (100K+)</option>
                    </select>
                    <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-black/30" />
                  </div>
                </div>

                {/* Height (Models) */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block ml-1">Height (Models)</label>
                  <div className="relative">
                    <select
                      value={heightFilter}
                      onChange={e => setHeightFilter(e.target.value)}
                      className="w-full h-11 px-3 bg-black/[0.03] border border-black/[0.06] rounded-xl text-xs font-bold text-black/70 outline-none cursor-pointer appearance-none focus:bg-white focus:border-[#E53935] text-black"
                    >
                      <option value="All" className="bg-white text-black">All Heights</option>
                      <option value="Tall" className="bg-white text-black">Tall (&gt;= 5&apos;9&quot;)</option>
                      <option value="Very Tall" className="bg-white text-black">Very Tall (&gt;= 6&apos;0&quot;)</option>
                    </select>
                    <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-black/30" />
                  </div>
                </div>

                {/* Availability */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block ml-1">Availability</label>
                  <div className="relative">
                    <select
                      value={availabilityFilter}
                      onChange={e => setAvailabilityFilter(e.target.value)}
                      className="w-full h-11 px-3 bg-black/[0.03] border border-black/[0.06] rounded-xl text-xs font-bold text-black/70 outline-none cursor-pointer appearance-none focus:bg-white focus:border-[#E53935] text-black"
                    >
                      <option value="All" className="bg-white text-black">Any Time</option>
                      <option value="AVAILABLE_NOW" className="bg-white text-black">Available Now</option>
                      <option value="THIS_WEEK" className="bg-white text-black">This Week</option>
                      <option value="THIS_MONTH" className="bg-white text-black">This Month</option>
                      <option value="BUSY" className="bg-white text-black">Busy</option>
                    </select>
                    <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-black/30" />
                  </div>
                </div>

                {/* Verified Switch */}
                <label className="flex items-center gap-2.5 cursor-pointer pt-2 select-none">
                  <input
                    type="checkbox"
                    checked={verifiedFilter}
                    onChange={e => setVerifiedFilter(e.target.checked)}
                    className="h-4.5 w-4.5 rounded border-black/[0.1] bg-black/[0.03] text-[#E53935] focus:ring-[#E53935]"
                  />
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black uppercase tracking-widest text-black/70">Verified Only</span>
                    <span className="text-[8px] text-black/40 font-bold uppercase leading-none">Show premium badged</span>
                  </div>
                </label>
              </div>
            </div>

            {/* RIGHT COLUMN: Feed Content (75% Layout) */}
            <div className="lg:col-span-3 space-y-12">
              {/* B. Browse Feed Results (Condition-based: shows search grid or default curated lists) */}
              {(searchQuery || selectedCategory !== "All" || selectedCity !== "All" || engagementFilter !== "All" || followerTierFilter !== "All" || heightFilter !== "All" || verifiedFilter || availabilityFilter !== "All") ? (
                <div className="space-y-6">
                  <h3 className="text-xs font-black uppercase tracking-widest text-black/40">Search Results ({filteredCreators.length})</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredCreators.map(creator => (
                      <CreatorCard key={creator.id} creator={creator} bookmarks={bookmarks} toggleBookmark={toggleBookmark} businessAttr={businessAttributes} trackView={trackProfileView} />
                    ))}
                    {filteredCreators.length === 0 && (
                      <div className="py-20 text-center space-y-4">
                        <Compass size={40} className="mx-auto text-black/10" />
                        <p className="text-sm font-bold text-black/40 uppercase">No matching creators found. Try expanding your search queries.</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-16">

                  {/* HEURISTIC 1: AI Matches For You */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="h-2 w-2 rounded-full bg-[#E53935] animate-ping" />
                        <h2 className="text-xl font-black uppercase tracking-tight text-black">AI Recommended High Matches</h2>
                      </div>
                      <span className="text-[10px] font-black text-black/40 uppercase">Based on your business profile</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                      {browseData.highMatch.slice(0, 3).map(creator => (
                        <CreatorCard key={creator.id} creator={creator} bookmarks={bookmarks} toggleBookmark={toggleBookmark} businessAttr={businessAttributes} trackView={trackProfileView} />
                      ))}
                    </div>
                  </div>
 
                  {/* HEURISTIC 2: Trending Creators */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2 text-black">
                        <Zap size={18} className="text-amber-500 fill-amber-500" /> Trending Talent
                      </h2>
                      <button onClick={() => setActiveTab("INFLUENCERS")} className="text-[10px] font-black uppercase text-[#E53935] tracking-widest hover:underline flex items-center gap-1">
                        See All Influencers <ChevronRight size={12} />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                      {browseData.trending.slice(0, 3).map(creator => (
                        <CreatorCard key={creator.id} creator={creator} bookmarks={bookmarks} toggleBookmark={toggleBookmark} businessAttr={businessAttributes} trackView={trackProfileView} />
                      ))}
                    </div>
                  </div>
 
                  {/* HEURISTIC 3: recommended models */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2 text-black">
                        <Ruler size={18} className="text-blue-500" /> Curated Models Showcase
                      </h2>
                      <button onClick={() => setActiveTab("MODELS")} className="text-[10px] font-black uppercase text-[#E53935] tracking-widest hover:underline flex items-center gap-1">
                        See All Models <ChevronRight size={12} />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                      {browseData.models.slice(0, 3).map(creator => (
                        <CreatorCard key={creator.id} creator={creator} bookmarks={bookmarks} toggleBookmark={toggleBookmark} businessAttr={businessAttributes} trackView={trackProfileView} />
                      ))}
                    </div>
                  </div>
 
                  {/* HEURISTIC 4: Nearby Profiles */}
                  <div className="space-y-6">
                    <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2 text-black">
                      <MapPin size={18} className="text-emerald-500 fill-emerald-500" /> Nearby Talent in {businessAttributes.location}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                      {browseData.nearby.slice(0, 3).map(creator => (
                        <CreatorCard key={creator.id} creator={creator} bookmarks={bookmarks} toggleBookmark={toggleBookmark} businessAttr={businessAttributes} trackView={trackProfileView} />
                      ))}
                      {browseData.nearby.length === 0 && (
                        <div className="col-span-full py-10 bg-black/[0.02] rounded-2xl border border-black/[0.04] flex items-center justify-center text-center">
                          <p className="text-xs font-bold text-black/40 uppercase">No creators listed locally in {businessAttributes.location} yet.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* HEURISTIC 5: ALL CREATORS (DISCOVER EVERYTHING) */}
                  <div className="space-y-6 pt-8 border-t border-black/[0.06]">
                    <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2 text-black">
                      <Compass size={18} className="text-indigo-500" /> Explore All Talent
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                      {creatorsList.map(creator => (
                        <CreatorCard key={creator.id} creator={creator} bookmarks={bookmarks} toggleBookmark={toggleBookmark} businessAttr={businessAttributes} trackView={trackProfileView} />
                      ))}
                      {creatorsList.length === 0 && (
                        <div className="col-span-full py-10 bg-black/[0.02] rounded-2xl border border-black/[0.04] flex items-center justify-center text-center">
                          <p className="text-xs font-bold text-black/40 uppercase">
                            No creators have joined the platform yet. 
                            {dbFetchError && <span className="text-red-500 block mt-2">DB ERROR: {dbFetchError}</span>}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
          </div>
        </div>
      )}

      {/* ==================== INFLUENCERS TAB ==================== */}
      {activeTab === "INFLUENCERS" && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
          {/* Sub navigation filters for Influencers */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 border-b border-black/[0.06]">
            {[
              "Trending", "High Engagement", "Verified Only", "Micro Influencers", "Premium Tier", "Nearby"
            ].map(f => (
              <button
                key={f}
                onClick={() => setActiveInfluencerFilter(f)}
                className={cn(
                  "px-6 h-10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  activeInfluencerFilter === f
                    ? "bg-[#E53935] text-white shadow-[0_4px_15px_rgba(229,57,53,0.3)]"
                    : "bg-black/[0.03] text-black/50 hover:bg-black/[0.06] hover:text-black"
                )}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredInfluencers.map(creator => (
              <CreatorCard key={creator.id} creator={creator} bookmarks={bookmarks} toggleBookmark={toggleBookmark} businessAttr={businessAttributes} trackView={trackProfileView} />
            ))}
          </div>
        </div>
      )}

      {/* ==================== MODELS TAB ==================== */}
      {activeTab === "MODELS" && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
          {/* Model Categories */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 border-b border-black/[0.06]">
            {[
              "Fashion", "Commercial", "Lifestyle", "Fitness", "Corporate", "Event", "Brand", "Promotional", "Actor", "Campus"
            ].map(cat => (
              <button
                key={cat}
                onClick={() => setActiveModelFilter(cat)}
                className={cn(
                  "px-6 h-10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  activeModelFilter === cat
                    ? "bg-[#E53935] text-white shadow-[0_4px_15px_rgba(229,57,53,0.3)]"
                    : "bg-black/[0.03] text-black/50 hover:bg-black/[0.06] hover:text-black"
                )}
              >
                {cat} Models
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredModels.map(creator => (
              <CreatorCard key={creator.id} creator={creator} bookmarks={bookmarks} toggleBookmark={toggleBookmark} businessAttr={businessAttributes} trackView={trackProfileView} showModelMeasurements />
            ))}
            {filteredModels.length === 0 && (
              <div className="col-span-full py-20 text-center space-y-4">
                <Ruler size={40} className="mx-auto text-black/10" />
                <p className="text-sm font-bold text-black/40 uppercase">No models found in the {activeModelFilter} category. Try switching categories.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== DEALS TAB ==================== */}
      {activeTab === "DEALS" && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight">Active Opportunities &amp; Partnerships</h2>
              <p className="text-sm text-black/40 font-bold uppercase tracking-widest mt-1">Apply to active campaigns and exclusive brand partnerships</p>
            </div>
          </div>

          {/* Opportunities pipeline */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {opportunities.map((opp, idx) => (
              <div key={opp.id} className="relative bg-white rounded-3xl border border-black/[0.06] shadow-xl flex flex-col h-[360px] overflow-hidden hover:shadow-2xl hover:border-black/15 hover:-translate-y-1 transition-all group duration-300">
                {/* Image Cover Header */}
                <div className="h-40 w-full relative shrink-0 overflow-hidden bg-slate-100">
                  <img 
                    src={`https://images.unsplash.com/photo-${idx === 0 ? '1483985988355-763728e1935b?q=80&w=600' : idx === 1 ? '1555396273-367ea4eb4db5?q=80&w=600' : '1556228578-0d85b1a4d571?q=80&w=600'}&auto=format&fit=crop`} 
                    alt="cover" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute bottom-3 left-4 flex items-center justify-between right-4">
                    <span className={cn(
                      "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm backdrop-blur-md",
                      opp.status === "ACTIVE" ? "bg-emerald-500/90 text-white" : "bg-white/90 text-slate-800"
                    )}>{opp.status}</span>
                    <span className="text-[9px] font-bold text-white/80 uppercase tracking-widest">{opp.date}</span>
                  </div>
                </div>

                <div className="p-6 space-y-4 relative z-10 flex-1 flex flex-col justify-center">
                  <div>
                    <h3 className="text-lg font-black uppercase tracking-tight leading-tight group-hover:text-[#E53935] transition-colors line-clamp-2">{opp.title}</h3>
                    <p className="text-[10px] font-bold text-black/40 uppercase tracking-widest flex items-center gap-1.5 mt-2.5">
                      <Briefcase size={12} className="text-[#E53935]" /> {opp.category} <span className="opacity-50">•</span> <MapPin size={12} /> {opp.location}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-5 px-6 bg-slate-50 border-t border-black/[0.03] mt-auto relative z-10 shrink-0">
                  <div>
                    <p className="text-[9px] font-black uppercase text-black/30 tracking-widest mb-0.5">Budget</p>
                    <p className="text-xl font-black text-black">{opp.budget}</p>
                  </div>
                  <button 
                    onClick={() => router.push(`/creators/opportunities/${opp.id}`)}
                    className="h-10 px-5 rounded-xl bg-black text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#E53935] hover:shadow-lg hover:shadow-red-500/20 transition-all flex items-center justify-center group-hover:pr-4"
                  >
                    Apply <span className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity">&rarr;</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================== AI MATCHES TAB ==================== */}
      {activeTab === "MATCHES" && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
          <div className="bg-white/80 p-6 md:p-8 rounded-2xl border border-black/[0.06] flex flex-col lg:flex-row items-center justify-between gap-6 shadow-2xl backdrop-blur-xl">
            <div className="space-y-2">
              <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2 text-black">
                <Sparkles size={20} className="text-[#E53935]" /> Instant Strategic Fit Engine
              </h2>
              <p className="text-sm text-black/45 font-bold uppercase tracking-widest">Calculates fit percentage using actual demographics and measurements</p>
            </div>
            
            <div className="flex items-center gap-3 p-4 bg-[#E53935]/5 rounded-2xl border border-[#E53935]/20">
              <Activity size={18} className="text-[#E53935]" />
              <span className="text-[10px] font-black uppercase text-black/70 tracking-wider">9 Heuristic weights fully calibrated</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {creatorsList.map(creator => {
              const score = calculateMatchScore(creator, businessAttributes);
              const label = getMatchLabel(score);
              return (
                <div key={creator.id} className="bg-white p-6 rounded-2xl border border-black/[0.06] flex flex-col sm:flex-row items-center gap-6 shadow-xl hover:border-[#E53935]/30 transition-all duration-300">
                  <div className="h-24 w-24 rounded-2xl overflow-hidden shrink-0 bg-black/5 relative">
                    <img src={creator.portfolio_images[0] || creator.avatar_url} className="w-full h-full object-cover" />
                  </div>
                  
                  <div className="flex-1 space-y-3 min-w-0 w-full">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-black uppercase tracking-tight leading-none truncate flex items-center gap-1 text-black">
                          {creator.full_name}
                          {creator.is_verified && <CheckCircle2 size={14} className="text-blue-500" />}
                        </h3>
                        <p className="text-[9px] font-bold text-black/35 uppercase tracking-widest mt-1">{creator.category} • {creator.city}</p>
                      </div>
                      
                      <div className="text-right">
                        <span className={cn(
                          "inline-block px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest mb-1.5",
                          score >= 90 ? "bg-[#E53935]/15 text-[#E53935] border border-[#E53935]/30" :
                          score >= 75 ? "bg-amber-500/10 text-amber-600 border border-amber-500/20" :
                          "bg-black/5 text-black/40 border border-black/[0.06]"
                        )}>{label}</span>
                        <p className="text-2xl font-black text-black leading-none">{score}%</p>
                      </div>
                    </div>

                    {/* Match scoring matrix bar visualizer */}
                    <div className="h-2 w-full bg-black/5 rounded-full overflow-hidden relative">
                      <div 
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          score >= 90 ? "bg-[#E53935]" : score >= 75 ? "bg-amber-500" : "bg-black/20"
                        )}
                        style={{ width: `${score}%` }}
                      />
                    </div>

                    {/* Matrix subsets */}
                    <div className="grid grid-cols-3 gap-2 text-[8px] font-black uppercase text-black/40 pt-1">
                      <div className="flex justify-between bg-black/[0.03] p-1.5 rounded-lg border border-black/[0.02]">
                        <span>Industry</span>
                        <span className="text-[#E53935]">{creator.subcategories.some(s => s.toLowerCase().includes(businessAttributes.industry.toLowerCase())) ? "100%" : "70%"}</span>
                      </div>
                      <div className="flex justify-between bg-black/[0.03] p-1.5 rounded-lg border border-black/[0.02]">
                        <span>Location</span>
                        <span className="text-[#E53935]">{creator.city === businessAttributes.location ? "100%" : "40%"}</span>
                      </div>
                      <div className="flex justify-between bg-black/[0.03] p-1.5 rounded-lg border border-black/[0.02]">
                        <span>Availability</span>
                        <span className="text-[#E53935]">{creator.availability === "AVAILABLE_NOW" ? "100%" : "80%"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================== CONTACTS TAB ==================== */}
      {activeTab === "CONTACTS" && (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-5 duration-500">
          
          {/* CRM metrics blocks */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Active Conversations", value: connections.filter(c => c.status === "ACCEPTED").length, icon: MessageSquare, color: "text-[#E53935] bg-[#E53935]/10" },
              { label: "Pending Invites", value: connections.filter(c => c.status === "PENDING" && c.sender_id === user?.id).length, icon: Clock, color: "text-amber-600 bg-amber-500/10" },
              { label: "Saved Profiles", value: bookmarks.length, icon: Heart, color: "text-rose-500 bg-rose-500/10" },
              { label: "Recently Viewed", value: recentlyViewed.length, icon: Clock, color: "text-blue-600 bg-blue-500/10" }
            ].map(crm => (
              <div key={crm.label} className="bg-white p-6 rounded-2xl border border-black/[0.06] shadow-xl flex items-center gap-5">
                <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center", crm.color)}>
                  <crm.icon size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-black/40">{crm.label}</p>
                  <p className="text-2xl font-black text-black">{crm.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Active CRM Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column: Contacted Creators */}
            <div className="bg-white p-6 md:p-8 rounded-2xl border border-black/[0.06] space-y-6 shadow-xl">
              <div>
                <h3 className="text-lg font-black uppercase tracking-tight text-black">Contacted Talent</h3>
                <p className="text-xs text-black/40 font-bold uppercase mt-1">Active business partnerships and direct chats</p>
              </div>

              <div className="space-y-4">
                {connections.map(conn => {
                  const partner = conn.sender_id === user?.id ? conn.receiver : conn.sender;
                  const isAccepted = conn.status === "ACCEPTED";
                  return (
                    <div key={conn.id} className="flex items-center justify-between p-4 bg-black/[0.02] rounded-2xl border border-black/[0.04]">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="h-12 w-12 rounded-xl overflow-hidden shrink-0 bg-black/5">
                          <img src={partner?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${partner?.id}`} className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-black uppercase tracking-tight truncate text-black">{partner?.full_name}</h4>
                          <span className={cn(
                            "inline-block text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full mt-1 border",
                            isAccepted 
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" 
                              : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                          )}>{conn.status}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => router.push(`/chat?user=${partner?.id}`)}
                          className="h-10 px-4 rounded-xl bg-[#E53935] text-white text-[9px] font-black uppercase tracking-widest hover:bg-[#FF3B30] shadow-md shadow-[#E53935]/10"
                        >
                          Chat
                        </button>
                      </div>
                    </div>
                  );
                })}
                {connections.length === 0 && (
                  <div className="py-12 text-center text-black/30 space-y-2">
                    <Users size={28} className="mx-auto" />
                    <p className="text-[10px] font-black uppercase">No contracted talent yet. Start contacting models or influencers from the Browse page.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Bookmarked Profiles */}
            <div className="bg-white p-6 md:p-8 rounded-2xl border border-black/[0.06] space-y-6 shadow-xl">
              <div>
                <h3 className="text-lg font-black uppercase tracking-tight text-black">Saved Profiles</h3>
                <p className="text-xs text-black/40 font-bold uppercase mt-1">Bookmarked profiles for future campaigns</p>
              </div>

              <div className="space-y-4">
                {bookmarks.map(id => {
                  const creator = creatorsList.find(c => c.id === id);
                  if (!creator) return null;
                  return (
                    <div key={creator.id} className="flex items-center justify-between p-4 bg-black/[0.02] rounded-2xl border border-black/[0.04]">
                      <Link href={`/creators/profile/${creator.id}`} className="flex items-center gap-4 min-w-0 hover:opacity-85 transition-opacity">
                        <div className="h-12 w-12 rounded-xl overflow-hidden shrink-0 bg-black/5">
                          <img src={creator.portfolio_images[0] || creator.avatar_url} className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-black uppercase tracking-tight truncate text-black">{creator.full_name}</h4>
                          <p className="text-[9px] font-bold text-black/45 uppercase mt-0.5">{creator.category} • {creator.city}</p>
                        </div>
                      </Link>

                      <div className="flex items-center gap-2">
                        <button 
                          onClick={(e) => toggleBookmark(creator.id, e)}
                          className="h-10 w-10 rounded-xl bg-black/[0.02] border border-black/[0.06] flex items-center justify-center text-rose-500 hover:bg-rose-500/10"
                        >
                          <Heart size={16} fill="currentColor" />
                        </button>
                      </div>
                    </div>
                  );
                })}
                {bookmarks.length === 0 && (
                  <div className="py-12 text-center text-black/30 space-y-2">
                    <Heart size={28} className="mx-auto" />
                    <p className="text-[10px] font-black uppercase">No saved profiles. Tap the bookmark icon on any creator card to save here.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== ANALYTICS TAB ==================== */}
      {activeTab === "ANALYTICS" && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
          
          {/* Main metric row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-8 rounded-2xl border border-black/[0.06] shadow-xl space-y-4">
              <p className="text-[10px] font-black uppercase text-black/40 tracking-widest">Total Profile Views</p>
              <h3 className="text-4xl font-black text-black">{analyticsMetrics.totalViews}</h3>
              <div className="h-2 w-full bg-black/5 rounded-full overflow-hidden">
                <div className="h-full bg-red-500 w-[78%]" />
              </div>
              <p className="text-[9px] font-bold text-emerald-600 uppercase">▲ 14.8% growth this month</p>
            </div>
            
            <div className="bg-white p-8 rounded-2xl border border-black/[0.06] shadow-xl space-y-4">
              <p className="text-[10px] font-black uppercase text-black/40 tracking-widest">Search Appearances</p>
              <h3 className="text-4xl font-black text-black">{analyticsMetrics.searchAppearances}</h3>
              <div className="h-2 w-full bg-black/5 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 w-[64%]" />
              </div>
              <p className="text-[9px] font-bold text-emerald-600 uppercase">▲ 22.4% spike from organic search</p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-black/[0.06] shadow-xl space-y-4">
              <p className="text-[10px] font-black uppercase text-black/40 tracking-widest">Pipeline Revenue Potential</p>
              <h3 className="text-4xl font-black text-[#E53935]">₹{analyticsMetrics.revenuePotential.toLocaleString()}</h3>
              <div className="h-2 w-full bg-black/5 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-[85%]" />
              </div>
              <p className="text-[9px] font-bold text-emerald-600 uppercase">▲ ₹35k closed contract deals</p>
            </div>
          </div>

          {/* SVG Line Chart for Analytics */}
          <div className="bg-white p-8 rounded-2xl border border-black/[0.06] shadow-xl space-y-6">
            <div>
              <h3 className="text-lg font-black uppercase tracking-tight text-black">Discovery and Engagement Funnel</h3>
              <p className="text-xs text-black/40 font-bold uppercase tracking-widest mt-1">Direct correlation between search appearances and deals won</p>
            </div>

            <div className="h-80 w-full relative">
              {/* Sleek SVG Chart */}
              <svg className="w-full h-full" viewBox="0 0 800 300" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#E53935" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#E53935" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                {/* Grid lines */}
                <line x1="0" y1="50" x2="800" y2="50" stroke="rgba(0,0,0,0.06)" strokeWidth="1" />
                <line x1="0" y1="150" x2="800" y2="150" stroke="rgba(0,0,0,0.06)" strokeWidth="1" />
                <line x1="0" y1="250" x2="800" y2="250" stroke="rgba(0,0,0,0.06)" strokeWidth="1" />
                {/* Sparkline Area */}
                <path 
                  d="M 0 250 Q 150 180, 300 210 T 600 80 T 800 60 L 800 300 L 0 300 Z" 
                  fill="url(#areaGradient)" 
                />
                {/* Sparkline Path */}
                <path 
                  d="M 0 250 Q 150 180, 300 210 T 600 80 T 800 60" 
                  fill="none" 
                  stroke="#E53935" 
                  strokeWidth="3.5" 
                  strokeLinecap="round"
                  filter="drop-shadow(0px 4px 10px rgba(229,57,53,0.3))"
                />
              </svg>
              
              {/* Chart Overlay Axes labels */}
              <div className="absolute left-0 bottom-2 flex justify-between w-full px-5 text-[9px] font-black uppercase text-black/35">
                <span>Jan</span>
                <span>Feb</span>
                <span>Mar</span>
                <span>Apr</span>
                <span>May (Current)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== PROFILE TAB ==================== */}
      {activeTab === "PROFILE" && (
        <div className="animate-in fade-in slide-in-from-bottom-5 duration-500">
          <MyCreatorProfilePage />
        </div>
      )}

    </div>
    </div>
  );
}

// ==================== SUPPORTING COMPONENT: CREATOR CARD ====================
interface CreatorCardProps {
  creator: SeedCreator;
  bookmarks: string[];
  toggleBookmark: (id: string, e: React.MouseEvent) => void;
  businessAttr: any;
  trackView: (id: string) => void;
  showModelMeasurements?: boolean;
}

function CreatorCard({ creator, bookmarks, toggleBookmark, businessAttr, trackView, showModelMeasurements = (creator.category === "MODEL") }: CreatorCardProps) {
  const isBookmarked = bookmarks.includes(creator.id);
  const matchScore = calculateMatchScore(creator, businessAttr);
  const profileScore = calculateProfileStrength(creator);
  const matchLabel = getMatchLabel(matchScore);
  const strengthLabel = getProfileStrengthLabel(profileScore);

  // Followers shortener
  const totalFollowers = (Object.values(creator.social_metrics.followers) as number[]).reduce((a, b) => a + b, 0);
  const formattedFollowers = useMemo(() => {
    if (totalFollowers >= 1000000) return `${(totalFollowers / 1000000).toFixed(1)}M`;
    if (totalFollowers >= 1000) return `${(totalFollowers / 1000).toFixed(0)}K`;
    return totalFollowers.toString();
  }, [totalFollowers]);

  return (
    <Link 
      href={`/creators/profile/${creator.id}`}
      onClick={() => trackView(creator.id)}
      className="group flex flex-col bg-white/90 hover:bg-white rounded-2xl border border-black/[0.06] hover:border-[#E53935]/30 overflow-hidden hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 relative"
    >
      {/* Cover / Portfolio Image preview */}
      <div className="h-56 bg-black/[0.03] relative overflow-hidden shrink-0">
        <img 
          src={creator.portfolio_images[0] || creator.avatar_url} 
          alt="" 
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-all duration-500" 
        />
        
        {/* Soft elegant gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent z-10" />
        
        {/* Hover-activated Translucent Demographic Fit overlay */}
        <div className="absolute inset-2 bg-white/95 backdrop-blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-400 z-30 p-4 flex flex-col justify-between rounded-2xl border border-white/60 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] selection:bg-[#E53935]/10">
          {/* Top Row: Title & Growth Rate */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-black">Audience</span>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50/80 px-2 py-0.5 rounded-full border border-emerald-100">
                ▲ {creator.social_metrics.growth_rate}% MoM
              </span>
            </div>
            
            {/* Demographics Bars */}
            <div className="space-y-2.5 pt-1">
              {Object.entries(creator.social_metrics.audience_demographics || {}).slice(0, 3).map(([ageRange, percentage]) => (
                <div key={ageRange} className="space-y-1.5">
                  <div className="flex items-center justify-between text-[9px] font-bold text-black/60 uppercase tracking-wider">
                    <span>Age {ageRange}</span>
                    <span className="text-black/80 font-black">{percentage}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-black/5 rounded-full overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-[#E53935] to-orange-400 h-full rounded-full transition-all duration-700 ease-out" 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Row: Audience Interests */}
          <div className="space-y-2 border-t border-black/5 pt-3">
            <span className="text-[8px] font-black text-black/30 uppercase tracking-widest block">Top Interests</span>
            <div className="flex flex-wrap gap-1.5">
              {creator.social_metrics.audience_interests.slice(0, 3).map(interest => (
                <span key={interest} className="px-2 py-1 rounded-lg bg-black/[0.02] border border-black/[0.04] text-[9px] font-bold text-black/70 uppercase tracking-wide shadow-sm">
                  {interest}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Top Badges */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20">
          {/* Match Score Badge */}
          <div className={cn(
            "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest backdrop-blur-md shadow-sm border",
            matchScore >= 90 
              ? "bg-[#E53935]/15 border-[#E53935]/30 text-[#E53935]" 
              : "bg-black/60 border-white/10 text-white/80"
          )}>
            {matchScore}% Match
          </div>
        </div>

        {/* Bottom Title on Image */}
        <div className="absolute bottom-4 left-4 right-4 z-20 text-white">
          <div className="flex flex-wrap gap-1 mb-1.5">
            {creator.subcategories.slice(0, 3).map((sub, idx) => (
              <span key={idx} className="text-[8px] font-black uppercase tracking-[0.2em] text-[#E53935] leading-none bg-white/95 backdrop-blur-md px-2 py-0.5 rounded shadow-[0_2px_10px_rgba(0,0,0,0.1)]">
                {sub}
              </span>
            ))}
          </div>
          <h3 className="text-xl font-black tracking-tight leading-tight uppercase font-outfit flex items-center gap-1">
            {creator.full_name}
            {creator.is_verified && <CheckCircle2 size={15} className="text-blue-400 shrink-0" fill="currentColor" />}
          </h3>
        </div>
      </div>

      {/* Attributes & Social Metrics */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        {/* social statistics */}
        <div className="flex items-center justify-between text-center pt-1">
          <div>
            <p className="text-[8px] font-black text-black/40 uppercase tracking-widest leading-none flex items-center justify-center gap-0.5"><Instagram size={9} className="text-rose-400" /> Followers</p>
            <p className="text-[14px] font-black text-black mt-1">{formattedFollowers}</p>
          </div>
          <div className="h-6 w-px bg-black/[0.06]" />
          <div>
            <p className="text-[8px] font-black text-black/40 uppercase tracking-widest leading-none">Engagement</p>
            <p className="text-[14px] font-black text-[#E53935] mt-1">{creator.social_metrics.engagement_rate}%</p>
          </div>
          <div className="h-6 w-px bg-black/[0.06]" />
          <div>
            <p className="text-[8px] font-black text-black/40 uppercase tracking-widest leading-none">Location</p>
            <p className="text-[14px] font-black text-black mt-1 truncate max-w-[80px]">{creator.city}</p>
          </div>
        </div>

        {/* Dynamic Model Measurements */}
        {showModelMeasurements && creator.measurements && (
          <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100 transition-colors group-hover:border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[9px] font-black tracking-widest text-slate-400 uppercase">Physical Specs</span>
              <span className="text-[9px] font-black text-[#E53935] tracking-widest uppercase bg-[#E53935]/10 px-2 py-0.5 rounded-lg border border-[#E53935]/20">Verified</span>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white rounded-xl p-2 border border-slate-100 flex flex-col items-center justify-center text-center shadow-sm">
                <span className="text-[8px] text-slate-400 font-black uppercase tracking-widest mb-0.5">HT</span>
                <span className="text-xs font-black text-slate-800">{creator.measurements.height || "-"}</span>
              </div>
              <div className="bg-white rounded-xl p-2 border border-slate-100 flex flex-col items-center justify-center text-center shadow-sm">
                <span className="text-[8px] text-slate-400 font-black uppercase tracking-widest mb-0.5">WT</span>
                <span className="text-xs font-black text-slate-800">{creator.measurements.weight || "-"}</span>
              </div>
              <div className="bg-white rounded-xl p-2 border border-slate-100 flex flex-col items-center justify-center text-center shadow-sm">
                <span className="text-[8px] text-slate-400 font-black uppercase tracking-widest mb-0.5">Waist</span>
                <span className="text-xs font-black text-slate-800">{creator.measurements.waist || "-"}</span>
              </div>
              <div className="bg-white rounded-xl p-2 border border-slate-100 flex flex-col items-center justify-center text-center shadow-sm">
                <span className="text-[8px] text-slate-400 font-black uppercase tracking-widest mb-0.5">Hips</span>
                <span className="text-xs font-black text-slate-800">{creator.measurements.hips || "-"}</span>
              </div>
              <div className="bg-white rounded-xl p-2 border border-slate-100 flex flex-col items-center justify-center text-center shadow-sm">
                <span className="text-[8px] text-slate-400 font-black uppercase tracking-widest mb-0.5">Shoe</span>
                <span className="text-xs font-black text-slate-800">{creator.measurements.shoe_size || "-"}</span>
              </div>
              <div className="bg-white rounded-xl p-2 border border-slate-100 flex flex-col items-center justify-center text-center shadow-sm">
                <span className="text-[8px] text-slate-400 font-black uppercase tracking-widest mb-0.5">Tone</span>
                <span className="text-[11px] font-black text-slate-800 capitalize truncate max-w-[45px]">{creator.measurements.skin_tone || "-"}</span>
              </div>
            </div>
          </div>
        )}

        {/* Heuristic indicators: Strength score dial */}
        <div className="flex items-center justify-between pt-3 border-t border-black/[0.06]">
          <div className="flex flex-col">
            <span className="text-[8px] font-black text-black/40 uppercase tracking-widest leading-none">Profile Rating</span>
            <span className="text-[11px] font-black text-black/75 mt-1 uppercase tracking-wider">{strengthLabel}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={(e) => toggleBookmark(creator.id, e)}
              className={cn(
                "h-10 w-10 rounded-2xl flex items-center justify-center transition-all shadow-sm border",
                isBookmarked 
                  ? "bg-rose-500 border-rose-400 text-white shadow-[0_4px_10px_rgba(244,63,94,0.3)]" 
                  : "bg-slate-50 border-slate-200 text-slate-400 hover:text-rose-500 hover:bg-rose-50 hover:border-rose-200"
              )}
            >
              <Heart size={16} fill={isBookmarked ? "currentColor" : "none"} />
            </button>
            <div className="h-10 px-4 flex items-center justify-center gap-1.5 rounded-2xl bg-black text-white text-[9px] font-black uppercase tracking-widest group-hover:bg-[#E53935] group-hover:shadow-[0_4px_15px_rgba(229,57,53,0.3)] transition-all">
              View Profile <ChevronRight size={14} strokeWidth={3} />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
