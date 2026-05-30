"use client";
import React, { useState, useEffect, useMemo } from "react";
import { 
  Users, 
  MessageSquare, 
  Zap,
  CheckCircle2,
  MapPin,
  Loader2,
  MoreHorizontal,
  Trash2,
  ShieldAlert,
  ShieldCheck,
  Target,
  Activity,
  Sparkles,
  Clock,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ConnectionService } from "@/services/connection-service";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useConnections } from "@/hooks/useConnections";
import ConnectButton from "@/components/ui/ConnectButton";
import TerminalLayout from "@/components/layout/TerminalLayout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import PartnerProfileCard from "@/components/partners/PartnerProfileCard";

// --- TYPES ---
type MatchProfile = {
  id: string;
  full_name: string;
  avatar_url: string;
  role: string;
  location: string;
  skills: string[];
  connection_status: 'NONE' | 'PENDING' | 'ACCEPTED';
  updated_at?: string;
  metadata: {
    match_score?: number;
    reasons?: string[];
    checkout_score?: number;
    last_active?: string;
  };
};

export default function MatchesPage() {
  const { user, profile: authUser } = useAuth();
  const { connectionMap, refreshConnections } = useConnections();
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const initialTab = (searchParams.get('tab') as any) || 'DISCOVER';
  const [activeTab, setActiveTab] = useState<'DISCOVER' | 'REQUESTS' | 'CONNECTED'>(initialTab.toUpperCase());
  
  // Sync tab if URL changes (optional but good)
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) setActiveTab(tab.toUpperCase() as any);
  }, [searchParams]);

  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("All Roles");
  
  const [allProfiles, setAllProfiles] = useState<MatchProfile[]>([]);
  const [stats, setStats] = useState({
    activeCount: 0,
    yourScore: 0,
    dailyGoal: 0,
    partnersCount: 0
  });
  const [confirmAction, setConfirmAction] = useState<{ type: 'REMOVE' | 'BLOCK'; connectionId: string; partnerName: string } | null>(null);
  const [requests, setRequests] = useState<any[]>([]);

  const initData = async () => {
    if (!authUser?.id || authUser.id === 'null' || authUser.id === 'undefined') return;
    setIsLoading(true);
    try {
      const { data: profiles } = await supabase.from('profiles').select('*').neq('id', authUser.id);
      const today = new Date();
      today.setHours(0,0,0,0);
      const { count: connectionsToday } = await supabase
        .from('connections')
        .select('*', { count: 'exact', head: true })
        .eq('sender_id', authUser.id)
        .gte('created_at', today.toISOString());
      const partnersCount = Object.values(connectionMap).filter(s => s === 'CONNECTED').length;

      if (profiles) {
        const mapped = profiles.map(p => {
          const matchData = calculateProfileMatch(authUser, p);
          return {
            ...p,
            skills: p.skills || [],
            metadata: { 
              ...(p.metadata || {}), 
              match_score: matchData.score, 
              reasons: matchData.reasons,
              last_active: p.updated_at ? `Active ${formatTimeAgo(p.updated_at)}` : 'Recently Active'
            }
          };
        });
        // Deduplicate profiles to prevent UI ghosts if the database has dirty rows with the same name
        const uniqueProfiles = Array.from(new Map(mapped.map(p => [p.full_name, p])).values());
        setAllProfiles(uniqueProfiles);
        const avgScore = uniqueProfiles.length > 0 ? Math.round(uniqueProfiles.reduce((acc, p) => acc + (p.metadata?.match_score || 0), 0) / uniqueProfiles.length) : 0;
        setStats({
          activeCount: profiles.length,
          yourScore: authUser.matchScore || avgScore || 85,
          dailyGoal: Math.min(100, Math.round(((connectionsToday || 0) / 5) * 100)),
          partnersCount
        });
      }
    } catch (err) {
      console.error("Data Load Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initData();
  }, [authUser?.id, connectionMap]);

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    return `${Math.floor(diffHrs / 24)}d ago`;
  };

  const calculateProfileMatch = (me: any, other: any) => {
    let score = 55;
    const reasons: string[] = [];
    if (me.role === 'BUSINESS' && other.role === 'PROFESSIONAL') { score += 25; reasons.push("Great business match"); }
    if (me.location === other.location) { score += 15; reasons.push(`Lives in ${me.location}`); }
    const myIntents = me.intents || [];
    const otherSkills = other.skills || [];
    const overlaps = myIntents.filter((s: string) => otherSkills.includes(s));
    if (overlaps.length > 0) { score += (overlaps.length * 8); reasons.push(`${overlaps.length} common goals`); }
    return { score: Math.min(score, 99), reasons };
  };

  const handleAccept = async (connectionId: string) => {
    try {
      await ConnectionService.accept(connectionId);
      await refreshConnections();
    } catch (err) {
      alert("Action failed. Try again.");
    }
  };

  const handleReject = async (connectionId: string) => {
    try {
      await ConnectionService.reject(connectionId);
      await refreshConnections();
    } catch (err) {
      alert("Action failed. Try again.");
    }
  };

  const handleCancel = async (connectionId: string) => {
    try {
      await ConnectionService.removeConnection(connectionId);
      await refreshConnections();
    } catch (err) {
      alert("Action failed. Try again.");
    }
  };

  const filteredList = useMemo(() => {
    return allProfiles.filter(p => {
      const matchesSearch = p.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.role?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === "All Roles" || p.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [allProfiles, searchQuery, roleFilter]);

  const discoverList = useMemo(() => 
    filteredList.filter(p => !connectionMap[p.id] || connectionMap[p.id] === 'NONE')
    .sort((a,b) => (b.metadata?.match_score || 0) - (a.metadata?.match_score || 0))
  , [filteredList, connectionMap]);

  const connectedList = useMemo(() => 
    filteredList.filter(p => connectionMap[p.id] === 'CONNECTED')
  , [filteredList, connectionMap]);

  useEffect(() => {
    if (!user?.id) return;
    
    const fetchReqs = async () => {
      if (!user?.id || user.id === 'null' || user.id === 'undefined') return;
      
      try {
        console.log("[Matches] Starting split-fetch for requests...");
        
        // 1. Fetch Connection Records (No join to avoid PGRST200)
        const [incRes, outRes] = await Promise.all([
          supabase.from('connections').select('*').eq('receiver_id', user.id).eq('status', 'PENDING'),
          supabase.from('connections').select('*').eq('sender_id', user.id).eq('status', 'PENDING')
        ]);

        if (incRes.error) throw incRes.error;
        if (outRes.error) throw outRes.error;

        const allConns = [...(incRes.data || []), ...(outRes.data || [])];
        if (allConns.length === 0) {
          setRequests([]);
          return;
        }

        // 2. Collect Partner IDs for Hydration (Strict Firewall)
        const partnerIds = allConns
          .map(c => c.sender_id === user.id ? c.receiver_id : c.sender_id)
          .filter(id => id && id !== 'null' && id !== 'undefined');

        if (partnerIds.length === 0) {
          setRequests([]);
          return;
        }
        
        // 3. Fetch Profiles for all partners
        const { data: profiles, error: pError } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, role, location')
          .in('id', partnerIds);

        if (pError) throw pError;

        const profileMap = (profiles || []).reduce((acc, p) => ({ ...acc, [p.id]: p }), {} as any);

        // 4. Identify and Clean Orphaned Records (Auto-Fix)
        const orphaned = allConns.filter(c => {
          const partnerId = c.receiver_id === user.id ? c.sender_id : c.receiver_id;
          return !profileMap[partnerId];
        });

        if (orphaned.length > 0) {
          console.log("[Matches] Auto-cleaning orphaned records:", orphaned.length);
          await Promise.all(orphaned.map(o => ConnectionService.removeConnection(o.id)));
          fetchReqs(); // Re-run to get clean state
          refreshConnections(); // Update global map
          return;
        }

        // 5. Map valid ones
        const mapped = allConns.map(c => {
          const isIncoming = c.receiver_id === user.id;
          const partnerId = isIncoming ? c.sender_id : c.receiver_id;
          const profile = profileMap[partnerId];
          
          return {
            ...c,
            isIncoming,
            partner: profile
          };
        }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        console.log("[Matches] Successfully hydrated requests:", mapped.length);
        setRequests(mapped);
      } catch (err) {
        console.error("[Matches] Hydration Error:", err);
      }
    };

    fetchReqs();
  }, [user?.id, connectionMap]);

  return (
    <ProtectedRoute>
      <TerminalLayout
        topbarChildren={
           <div className="flex items-center gap-6">
              <div className="flex p-1 bg-[#F5F5F7] rounded-[10px] border border-black/[0.03]">
                 {[
                   { id: 'DISCOVER', label: 'Explore', count: discoverList.length },
                   { id: 'REQUESTS', label: 'Requests', count: requests.filter(r => r.isIncoming).length },
                   { id: 'CONNECTED', label: 'Partners', count: connectedList.length }
                 ].map(tab => (
                   <button 
                     key={tab.id}
                     onClick={() => setActiveTab(tab.id as any)}
                     className={cn(
                       "px-6 h-9 rounded-[8px] text-[10px] font-black uppercase tracking-widest transition-all relative",
                       activeTab === tab.id ? "bg-white text-black shadow-sm" : "text-black/40 hover:text-black"
                     )}
                   >
                     {tab.label}
                     {tab.id === 'REQUESTS' && tab.count > 0 && (
                       <span className="ml-2 px-1.5 py-0.5 bg-[#E53935] text-white text-[8px] rounded-full">
                         {tab.count}
                       </span>
                     )}
                   </button>
                 ))}
              </div>
           </div>
        }
      >
        <div className="p-8 max-w-7xl mx-auto">
           <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
              {[
                 { label: "Active Now", value: stats.activeCount, icon: Activity, color: "text-blue-500" },
                 { label: "Your Score", value: stats.yourScore, icon: Zap, color: "text-amber-500" },
                 { label: "Daily Goal", value: `${stats.dailyGoal}%`, icon: Target, color: "text-[#E53935]" },
                 { label: "Partners", value: stats.partnersCount, icon: ShieldCheck, color: "text-emerald-500" },
              ].map((stat, i) => (
                 <div key={i} className="bg-white border border-black/[0.03] p-5 rounded-[10px] flex items-center justify-between">
                    <div>
                       <p className="text-[9px] font-black uppercase tracking-widest text-black/30 mb-1">{stat.label}</p>
                       <p className="text-4xl font-black font-outfit">{stat.value}</p>
                    </div>
                    <stat.icon size={24} className={stat.color} />
                 </div>
              ))}
           </div>
  
           {isLoading ? (
              <div className="py-40 flex flex-col items-center gap-8">
                 <div className="relative">
                    <Loader2 className="animate-spin text-[#E53935]" size={48} />
                 </div>
                 <p className="text-[11px] font-black uppercase tracking-[0.3em] text-black/20">Loading people...</p>
              </div>
           ) : (
              <AnimatePresence mode="popLayout">
                 {activeTab === 'DISCOVER' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                       {discoverList.length > 0 ? (
                          discoverList.map((p, i) => (
                             <PartnerProfileCard key={p.id} partner={p} index={i} setConfirmAction={setConfirmAction} authUser={authUser} />
                          ))
                       ) : <EmptyState title="All caught up" description="You've seen everyone for now." icon={Sparkles} />}
                    </div>
                 )}
  
                 {activeTab === 'REQUESTS' && (
                    <div className="space-y-16">
                       {requests.filter(r => r.isIncoming).length > 0 && (
                        <div className="space-y-6">
                           <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-black/20 ml-2">New Requests</h3>
                           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                              {requests.filter(r => r.isIncoming).map((req, i) => (
                                 <PartnerProfileCard 
                                    key={req.id} 
                                    partner={req.partner} 
                                    index={i} 
                                    onAction={() => handleAccept(req.id)} 
                                    onSecondaryAction={() => handleReject(req.id)}
                                    actionLabel="Accept" 
                                    variant="request"
                                    setConfirmAction={setConfirmAction} 
                                    authUser={authUser}
                                 />
                              ))}
                           </div>
                        </div>
                       )}
                       
                       {requests.filter(r => !r.isIncoming).length > 0 && (
                        <div className="space-y-6">
                           <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-black/20 ml-2">Waiting for response</h3>
                           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                              {requests.filter(r => !r.isIncoming).map((req, i) => (
                                 <PartnerProfileCard 
                                    key={req.id} 
                                    partner={req.partner} 
                                    index={i} 
                                    onAction={() => handleCancel(req.id)} 
                                    actionLabel="Cancel Request" 
                                    variant="outgoing" 
                                    setConfirmAction={setConfirmAction} 
                                    authUser={authUser}
                                 />
                              ))}
                           </div>
                        </div>
                       )}

                       {requests.length === 0 && (
                        <EmptyState title="No requests" description="Incoming and outgoing requests will appear here." icon={Clock} />
                       )}
                    </div>
                 )}
  
                 {activeTab === 'CONNECTED' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                       {connectedList.length > 0 ? (
                          connectedList.map((p, i) => (
                             <PartnerProfileCard key={p.id} partner={p} index={i} onAction={() => router.push(`/chat?user=${p.id}`)} actionLabel="Chat" variant="connected" setConfirmAction={setConfirmAction} authUser={authUser} />
                          ))
                       ) : <EmptyState title="No partners yet" description="Start by connecting with people in Explore." icon={Users} />}
                    </div>
                 )}
              </AnimatePresence>
           )}
        </div>
  
        <AnimatePresence>
          {confirmAction && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[1000] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6">
              <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="w-full max-w-md bg-white rounded-[10px] p-10 shadow-4xl text-center border border-black/[0.05]">
                <div className={cn("h-20 w-20 rounded-[10px] flex items-center justify-center mx-auto mb-6", confirmAction.type === 'BLOCK' ? "bg-black text-white" : "bg-red-50 text-[#E53935]")}>
                  {confirmAction.type === 'BLOCK' ? <ShieldAlert size={32} /> : <Trash2 size={32} />}
                </div>
                <h3 className="text-2xl font-black text-[#1D1D1F] uppercase leading-none mb-3 font-outfit">{confirmAction.type === 'BLOCK' ? "Block User?" : "Remove Partner?"}</h3>
                <p className="text-black/40 font-bold uppercase text-[10px] tracking-widest mb-8 leading-relaxed">Confirm action for <strong>{confirmAction.partnerName}</strong>.</p>
                <div className="flex gap-3">
                  <button onClick={() => setConfirmAction(null)} className="flex-1 h-14 bg-[#F5F5F7] rounded-[10px] font-black uppercase text-[10px]">Cancel</button>
                  <button onClick={async () => {
                    if (confirmAction.type === 'BLOCK') await ConnectionService.blockUser(confirmAction.connectionId);
                    else await ConnectionService.removeConnection(confirmAction.connectionId);
                    setConfirmAction(null);
                    window.location.reload();
                  }} className={cn("flex-1 h-14 rounded-[10px] font-black uppercase text-[10px] text-white transition-all", confirmAction.type === 'BLOCK' ? "bg-black" : "bg-[#E53935] shadow-red-500/20")}>Confirm</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </TerminalLayout>
    </ProtectedRoute>
  );
}

function EmptyState({ title, description, icon: Icon }: any) {
  return (
    <div className="col-span-full py-40 text-center bg-white border border-black/[0.03] rounded-[10px]">
      <div className="h-20 w-20 bg-[#F5F5F7] rounded-[10px] flex items-center justify-center mx-auto mb-6 relative"><Icon size={32} className="text-black/20" /></div>
      <h3 className="text-2xl font-black text-[#1D1D1F] uppercase mb-2 font-outfit">{title}</h3>
      <p className="text-black/40 text-[11px] font-bold uppercase tracking-widest">{description}</p>
    </div>
  );
}


