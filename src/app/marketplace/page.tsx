"use client";
import React, { useState, useEffect, useMemo } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { 
  Search, 
  MapPin, 
  Zap, 
  Target, 
  ShieldCheck, 
  X, 
  ChevronRight,
  Briefcase,
  Layers,
  BarChart3,
  Sparkles,
  ArrowRight,
  Clock,
  MessageSquare,
  CheckCircle2,
  Users,
  LayoutGrid,
  List,
  ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import TerminalLayout from "@/components/layout/TerminalLayout";
import MeetupPreviewModal from "@/components/modals/MeetupPreviewModal";
import MomentumView from "@/components/modals/MomentumView";
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

type MarketplaceType = "All" | "REQUIREMENT" | "PARTNERSHIP" | "MEETUP" | "PARTNER";

interface MarketplaceItem {
  id: string;
  title: string;
  type: MarketplaceType;
  description: string;
  location: string;
  industry: string;
  focus_area: string;
  experience_level: string;
  signals: string[];
  relevanceScore: number;
  created_at: string;
  author: {
    id: string;
    name: string;
    avatar: string;
    role: string;
    isVerified?: boolean;
    trustScore?: number;
  };
  metadata?: any;
  status?: string;
}

const TYPE_FILTERS: { label: string; value: MarketplaceType; icon: any }[] = [
  { label: "All", value: "All", icon: LayoutGrid },
  { label: "Requirements", value: "REQUIREMENT", icon: Target },
  { label: "Partners", value: "PARTNERSHIP", icon: Zap },
  { label: "Meetups", value: "MEETUP", icon: Users },
];

export default function MarketplacePage() {
  return (
    <ProtectedRoute>
      <MarketplaceContent />
    </ProtectedRoute>
  );
}

function MarketplaceContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeType, setActiveType] = useState<MarketplaceType>("All");
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dismissedTopOp, setDismissedTopOp] = useState(false);
  
  const [viewMode, setViewMode] = useState<"list" | "grid" | "map">("list");
  
  // Smart Filters State
  const [filters, setFilters] = useState({
    industry: "All",
    focus: "All",
    experience: "All",
    location: "Nearby"
  });

  const [activeFilterDropdown, setActiveFilterDropdown] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<{ id: string, type: string } | null>(null);

  const router = useRouter();
  const supabase = createClient();
  const { user } = useAuth();

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      setIsLoading(true);
      
      try {
        // Fetch all relevant posts from ecosystem
        const { data: postsData, error: postsError } = await supabase
          .from('posts')
          .select(`*, profiles(id, full_name, avatar_url, role)`)
          .neq('author_id', user.id)
          .order('created_at', { ascending: false });

        if (postsError) throw postsError;

        // Fetch user connections to show Chat buttons
        const { data: connectionsData } = await supabase
          .from('connections')
          .select('sender_id, receiver_id')
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .eq('status', 'ACCEPTED');

        const connectedUserIds = new Set((connectionsData || []).map(c => 
          c.sender_id === user.id ? c.receiver_id : c.sender_id
        ));

        const unified: MarketplaceItem[] = (postsData || []).map(p => {
          // Normalize type
          const rawType = p.type?.toUpperCase() || 'REQUIREMENT';
          let normalizedType: MarketplaceType = 'REQUIREMENT';
          if (rawType === 'MEETUP') normalizedType = 'MEETUP';
          if (rawType === 'PARTNERSHIP' || rawType === 'PARTNER') normalizedType = 'PARTNERSHIP';
          
          return {
            id: p.id,
            title: p.title || "Untitled Opportunity",
            type: normalizedType,
            description: p.content || "",
            location: p.location || "Remote",
            industry: p.industry || p.metadata?.industry || "Tech",
            focus_area: p.metadata?.focus_area || "General",
            experience_level: p.metadata?.experience_level || "Any",
            signals: p.tier === 1 ? ["Top opportunity", "Best match"] : ["New"],
            relevanceScore: p.actionScore || 0.5,
            created_at: p.created_at,
            author: {
              id: p.profiles?.id,
              name: p.profiles?.full_name || "Member",
              avatar: p.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.profiles?.id}`,
              role: p.profiles?.role || "Professional",
              isVerified: !!p.profiles?.full_name
            },
            metadata: p.metadata,
            status: 'IDLE',
            isConnected: connectedUserIds.has(p.profiles?.id)
          } as any;
        });

        // Auto-sort by Relevance + Match
        setItems(unified.sort((a, b) => b.relevanceScore - a.relevanceScore));
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [user?.id]);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           item.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = activeType === "All" || item.type === activeType;
      const matchesIndustry = filters.industry === "All" || item.industry === filters.industry;
      const matchesFocus = filters.focus === "All" || item.focus_area === filters.focus;
      
      return matchesSearch && matchesType && matchesIndustry && matchesFocus;
    });
  }, [items, searchQuery, activeType, filters]);

  const topOpportunity = useMemo(() => {
    if (dismissedTopOp) return null;
    return filteredItems.find(item => item.signals.includes("Top opportunity"));
  }, [filteredItems, dismissedTopOp]);

  const otherItems = useMemo(() => {
    return filteredItems.filter(item => item.id !== topOpportunity?.id);
  }, [filteredItems, topOpportunity]);

  return (
    <TerminalLayout
      topbarChildren={
        <div className="flex items-center justify-end gap-2 lg:gap-4 flex-1 overflow-x-auto no-scrollbar py-2">
          {/* COMPACT PILL SWITCHER */}
          <div className="flex items-center gap-1 p-1 bg-[#F5F5F7] rounded-full border border-black/[0.03] shadow-inner shrink-0">
            {TYPE_FILTERS.map(f => (
              <button 
                key={f.value}
                onClick={() => setActiveType(f.value)}
                className={cn(
                  "px-4 lg:px-6 h-8 lg:h-9 rounded-full text-[9px] lg:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2",
                  activeType === f.value 
                    ? "bg-white text-black shadow-md shadow-black/5" 
                    : "text-black/30 hover:text-black/60"
                )}
              >
                <f.icon size={12} className={cn("transition-colors", activeType === f.value ? "text-[#E53935]" : "text-black/20")} />
                {f.label}
              </button>
            ))}
          </div>

          <div className="h-6 w-px bg-black/[0.05] shrink-0 hidden md:block" />

          {/* VIEW SWITCHER */}
          <div className="flex items-center gap-1 p-1 bg-black/[0.02] rounded-xl shrink-0">
            {[
              { id: 'list', icon: List },
              { id: 'grid', icon: LayoutGrid },
              { id: 'map', icon: MapPin }
            ].map(mode => (
              <button 
                key={mode.id}
                onClick={() => setViewMode(mode.id as any)}
                className={cn(
                  "h-8 w-8 rounded-lg flex items-center justify-center transition-all",
                  viewMode === mode.id ? "bg-white text-black shadow-sm" : "text-black/20 hover:text-black"
                )}
              >
                 <mode.icon size={15} />
              </button>
            ))}
          </div>
        </div>
      }
    >
      <div className="bg-[#FDFDFF] min-h-screen flex flex-col">
        {/* SECOND ROW: SMART FILTERS & VIEW SWITCHER */}
        <div className="bg-white border-b border-black/[0.03] px-4 md:px-8 py-3 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto flex items-center justify-end gap-4">
             <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-1 lg:pb-0">
                <SmartFilter 
                  icon={Briefcase} 
                  label="Industry" 
                  value={filters.industry} 
                  options={["All", "Tech", "Creative", "Finance", "Healthcare"]}
                  onChange={(val: string) => setFilters(prev => ({ ...prev, industry: val }))}
                  active={activeFilterDropdown === "industry"}
                  onToggle={() => setActiveFilterDropdown(activeFilterDropdown === "industry" ? null : "industry")}
                />
                <SmartFilter 
                  icon={Layers} 
                  label="Focus Area" 
                  value={filters.focus} 
                  options={["All", "General", "Strategy", "Execution", "Design"]}
                  onChange={(val: string) => setFilters(prev => ({ ...prev, focus: val }))}
                  active={activeFilterDropdown === "focus"}
                  onToggle={() => setActiveFilterDropdown(activeFilterDropdown === "focus" ? null : "focus")}
                />
                <SmartFilter 
                  icon={MapPin} 
                  label="Location" 
                  value={filters.location} 
                  options={["Nearby", "Global", "City"]}
                  onChange={(val: string) => setFilters(prev => ({ ...prev, location: val }))}
                  active={activeFilterDropdown === "location"}
                  onToggle={() => setActiveFilterDropdown(activeFilterDropdown === "location" ? null : "location")}
                  isLocation 
                />
             </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row relative overflow-hidden">
          {/* FEED COLUMN */}
          <div className={cn(
            "flex-1 overflow-y-auto no-scrollbar transition-all duration-500",
            viewMode === "map" ? "lg:w-1/2" : "w-full"
          )}>
            <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-10 md:space-y-12">
              
              {/* PRIORITY SECTION */}
              <AnimatePresence>
                {topOpportunity && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] text-[#E53935] flex items-center gap-2">
                        <Sparkles size={14} className="animate-pulse" /> Top opportunity for you
                      </h3>
                      <button onClick={() => setDismissedTopOp(true)} className="text-[9px] font-bold text-black/20 hover:text-black uppercase">Dismiss</button>
                    </div>
                    <OpportunityCard item={topOpportunity} isPinned />
                  </motion.div>
                )}
              </AnimatePresence>
 
              {/* LIST FEED */}
              <div className="space-y-6">
                <h3 className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] text-black/20">
                  {activeType === "All" ? "Ecosystem Feed" : `${activeType} Opportunities`}
                </h3>
 
                {isLoading ? (
                  <div className={cn("space-y-4", (viewMode === "grid" || viewMode === "map") && "grid grid-cols-1 md:grid-cols-3 gap-6 space-y-0")}>
                    {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-48 bg-black/[0.02] rounded-[2rem] animate-pulse" />)}
                  </div>
                ) : otherItems.length > 0 ? (
                  <div className={cn(
                    "transition-all duration-500",
                    viewMode === "list" ? "space-y-4 md:space-y-6" : 
                    viewMode === "map" ? "grid grid-cols-1 md:grid-cols-2 gap-6" :
                    "grid grid-cols-1 md:grid-cols-3 gap-6"
                  )}>
                    {otherItems.map((item, idx) => (
                      <OpportunityCard key={item.id} item={item} index={idx} viewMode={viewMode === 'list' ? 'list' : 'grid'} />
                    ))}
                  </div>
                ) : (
                  <div className="py-20 md:py-32 text-center space-y-4">
                    <div className="h-16 w-16 bg-[#F5F5F7] rounded-2xl flex items-center justify-center mx-auto text-black/10">
                      <Target size={32} />
                    </div>
                    <p className="text-[13px] font-bold text-black/40">No results here. Try changing filters.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* MAP COLUMN (Conditional) */}
          <AnimatePresence>
            {viewMode === "map" && (
              <motion.div 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="hidden lg:block lg:w-1/2 h-[calc(100vh-160px)] sticky top-[64px] border-l border-black/[0.03] bg-black overflow-hidden"
              >
                <MarketplaceMiniMap items={filteredItems} onSelectPost={setSelectedPost} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <MomentumView 
          isOpen={!!selectedPost} 
          onClose={() => setSelectedPost(null)}
          postId={selectedPost?.id}
          type={selectedPost?.type as any}
        />
      </div>
    </TerminalLayout>
  );
}

function MarketplaceMiniMap({ items, onSelectPost }: { items: MarketplaceItem[], onSelectPost: (post: any) => void }) {
  const mapContainer = React.useRef<HTMLDivElement>(null);
  const map = React.useRef<any>(null);
  const markersRef = React.useRef<maplibregl.Marker[]>([]);

  React.useEffect(() => {
    if (!mapContainer.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
      center: [76.9467, 8.5241], // Trivandrum
      zoom: 12,
      attributionControl: false
    });

    return () => map.current?.remove();
  }, []);

  React.useEffect(() => {
    if (!map.current) return;

    // Clear markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    items.forEach(item => {
      // Simulate/Use geo
      const lat = item.metadata?.geo?.lat || (8.5241 + (Math.random() - 0.5) * 0.05);
      const lng = item.metadata?.geo?.lng || (76.9467 + (Math.random() - 0.5) * 0.05);

      const el = document.createElement('div');
      el.className = 'marketplace-marker';
      
      const rawType = item.type.toUpperCase();
      const isReq = rawType === 'REQUIREMENT';
      const isEvent = rawType === 'MEETUP';
      
      const color = isReq ? '#FF9500' : isEvent ? '#FF3B30' : '#34C759';
      const icon = isReq ? '🎯' : isEvent ? '🔥' : '👤';
      
      const shapeStyle = isEvent 
        ? `clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);` 
        : isReq 
        ? `transform: rotate(45deg); border-radius: 8px;` 
        : `border-radius: 9999px;`;

      const innerContentStyle = isReq ? `transform: rotate(-45deg);` : "";

      const hasRealAvatar = item.author.avatar && item.author.avatar.length > 20;
      const iconHtml = hasRealAvatar 
        ? `<div class="h-full w-full overflow-hidden border-2 border-white shadow-xl bg-white" style="${shapeStyle} box-shadow: 0 0 15px ${color}80">
             <img src="${item.author.avatar}" class="h-full w-full object-cover" style="${innerContentStyle}" />
           </div>`
        : `<div class="h-full w-full border-2 border-white flex items-center justify-center text-white shadow-xl transition-all" style="background-color: ${color}; box-shadow: 0 0 15px ${color}80; ${shapeStyle}">
             <span style="${innerContentStyle}" class="text-[14px]">${icon}</span>
           </div>`;

      el.innerHTML = `
        <div class="relative group cursor-pointer h-9 w-9 transition-all hover:scale-125 z-10">
          ${iconHtml}
          <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-20">
            <div class="bg-black/90 backdrop-blur-md px-3 py-1.5 rounded-lg whitespace-nowrap shadow-2xl border border-white/10">
              <p class="text-[9px] font-black uppercase text-white">${item.title}</p>
              <p class="text-[7px] font-bold text-white/40 uppercase tracking-widest">${item.author.name}</p>
            </div>
          </div>
        </div>
      `;

      el.style.pointerEvents = 'auto';
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        onSelectPost({ id: item.id, type: item.type });
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([lng, lat])
        .addTo(map.current);
        
      markersRef.current.push(marker);
    });
  }, [items]);

  return (
    <div ref={mapContainer} className="w-full h-full">
      <style>{`
        .maplibregl-marker {
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}

function SmartFilter({ icon: Icon, label, value, options, onChange, active, onToggle }: any) {
  return (
    <div className="relative">
      <button 
        onClick={onToggle}
        className={cn(
          "flex items-center gap-2.5 px-4 h-9 md:h-10 border rounded-xl transition-all group shrink-0",
          active ? "bg-white border-black/[0.1] shadow-sm" : "bg-[#F5F5F7] border-black/[0.03] hover:bg-white hover:border-black/[0.08]"
        )}
      >
        <Icon size={14} className={cn("transition-colors", active ? "text-[#E53935]" : "text-black/20 group-hover:text-[#E53935]")} />
        <span className="hidden sm:inline text-[10px] font-bold text-black/40 group-hover:text-black">{label}:</span>
        <span className="text-[10px] font-black uppercase text-black">{value}</span>
        <ChevronDown size={12} className={cn("ml-1 transition-transform duration-300 text-black/20", active && "rotate-180")} />
      </button>

      <AnimatePresence>
        {active && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-full mt-2 left-0 w-48 bg-white border border-black/[0.08] rounded-xl shadow-xl z-[60] overflow-hidden"
          >
            {options.map((opt: string) => (
              <button
                key={opt}
                onClick={() => { onChange(opt); onToggle(); }}
                className={cn(
                  "w-full px-4 h-10 text-left text-[10px] font-black uppercase tracking-widest hover:bg-[#F5F5F7] transition-all",
                  value === opt ? "text-[#E53935]" : "text-black/40"
                )}
              >
                {opt}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function OpportunityCard({ item, isPinned, index, viewMode }: { item: MarketplaceItem; isPinned?: boolean; index?: number; viewMode?: "list" | "grid" }) {
  const router = useRouter();
  const { user: authUser } = useAuth();
  const { setOverlayChatId, setOverlayOpen } = useChatStore();
  const [joinStatus, setJoinStatus] = useState<any>('IDLE');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    if (item.type === 'MEETUP' && authUser) {
      const fetchStatus = async () => {
        const { MeetupService } = await import("@/services/meetup-service");
        const status = await MeetupService.getMeetupStatus(item.id, authUser.id);
        setJoinStatus(status.status);
      };
      fetchStatus();
    }
  }, [item.id, authUser?.id, item.type]);

  const getCTA = () => {
    if ((item as any).isConnected) return { label: 'Chat', color: 'bg-emerald-600 text-white hover:bg-black' };
    switch(item.type) {
      case 'REQUIREMENT': return { label: 'Respond', color: 'bg-black text-white hover:bg-[#E53935]' };
      case 'PARTNER': 
      case 'PARTNERSHIP': return { label: 'Start Building', color: 'bg-[#E53935] text-white hover:bg-black' };
      case 'MEETUP': return { label: 'Join Meetup', color: 'bg-indigo-600 text-white hover:bg-black' };
      default: return { label: 'View', color: 'bg-black text-white' };
    }
  };

  const cta = getCTA();

  if (viewMode === "list") {
    return (
      <motion.div 
        initial={!isPinned ? { opacity: 0, y: 20 } : {}}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index ? index * 0.05 : 0 }}
        onClick={() => router.push(`/marketplace/${item.id}`)}
        className={cn(
          "bg-white rounded-[2rem] p-6 md:p-8 border border-black/[0.03] shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer group flex flex-col md:flex-row md:items-center gap-6 md:gap-8 relative overflow-hidden",
          isPinned && "border-[#E53935]/20 shadow-[0_40px_80px_-20px_rgba(229,57,51,0.08)] ring-1 ring-[#E53935]/10"
        )}
      >
        <div className="h-20 w-20 md:h-28 md:w-28 shrink-0 rounded-2xl overflow-hidden border-4 border-[#F5F5F7] shadow-md group-hover:rotate-3 transition-all duration-500">
          <img src={item.author.avatar} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" alt="" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-3">
            <span className={cn(
              "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
              item.type === 'REQUIREMENT' ? "bg-amber-50 text-amber-600 border-amber-100" :
              item.type === 'PARTNER' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
              "bg-indigo-50 text-indigo-600 border-indigo-100"
            )}>
              {item.type}
            </span>
            <div className="flex gap-2">
               {item.signals.slice(0, 2).map(s => (
                 <span key={s} className="text-[9px] font-black text-[#E53935] uppercase tracking-wider flex items-center gap-1">
                    <Zap size={10} fill="currentColor" /> {s}
                 </span>
               ))}
            </div>
          </div>
          
          <h3 className="text-lg md:text-xl font-black text-[#1D1D1F] uppercase font-outfit mb-1 group-hover:text-[#E53935] transition-colors line-clamp-1">{item.title}</h3>
          <p className="text-[9px] md:text-[10px] font-black text-black/20 uppercase tracking-widest mb-4">
            {item.author.name}  {item.industry}  
            <span 
              onClick={(e) => {
                e.stopPropagation();
                if (item.metadata?.geo) {
                  router.push(`/map?lat=${item.metadata.geo.lat}&lng=${item.metadata.geo.lng}`);
                } else {
                  router.push(`/map?search=${encodeURIComponent(item.location || "Trivandrum")}`);
                }
              }}
              className="hover:text-[#E53935] cursor-pointer transition-colors ml-2"
            >
              {item.location}
            </span>
          </p>
          
          <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
            <p className="text-[13px] font-bold text-black/60 line-clamp-1 flex-1">
              {item.description}
            </p>
            <div className="flex items-center gap-4 shrink-0 border-t md:border-t-0 md:border-l border-black/[0.03] pt-4 md:pt-0 md:pl-6">
               <span className="text-[9px] font-black text-black/20 uppercase tracking-widest flex items-center gap-1.5">
                  <Clock size={12} className="text-[#E53935]" /> {item.type === 'MEETUP' ? 'Upcoming' : 'New'}
               </span>
               {item.type === 'MEETUP' && (
                 <span className="text-[9px] font-black text-black/20 uppercase tracking-widest flex items-center gap-1.5">
                    <Users size={12} className="text-[#E53935]" /> {item.metadata?.participant_count || 0} joined
                 </span>
               )}
            </div>
          </div>
        </div>

        <div className="shrink-0 w-full md:w-auto">
           <motion.button 
             whileHover={{ scale: 1.02 }}
             whileTap={{ scale: 0.98 }}
             onClick={(e) => { 
               e.stopPropagation(); 
               if (item.type === 'MEETUP') {
                 if (joinStatus === 'JOINED') {
                   // Navigate to chat
                   const supabase = createClient();
                   supabase.from('posts').select('room_id').eq('id', item.id).single().then(({ data }) => {
                     if (data?.room_id) router.push(`/chat?room=${data.room_id}`);
                     else alert("Preparing group chat...");
                   });
                 } else {
                   setIsPreviewOpen(true);
                 }
               } else {
                 setOverlayChatId(item.author.id);
                 setOverlayOpen(true);
               }
             }}
             className={cn(
               "h-12 md:h-14 w-full md:px-8 rounded-2xl text-[10px] md:text-[11px] font-black uppercase tracking-[0.1em] shadow-xl transition-all flex items-center justify-center gap-3", 
               (item as any).isConnected ? "bg-emerald-600 text-white" :
               (item.type === 'MEETUP' && joinStatus === 'JOINED' ? "bg-emerald-600 text-white shadow-emerald-600/20" : cta.color)
             )}
           >
              {((item as any).isConnected) ? "Chat Now" : (item.type === 'MEETUP' ? (
                joinStatus === 'JOINED' ? "You're in  Chat open" :
                joinStatus === 'REQUESTED' ? "Awaiting Approval" :
                joinStatus === 'FULL' ? "Meetup Full" : "Join Meetup"
              ) : cta.label)}
              <ArrowRight size={16} strokeWidth={3} />
           </motion.button>
        </div>

        <MeetupPreviewModal 
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          meetup={item}
          currentUserId={authUser?.id}
          onJoinSuccess={(status) => setJoinStatus(status)}
        />
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index ? index * 0.05 : 0 }}
      onClick={() => router.push(`/marketplace/${item.id}`)}
      className="bg-white rounded-[2rem] p-6 md:p-8 border border-black/[0.03] shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer group flex flex-col h-full"
    >
      <div className="flex items-start justify-between mb-6">
        <div className="h-16 w-16 md:h-20 md:w-20 rounded-2xl overflow-hidden border-4 border-[#F5F5F7] shadow-md group-hover:scale-105 transition-all duration-500">
          <img src={item.author.avatar} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" alt="" />
        </div>
        <div className="flex flex-col items-end gap-2">
           <span className={cn(
             "px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
             item.type === 'REQUIREMENT' ? "bg-amber-50 text-amber-600 border-amber-100" :
             item.type === 'PARTNER' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
             "bg-indigo-50 text-indigo-600 border-indigo-100"
           )}>
             {item.type}
           </span>
           <span className="text-[8px] font-black text-black/20 uppercase tracking-widest">{item.location}</span>
        </div>
      </div>
      
      <div className="flex-1 space-y-2 mb-6">
        <h3 className="text-lg font-black text-[#1D1D1F] uppercase font-outfit group-hover:text-[#E53935] transition-colors leading-tight line-clamp-2">{item.title}</h3>
        <p 
          onClick={(e) => {
            e.stopPropagation();
            if (item.metadata?.geo) {
              router.push(`/map?lat=${item.metadata.geo.lat}&lng=${item.metadata.geo.lng}`);
            } else {
              router.push(`/map?search=${encodeURIComponent(item.location || "Trivandrum")}`);
            }
          }}
          className="text-[9px] font-black text-black/20 uppercase tracking-widest line-clamp-1 hover:text-[#E53935] cursor-pointer transition-colors"
        >
          {item.author.name}  {item.industry}  {item.location}
        </p>
        <p className="text-[12px] font-bold text-black/50 line-clamp-2 pt-2 leading-relaxed">{item.description}</p>
      </div>

      <div className="pt-6 border-t border-black/[0.03] flex flex-col gap-4">
         <motion.button 
           whileHover={{ scale: 1.02 }}
           whileTap={{ scale: 0.98 }}
           onClick={(e) => { 
             e.stopPropagation(); 
             if (item.type === 'MEETUP') {
                if (joinStatus === 'JOINED') {
                   const supabase = createClient();
                   supabase.from('posts').select('room_id').eq('id', item.id).single().then(({ data }) => {
                     if (data?.room_id) router.push(`/chat?room=${data.room_id}`);
                     else alert("Preparing group chat...");
                   });
                } else {
                   setIsPreviewOpen(true);
                }
             } else {
               setOverlayChatId(item.author?.id);
               setOverlayOpen(true);
             }
           }}
           className={cn(
              "h-11 md:h-12 w-full rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-[0.1em] transition-all flex items-center justify-center gap-2", 
              item.type === 'MEETUP' && joinStatus === 'JOINED' ? "bg-emerald-600 text-white" : cta.color
           )}
         >
            {((item as any).isConnected) ? "Chat Now" : (item.type === 'MEETUP' ? (
               joinStatus === 'JOINED' ? "You're in  Chat open" :
               joinStatus === 'REQUESTED' ? "Awaiting Approval" :
               joinStatus === 'FULL' ? "Meetup Full" : "Join Meetup"
            ) : cta.label)}
            <ArrowRight size={14} strokeWidth={3} />
         </motion.button>
         <div className="flex items-center justify-between">
            <span className="text-[8px] font-black text-black/10 uppercase tracking-widest flex items-center gap-1">
               <Clock size={10} /> {item.type === 'MEETUP' ? 'Upcoming' : 'New'}
            </span>
            <span className="text-[8px] font-black text-black/10 uppercase tracking-widest flex items-center gap-1">
               <Users size={10} /> 3+ joined
            </span>
         </div>
      </div>
      <MeetupPreviewModal 
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        meetup={item}
        currentUserId={authUser?.id}
        onJoinSuccess={(status) => setJoinStatus(status)}
      />
    </motion.div>
  );
}


