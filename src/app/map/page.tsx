"use client";

import React, { useState, useEffect, useRef, useMemo, Suspense } from "react";
import TerminalLayout from "@/components/layout/TerminalLayout";
import { 
  MapPin, 
  Search, 
  Filter, 
  Navigation, 
  Layers, 
  ZoomIn, 
  ZoomOut,
  Maximize2,
  Users,
  Building2,
  Sparkles,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { createClient } from "@/utils/supabase/client";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";

const MomentumView = dynamic(() => import("@/components/modals/MomentumView"), { ssr: false });

function MapContent() {
  const searchParams = useSearchParams();
  const [activeLayer, setActiveLayer] = useState<"All" | "Partners" | "Businesses" | "Events" | "Requirements" | "Creators">("All");
  const [mapError, setMapError] = useState<string | null>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<{ id: string, type: any } | null>(null);
  
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const supabase = createClient();

  // Parse target location from URL
  const targetLat = searchParams.get('lat');
  const targetLng = searchParams.get('lng');
  const searchName = searchParams.get('search');

  useEffect(() => {
    if (map.current && targetLat && targetLng) {
      map.current.flyTo({
        center: [parseFloat(targetLng), parseFloat(targetLat)],
        zoom: 15,
        essential: true
      });
    } else if (map.current && searchName) {
      // Simple geocoding for search name
      fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(searchName)}&limit=1`)
        .then(res => res.json())
        .then(data => {
          if (data.features?.length > 0) {
            const [lng, lat] = data.features[0].geometry.coordinates;
            map.current?.flyTo({ center: [lng, lat], zoom: 14, essential: true });
          }
        });
    }
  }, [targetLat, targetLng, searchName]);

  // Load Real Data
  useEffect(() => {
    async function loadNetworkNodes() {
      try {
        // ── CITY GEOCODE TABLE ────────────────────────────────────────
        // Real coordinates for cities in Kerala & beyond
        const CITY_COORDS: Record<string, [number, number]> = {
          // Kerala
          'trivandrum': [8.5241, 76.9467],
          'thiruvananthapuram': [8.5241, 76.9467],
          'kochi': [9.9312, 76.2673],
          'cochin': [9.9312, 76.2673],
          'ernakulam': [9.9816, 76.2999],
          'kozhikode': [11.2588, 75.7804],
          'calicut': [11.2588, 75.7804],
          'thrissur': [10.5276, 76.2144],
          'kannur': [11.8745, 75.3704],
          'kollam': [8.8932, 76.6141],
          'palakkad': [10.7867, 76.6548],
          'alappuzha': [9.4981, 76.3388],
          'alleppey': [9.4981, 76.3388],
          'malappuram': [11.0510, 76.0711],
          'kasaragod': [12.4996, 74.9869],
          'pathanamthitta': [9.2648, 76.7870],
          'idukki': [9.9189, 77.0083],
          'kottayam': [9.5916, 76.5222],
          'wayanad': [11.6854, 76.1320],
          // Other major Indian cities
          'bangalore': [12.9716, 77.5946],
          'bengaluru': [12.9716, 77.5946],
          'mumbai': [19.0760, 72.8777],
          'delhi': [28.6139, 77.2090],
          'hyderabad': [17.3850, 78.4867],
          'chennai': [13.0827, 80.2707],
          'pune': [18.5204, 73.8567],
          'kolkata': [22.5726, 88.3639],
          'ahmedabad': [23.0225, 72.5714],
          'jaipur': [26.9124, 75.7873],
          'global': [20.5937, 78.9629],
          'online': [8.5241, 76.9467],
        };

        const getCoords = (city: string, id: string, salt1: number, salt2: number): [number, number] => {
          const key = (city || '').toLowerCase().trim();
          const base = CITY_COORDS[key] || CITY_COORDS['trivandrum'];
          // Tiny deterministic jitter so overlapping pins spread out
          let h = salt1;
          for (let i = 0; i < id.length; i++) h = (Math.imul(31, h) + id.charCodeAt(i)) | 0;
          const jitterLat = ((h & 0xffff) / 0xffff - 0.5) * 0.025;
          let h2 = salt2;
          for (let i = 0; i < id.length; i++) h2 = (Math.imul(37, h2) + id.charCodeAt(i)) | 0;
          const jitterLng = ((h2 & 0xffff) / 0xffff - 0.5) * 0.030;
          return [base[0] + jitterLat, base[1] + jitterLng];
        };

        // ── PARALLEL FETCHES ──────────────────────────────────────────
        const [postsRes, profilesRes, creatorsRes] = await Promise.all([
          supabase
            .from('posts')
            .select(`id, title, content, type, metadata, location, created_at, author:profiles!posts_author_id_fkey(id, full_name, avatar_url, location)`)
            .order('created_at', { ascending: false })
            .limit(60),
          supabase
            .from('profiles')
            .select('id, full_name, avatar_url, bio, role, location')
            .not('full_name', 'is', null)
            .limit(100),
          supabase
            .from('creator_profiles')
            .select(`*, profile:profiles(id, full_name, avatar_url, location)`)
            .limit(80)
        ]);

        if (postsRes.error) console.error("Posts fetch error:", postsRes.error);
        if (profilesRes.error) console.error("Profiles fetch error:", profilesRes.error);
        if (creatorsRes.error) console.error("Creators fetch error:", creatorsRes.error);

        const posts = postsRes.data || [];
        const profiles = profilesRes.data || [];
        const creators = creatorsRes.data || [];

        const nodes: any[] = [];

        // ── POSTS → map nodes ─────────────────────────────────────────
        posts.forEach((p: any) => {
          const rawType = (p.type || '').toUpperCase();
          let nodeType: 'Partners' | 'Businesses' | 'Events' | 'Requirements' = 'Partners';
          if (rawType === 'MEETUP') nodeType = 'Events';
          else if (['REQUIREMENT', 'PARTNERSHIP', 'JOB'].includes(rawType)) nodeType = 'Requirements';
          else if (rawType === 'BUSINESS') nodeType = 'Businesses';

          // Priority: stored geo > post location text > author city > author location
          let lat: number, lng: number;
          if (p.metadata?.geo?.lat) {
            lat = p.metadata.geo.lat;
            lng = p.metadata.geo.lng;
          } else {
            const cityStr = p.location || p.author?.city || p.author?.location || 'trivandrum';
            [lat, lng] = getCoords(cityStr, p.id, 1, 2);
          }

          const colorMap: Record<string, string> = { Events: '#FF3B30', Businesses: '#5856D6', Requirements: '#FF9500', Partners: '#34C759' };
          const iconMap: Record<string, string> = { Events: '🔥', Businesses: '🏢', Requirements: '🎯', Partners: '👤' };

          nodes.push({
            id: p.id,
            type: nodeType,
            subType: rawType,
            lat, lng,
            title: p.title || 'Opportunity',
            content: p.content,
            author: p.author?.full_name || 'Member',
            avatar: p.author?.avatar_url,
            linkHref: null,
            markerColor: colorMap[nodeType],
            markerIcon: iconMap[nodeType]
          });
        });

        // ── PROFILES → Partners / Businesses ─────────────────────────
        profiles.forEach((p: any) => {
          const isBusiness = p.role === 'BUSINESS';
          const cityStr = p.city || p.location || 'trivandrum';
          const [lat, lng] = getCoords(cityStr, p.id, 3, 4);

          nodes.push({
            id: p.id,
            type: isBusiness ? 'Businesses' : 'Partners',
            subType: isBusiness ? 'BUSINESS' : 'PARTNER',
            lat, lng,
            title: p.full_name,
            content: p.bio,
            avatar: p.avatar_url,
            isProfile: true,
            linkHref: `/creators/profile/${p.id}`,
            markerColor: isBusiness ? '#5856D6' : '#34C759',
            markerIcon: isBusiness ? '🏢' : '👤'
          });
        });

        // ── CREATOR PROFILES ─────────────────────────────────────────
        creators.forEach((c: any) => {
          const profileId = c.profile?.id || c.id;
          const cityStr = c.city || c.profile?.city || c.profile?.location || 'trivandrum';
          const [lat, lng] = getCoords(cityStr, profileId, 5, 6);

          nodes.push({
            id: profileId,
            type: 'Creators',
            subType: c.category || 'CREATOR',
            lat, lng,
            title: c.profile?.full_name || 'Creator',
            content: c.bio || '',
            avatar: c.profile?.avatar_url,
            isProfile: true,
            linkHref: `/creators/profile/${profileId}`,
            markerColor: '#E91E8C',
            markerIcon: '🎬'
          });
        });

        setMarkers(nodes);
      } catch (err) {
        console.error('[MAP_DATA_ERROR]', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadNetworkNodes();
  }, []);

  useEffect(() => {
    if (!mapContainer.current) return;

    console.log('[MAP] Initializing...');

    try {
      if (map.current) {
        map.current.remove();
      }
      
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
        center: [76.9467, 8.5241], // Trivandrum
        zoom: 12.5,
        attributionControl: false,
        failIfMajorPerformanceCaveat: false
      });

      map.current.on('load', () => {
        console.log('[MAP] Live tiles loaded successfully');
      });

      // Add navigation controls
      map.current.addControl(new maplibregl.NavigationControl({
        showCompass: false
      }), 'top-right');

    } catch (err: any) {
      console.error('[MAP] Initialization failed:', err);
      setMapError(err.message || 'Failed to initialize map engine');
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  const [mapSearchQuery, setMapSearchQuery] = useState("");

  const filteredMarkers = useMemo(() => {
    let base = markers;
    if (activeLayer !== 'All') {
      base = markers.filter(m => m.type === activeLayer);
    }
    
    if (!mapSearchQuery) return base;
    
    const q = mapSearchQuery.toLowerCase();
    return base.filter(m => 
      (m.title && m.title.toLowerCase().includes(q)) || 
      (m.content && m.content.toLowerCase().includes(q))
    );
  }, [markers, activeLayer, mapSearchQuery]);

  // Update Markers based on Layer and Data
  useEffect(() => {
    if (!map.current) return;

    // Clear existing markers via official Ref tracking
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    filteredMarkers.forEach(node => {
      const el = document.createElement('div');
      el.className = 'custom-marker';
      
      // Determine geometry based on node type
      const isEvent = node.type === 'Events';
      const isBusiness = node.type === 'Businesses';
      const isReq = node.type === 'Requirements';
      
      const shapeStyle = isEvent 
        ? `clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);` 
        : isReq 
        ? `transform: rotate(45deg); border-radius: 8px;` 
        : isBusiness 
        ? `border-radius: 12px;` 
        : `border-radius: 9999px;`;

      const innerContentStyle = isReq ? `transform: rotate(-45deg);` : "";

      const hasRealAvatar = node.avatar && node.avatar.length > 20;
      const iconHtml = hasRealAvatar 
        ? `<div class="h-full w-full overflow-hidden border-2 border-white shadow-xl bg-white" style="${shapeStyle} box-shadow: 0 0 15px ${node.markerColor}80">
             <img src="${node.avatar}" class="h-full w-full object-cover" style="${innerContentStyle}" />
           </div>`
        : `<div class="h-full w-full border-2 border-white flex items-center justify-center text-white shadow-xl transition-all" style="background-color: ${node.markerColor}; box-shadow: 0 0 15px ${node.markerColor}80; ${shapeStyle}">
             <span style="${innerContentStyle}" class="text-lg">${node.markerIcon}</span>
           </div>`;

      el.innerHTML = `
        <div class="relative group cursor-pointer h-10 w-10 transition-all hover:scale-125 z-10">
          <div class="h-full w-full rounded-full overflow-hidden border-2 border-white/20 shadow-[0_0_20px_rgba(229,57,53,0.3)]">
            ${iconHtml}
          </div>
          <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-50">
            <div class="bg-black/90 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl whitespace-nowrap shadow-2xl">
              <p class="text-[10px] font-black uppercase text-white tracking-widest">${node.title}</p>
              <p class="text-[8px] font-bold text-white/40 uppercase mt-0.5">${node.author || node.type}</p>
            </div>
          </div>
        </div>
      `;

      // Create Popup
      const popupContent = document.createElement('div');
      popupContent.className = 'map-popup-container';
      popupContent.innerHTML = `
        <div class="p-5 bg-black/90 backdrop-blur-2xl border border-white/10 rounded-2xl w-64 shadow-4xl text-white space-y-6">
           <div class="flex items-center gap-4">
              <div class="h-12 w-12 rounded-xl overflow-hidden border border-white/10 shrink-0">
                 <img src="${node.avatar || `https://i.pravatar.cc/150?u=${node.id}`}" class="h-full w-full object-cover" />
              </div>
              <div class="min-w-0">
                 <p class="text-[10px] font-black text-[#E53935] uppercase tracking-[0.2em] leading-none mb-1.5">${activeLayer}</p>
                 <p class="text-[14px] font-black uppercase truncate leading-tight">${node.title}</p>
              </div>
           </div>
           
           <p class="text-[11px] font-medium text-white/50 leading-relaxed line-clamp-2 uppercase tracking-tight italic">
              "${node.content || "Connecting real-world opportunities across the network."}"
           </p>

           <div class="grid grid-cols-2 gap-3">
              <button class="h-11 rounded-xl bg-white text-black text-[9px] font-black uppercase tracking-widest hover:bg-[#E53935] hover:text-white transition-all active:scale-95 btn-connect">
                 Connect
              </button>
              <button class="h-11 rounded-xl bg-white/10 border border-white/10 text-white text-[9px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all active:scale-95 btn-response">
                 Response
              </button>
           </div>
        </div>
      `;

      const popup = new maplibregl.Popup({ 
        offset: 25, 
        closeButton: false,
        maxWidth: 'none',
        className: 'custom-map-popup'
      }).setDOMContent(popupContent);

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([node.lng, node.lat])
        .addTo(map.current!);

      markersRef.current.push(marker);

      // Click to open popup or full view
      el.style.pointerEvents = 'auto';
      el.style.zIndex = '10';
      
      el.addEventListener('click', (e) => {
        e.stopPropagation();

        // Profile nodes (partners, businesses, creators) → navigate to profile
        if (node.isProfile && node.linkHref) {
          window.location.href = node.linkHref;
          return;
        }

        // Post nodes → open MomentumView feed overlay
        if (!node.isProfile) {
          setSelectedPost({ id: node.id, type: node.subType });
        }
      });
    });
  }, [filteredMarkers, activeLayer]);

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-[#0A0A0B] overflow-hidden selection:bg-[#E53935]/10">
      <style>{`
        .maplibregl-popup {
          z-index: 9999 !important;
        }
        .maplibregl-popup-content {
          padding: 0;
          background: transparent;
          border: none;
          box-shadow: none;
        }
        .maplibregl-popup-tip {
          display: none;
        }
      `}</style>
      <div className="p-6 border-b border-white/[0.03] bg-black/40 backdrop-blur-3xl z-30">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight text-white">Area <span className="text-[#E53935]">Discovery</span></h1>
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mt-1">Live Node: Trivandrum</p>
          </div>

          <div className="flex items-center gap-4 bg-white/[0.03] p-1.5 rounded-xl border border-white/[0.05] overflow-x-auto no-scrollbar max-w-full">
            {(["All", "Partners", "Businesses", "Creators", "Events", "Requirements"] as const).map((layer) => (
              <button
                key={layer}
                onClick={() => setActiveLayer(layer)}
                className={cn(
                  "px-6 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all shrink-0",
                  activeLayer === layer 
                    ? layer === 'Creators' ? "bg-[#E91E8C] text-white shadow-xl" : "bg-white text-black shadow-xl"
                    : "text-white/30 hover:text-white"
                )}
              >
                {layer}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
              <input 
                type="text" 
                placeholder="Search Location..." 
                value={mapSearchQuery}
                onChange={(e) => setMapSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    // Trigger FlyTo for the searched location
                    fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(mapSearchQuery)}&limit=1`)
                      .then(res => res.json())
                      .then(data => {
                        if (data.features?.length > 0) {
                          const [lng, lat] = data.features[0].geometry.coordinates;
                          map.current?.flyTo({ center: [lng, lat], zoom: 14, animate: true });
                        }
                      });
                  }
                }}
                className="h-11 pl-10 pr-6 bg-white/[0.03] border border-transparent rounded-lg text-[11px] font-bold outline-none focus:bg-white/[0.08] focus:border-[#E53935]/20 text-white transition-all w-[240px]"
              />
            </div>
            <button 
              onClick={() => setActiveLayer("All")}
              className="h-11 w-11 bg-[#E53935] text-white rounded-lg flex items-center justify-center hover:bg-[#D32F2F] transition-all shadow-xl shadow-[#E53935]/10"
            >
              <Filter size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* MAP VIEWPORT */}
      <div className="flex-1 relative bg-[#0A0A0B] overflow-hidden group">
        {/* LIVE MAP CONTAINER */}
        <div 
          ref={mapContainer} 
          className="absolute inset-0 z-10 w-full h-full" 
          style={{ background: '#0A0A0B' }}
        />

        {mapError && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
            <div className="text-center space-y-4 p-8">
              <AlertCircle className="text-[#E53935] mx-auto" size={48} />
              <p className="text-white font-bold text-lg">Map Initialization Error</p>
              <p className="text-white/40 text-xs uppercase tracking-widest">{mapError}</p>
              <button 
                onClick={() => window.location.reload()}
                className="px-8 py-3 bg-[#E53935] text-white text-[10px] font-black uppercase rounded-xl"
              >
                Retry Connection
              </button>
            </div>
          </div>
        )}
        
        {/* MAP OVERLAYS (Floating UI) */}
        <div className="absolute inset-0 pointer-events-none z-20">
           {/* Center Marker Placeholder */}
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="h-4 w-4 bg-[#E53935] rounded-full shadow-[0_0_20px_rgba(229,57,53,0.8)] border-2 border-white/20 animate-pulse" />
           </div>
        </div>

        {/* STATUS OVERLAY */}
        <div className="absolute bottom-8 left-8 p-8 bg-black/60 backdrop-blur-3xl border border-white/5 rounded-2xl shadow-4xl flex items-center gap-8 max-w-md z-40 group/status overflow-hidden">
           <div className="absolute inset-0 bg-gradient-to-br from-[#E53935]/5 to-transparent opacity-0 group-hover/status:opacity-100 transition-opacity" />
           <div className="h-16 w-16 bg-[#E53935] rounded-2xl flex items-center justify-center shadow-2xl shadow-[#E53935]/20 animate-pulse relative z-10">
              <Sparkles size={32} className="text-white" />
           </div>
           <div className="relative z-10">
              <p className="text-[10px] font-black uppercase text-[#E53935] tracking-widest leading-none mb-2.5">Neural Insights v4.2</p>
              <p className="text-[15px] font-medium text-white leading-tight tracking-tight">"Interactive Map API Active. High-density network activity identified across <span className="text-[#E53935] font-bold">Trivandrum</span>."</p>
           </div>
        </div>

        {/* MOMENTUM VIEW OVERLAY */}
        <AnimatePresence>
          {selectedPost && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto py-10"
              onClick={(e) => {
                // Close if clicking the backdrop
                if (e.target === e.currentTarget) setSelectedPost(null);
              }}
            >
              <div className="w-full max-w-4xl relative z-[10000]">
                <MomentumView 
                  postId={selectedPost.id} 
                  type={selectedPost.type} 
                  onClose={() => setSelectedPost(null)} 
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function MapPage() {
  return (
    <TerminalLayout>
      <Suspense fallback={
        <div className="h-[calc(100vh-64px)] bg-[#0A0A0B] flex items-center justify-center">
          <div className="h-16 w-16 bg-[#E53935] rounded-2xl animate-pulse shadow-2xl shadow-[#E53935]/20" />
        </div>
      }>
        <MapContent />
      </Suspense>
    </TerminalLayout>
  );
}
