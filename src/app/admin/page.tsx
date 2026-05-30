"use client";
import React, { useState, useEffect, useRef } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { 
  Terminal,
  Shield,
  Power,
  Unlink,
  Zap,
  Radio,
  Crosshair as TargetIcon,
  Network,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { suggestionTelemetry } from "@/utils/suggestion_telemetry";

//  MATRIX RAIN COMPONENT 
const MatrixRain = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const chars = "0123456789ABCDEF";
    const fontSize = 14;
    const columns = canvas.width / fontSize;
    const drops: number[] = Array(Math.floor(columns)).fill(1);
    const draw = () => {
      ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#FF0000";
      ctx.font = `${fontSize}px 'Share Tech Mono'`;
      for (let i = 0; i < drops.length; i++) {
        const text = chars.charAt(Math.floor(Math.random() * chars.length));
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }
    };
    const interval = setInterval(draw, 33);
    return () => clearInterval(interval);
  }, []);
  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none opacity-[0.1] z-0" />;
};

//  TYPES 
interface SystemMetrics {
  totalUsers: number;
  activeUsers: number;
  totalPosts: number;
  totalMeetups: number;
  matchEfficiency: number;
  systemLatency: number;
  industryDist: Record<string, number>;
}

export default function SentinelRedDashboard() {
  return (
    <ProtectedRoute>
      <SentinelDashboardContent />
    </ProtectedRoute>
  );
}

function SentinelDashboardContent() {
  const router = useRouter();
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [isLinked, setIsLinked] = useState(true);
  const [isSecurityLocked, setIsSecurityLocked] = useState(true);
  const [isGlitching, setIsGlitching] = useState(false);
  const [dataIngress, setDataIngress] = useState(14022);
  
  const [metrics, setMetrics] = useState<SystemMetrics>({
    totalUsers: 0,
    activeUsers: 0,
    totalPosts: 0,
    totalMeetups: 0,
    matchEfficiency: 0,
    systemLatency: 0,
    industryDist: {}
  });
  const [events, setEvents] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [securityLogs, setSecurityLogs] = useState<string[]>([]);
  const [isBooting, setIsBooting] = useState(false);
  const [bootLog, setBootLog] = useState<string[]>([]);
  const [telemetryMetrics, setTelemetryMetrics] = useState<any[]>([]);
  const [variantMetrics, setVariantMetrics] = useState<any>({ A: {}, B: {} });
  const [ghostTraffic, setGhostTraffic] = useState(0);
  
  const supabase = createClient();

  const RED = "#FF0000";
  const GREEN = "#00FF41";

  const theme = {
    primary: isSecurityLocked ? RED : GREEN,
    secondary: isSecurityLocked ? RED : GREEN,
    headerRed: RED,
  };

  const handleToggle = () => {
    setIsGlitching(true);
    setTimeout(() => {
      setIsSecurityLocked(!isSecurityLocked);
      setIsGlitching(false);
    }, 400);
  };

  useEffect(() => {
    if (!isLinked) return;
    
    // Subscribe to real-time analytics
    const channel = supabase
      .channel('admin_realtime')
      .on('postgres_changes', { event: 'INSERT', table: 'analytics_events' }, (payload) => {
        const log = `[${new Date().toLocaleTimeString()}] ${payload.new.event_type} -> ${payload.new.user_id?.slice(0,8) || 'ANON'}`;
        setSecurityLogs(prev => [...prev.slice(-39), log]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isLinked]);

  const fetchStats = async () => {
    try {
      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

      // 1. TOTALS
      const [uC, pC, mC, connC] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('posts').select('*', { count: 'exact', head: true }),
        supabase.from('meetups').select('*', { count: 'exact', head: true }),
        supabase.from('connections').select('*', { count: 'exact', head: true })
      ]);

      // 2. ACTIVE USERS (Last 24h unique)
      const { data: recentEvents } = await supabase
        .from('analytics_events')
        .select('user_id')
        .gt('created_at', twentyFourHoursAgo);
      
      const uniqueActive = new Set(recentEvents?.map(e => e.user_id).filter(Boolean)).size;

      // 3. INDUSTRY DISTRIBUTION
      const { data: industryData } = await supabase.from('posts').select('industry');
      const dist: Record<string, number> = {};
      industryData?.forEach(p => { if (p.industry) dist[p.industry] = (dist[p.industry] || 0) + 1; });

      // 4. MATCH EFFICIENCY (Accepted / Total Connections)
      const { count: acceptedConn } = await supabase.from('connections').select('*', { count: 'exact', head: true }).eq('status', 'ACCEPTED');
      const matchEff = connC.count ? Math.round((acceptedConn || 0) / connC.count * 100) : 0;

      // 5. RECENT DATA
      const { data: profs } = await supabase.from('profiles').select('id, full_name, industry').order('created_at', { ascending: false }).limit(20);
      const { data: evs } = await supabase.from('analytics_events').select('*').order('created_at', { ascending: false }).limit(40);
      const { data: pts } = await supabase.from('posts').select('*, profiles!posts_author_id_fkey(full_name)').order('created_at', { ascending: false }).limit(20);
      
      setMetrics({
        totalUsers: uC.count || 0,
        activeUsers: uniqueActive || Math.round((uC.count || 0) * 0.1), // Fallback if no events
        totalPosts: pC.count || 0,
        totalMeetups: mC.count || 0,
        matchEfficiency: matchEff,
        systemLatency: Math.floor(Math.random() * 50) + 20, // Real-ish mock
        industryDist: dist
      });

      if (profs) setUsers(profs);
      if (evs) setEvents(evs);
      if (pts) setPosts(pts);

      // Security Logs initial seed if empty
      if (securityLogs.length === 0 && evs) {
        setSecurityLogs(evs.slice(0, 10).map(e => `[${new Date(e.created_at).toLocaleTimeString()}] ${e.event_type} -> ${e.user_id?.slice(0,8) || 'ANON'}`));
      }

    } catch (e) {
      console.error("Admin fetch error:", e);
    }
  };

  useEffect(() => {
    if (!isLinked) return;
    fetchStats();
    const poll = setInterval(fetchStats, 4000); // Faster polling for real-time wipe feedback
    return () => clearInterval(poll);
  }, [isLinked]);

  const initiateSystemLink = async () => {
    if (dashboardRef.current?.requestFullscreen) await dashboardRef.current.requestFullscreen();
    setIsBooting(true);
    const logs = ["IGNITING CORE...", "LINKING NODES...", "ACCESS_GRANTED."];
    let i = 0;
    const interval = setInterval(() => {
      if (i < logs.length) { setBootLog(p => [...p, logs[i++]]); }
      else { clearInterval(interval); setTimeout(() => { setIsLinked(true); setIsBooting(false); }, 500); }
    }, 150);
  };

  const getHeadingStyle = (size: string = '14px') => ({
    color: theme.headerRed,
    fontFamily: "'Share Tech Mono', monospace",
    letterSpacing: "0px",
    textShadow: `0 0 15px ${theme.headerRed}`,
    fontWeight: 900,
    fontSize: size
  });

  if (!isLinked && !isBooting) {
    return (
      <div ref={dashboardRef} className="fixed inset-0 bg-black flex items-center justify-center z-[3000] font-['Share+Tech+Mono'] overflow-hidden">
        <MatrixRain />
        <div className="relative z-10 p-16 border-2 border-red-500/40 bg-black rounded-lg text-center shadow-[0_0_100px_rgba(255,0,0,0.2)]">
           <Unlink size={80} className="text-[#FF0000] mx-auto mb-10 animate-ping" />
           <h1 className="text-6xl uppercase italic mb-10" style={getHeadingStyle('64px')}>ACCESS RESTRICTED</h1>
           <button onClick={initiateSystemLink} className="w-full h-24 bg-[#FF0000]/10 border-2 border-[#FF0000]/60 hover:bg-[#FF0000] text-[#FF0000] hover:text-black transition-all uppercase font-black text-xl">ENTER DASHBOARD</button>
        </div>
      </div>
    );
  }

  return (
    <div ref={dashboardRef} className="fixed inset-0 bg-black overflow-hidden flex flex-col font-['Share+Tech+Mono']" style={{ fontFamily: "'Share Tech Mono', monospace" }}>
      <link href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap" rel="stylesheet" />
      <MatrixRain />
      
      {/*  ATMOSPHERICS  */}
      <div className="fixed inset-0 pointer-events-none z-[100] bg-[radial-gradient(circle_at_center,transparent_30%,rgba(255,0,0,0.15)_100%)]" />
      <div className="fixed inset-0 pointer-events-none z-[101] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] opacity-20" />
      
      <AnimatePresence>
        {isGlitching && <motion.div initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0, 0.8, 0] }} className="fixed inset-0 z-[5000] bg-white mix-blend-overlay pointer-events-none" />}
      </AnimatePresence>

      {/*  HEADER  */}
      <header className="h-16 border-b flex items-center justify-between px-10 bg-black/80 relative z-[110] backdrop-blur-xl" style={{ borderColor: `${theme.primary}44` }}>
        <div className="flex items-center gap-12">
          <div className="flex items-center gap-4">
             <div className="h-4 w-4 shadow-[0_0_20px_currentColor] animate-pulse" style={{ backgroundColor: theme.primary }} />
             <h1 className="uppercase italic" style={getHeadingStyle('20px')}>SECURITY DASHBOARD</h1>
          </div>
          <div className="flex gap-12">
             <TopStat label="ACTIVE (24H)" value={metrics.activeUsers} color={theme.primary} />
             <TopStat label="EFFICIENCY" value={`${metrics.matchEfficiency}%`} color={theme.primary} />
             <TopStat label="TOTAL USERS" value={metrics.totalUsers} color={theme.primary} />
          </div>
        </div>
        <div className="flex items-center gap-8">
           <button onClick={handleToggle} className="flex items-center gap-3 px-6 py-2.5 transition-all duration-700 bg-black/40 hover:bg-white/5 rounded" style={{ color: theme.primary, ...getHeadingStyle('12px') }}>
              <Zap size={14} className={isSecurityLocked ? "" : "animate-bounce"} />
              <span className="uppercase">{isSecurityLocked ? "PROTECTED" : "OVERRIDE ACTIVE"}</span>
           </button>
           <Link href="/home" className="h-10 w-10 flex items-center justify-center transition-all hover:bg-white/5 rounded">
              <Power size={18} style={{ color: theme.primary }} />
           </Link>
        </div>
      </header>

      {/*  MAIN CONTENT  */}
      <div className="flex-1 grid grid-cols-12 grid-rows-6 gap-px overflow-hidden relative z-10 bg-red-900/5">
         
         {/* LEFT PANEL: DEEP SCAN RADAR */}
         <div className="col-span-3 row-span-6 bg-black/80 border-r flex flex-col relative overflow-hidden" style={{ borderColor: `${theme.primary}22` }}>
            <div className="h-[200px] p-10 border-b" style={{ borderColor: `${theme.primary}22` }}>
               <h3 className="uppercase mb-8" style={getHeadingStyle('13px')}>Live Activity</h3>
               <div className="h-20 flex items-center gap-1 border-b-2 relative overflow-hidden" style={{ borderColor: `${theme.primary}11` }}>
                  {Array.from({ length: 48 }).map((_, i) => (
                    <motion.div key={i} animate={{ height: [`${30+Math.random()*60}%`, `${60+Math.random()*40}%`] }} transition={{ repeat: Infinity, duration: 1+Math.random() }} className="flex-1" style={{ backgroundColor: theme.primary }} />
                  ))}
               </div>
            </div>

            <div className="flex-1 p-10 space-y-8 flex flex-col relative bg-black/40">
               <div className="flex items-center justify-between">
                  <h3 className="uppercase" style={getHeadingStyle('15px')}>Global Scanner</h3>
                  <div className="flex items-center gap-2">
                     <span className="text-[10px] font-black animate-pulse" style={{ color: theme.primary }}>
                        {users.length > 0 ? "SYSTEM SCAN ACTIVE" : "SCANNING... NO NODES DETECTED"}
                     </span>
                     <TargetIcon size={14} className={cn("transition-all", users.length > 0 ? "animate-spin-slow" : "opacity-20")} style={{ color: theme.primary }} />
                  </div>
               </div>
               
               <div className="flex-1 flex items-center justify-center relative min-h-[400px]">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="absolute border-[1px] rounded-full transition-all duration-1000" style={{ width: `${(i+1)*12}%`, height: `${(i+1)*12}%`, borderColor: `${theme.primary}${11+(i*11)}` }} />
                  ))}
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} className="absolute inset-0 rounded-full origin-center" style={{ backgroundImage: `conic-gradient(from 0deg, ${theme.primary}aa, transparent)`, clipPath: "polygon(50% 50%, 100% 0, 100% 100%)", filter: "blur(2px)" }} />
                  
                  {users.map((user, idx) => {
                     // Distributed pseudo-random positions
                     const angle = (idx * 137.5) % 360; // Golden angle for even distribution
                     const radius = 15 + (idx % 4) * 10; // Varied scanning rings
                     const x = 50 + radius * Math.cos(angle * Math.PI / 180);
                     const y = 50 + radius * Math.sin(angle * Math.PI / 180);
                     
                     return (
                       <RadarDot 
                         key={user.id} 
                         x={x} 
                         y={y} 
                         label={user.full_name || "Anonymous Node"} 
                         color={theme.primary} 
                         blink={idx % 2 === 0} 
                       />
                     );
                  })}
               </div>
               <DiagMetric label="DIRECTION" value="142.4" color={theme.primary} />
            </div>
         </div>

         {/* CENTER HUB */}
         <div className="col-span-6 row-span-4 bg-black/20 flex items-center justify-center relative group overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,0,0,0.08)_0%,transparent_70%)]" />
            <div className="relative h-[650px] w-[650px] flex items-center justify-center">
               <div className="absolute inset-20 bg-red-900/10 blur-[120px] rounded-full" />
               <motion.div animate={{ rotate: 360, y: [-10, 10, -10], scale: [1, 1.02, 1] }} transition={{ rotate: { duration: 60, repeat: Infinity, ease: "linear" }, y: { duration: 4, repeat: Infinity, ease: "easeInOut" }, scale: { duration: 4, repeat: Infinity, ease: "easeInOut" } }} className="absolute inset-0 border-[1px] rounded-full transition-colors duration-1000" style={{ borderColor: `${theme.primary}44` }} />
               
               <div className="relative z-10 flex flex-col items-center">
                  <motion.div onClick={handleToggle} animate={{ borderColor: theme.primary, boxShadow: `0 0 80px ${theme.primary}22`, y: [-5, 5, -5] }} transition={{ y: { duration: 4, repeat: Infinity, ease: "easeInOut" } }} className="h-64 w-64 border-2 rounded-full flex items-center justify-center cursor-pointer bg-black/40 backdrop-blur-2xl">
                     <motion.div animate={{ color: theme.primary, filter: `drop-shadow(0 0 20px ${theme.primary})` }}>
                        {isSecurityLocked ? <Shield size={120} /> : <Network size={120} className="animate-pulse" />}
                     </motion.div>
                  </motion.div>
                  <div className="mt-14 text-center">
                     <motion.p className="uppercase" style={getHeadingStyle('52px')}>
                        {isSecurityLocked ? "PROTECTED" : "OVERRIDDEN"}
                     </motion.p>
                     <div className="mt-8 flex gap-6 justify-center">
                        <HackerBadge label="POSTS" value={metrics.totalPosts} />
                        <HackerBadge label="MEETUPS" value={metrics.totalMeetups} />
                     </div>
                  </div>
               </div>
            </div>
         </div>

         {/* RIGHT PANEL: NEURAL FEED INGRESS (ONLY POSTS NOW) */}
         <div className="col-span-3 row-span-6 bg-black/80 border-l flex flex-col relative overflow-hidden" style={{ borderColor: `${theme.primary}22` }}>
            <div className="px-10 py-10 border-b flex items-center justify-between bg-black/60" style={{ borderColor: `${theme.primary}11` }}>
               <h3 className="uppercase" style={getHeadingStyle('13px')}>Global Activity Feed</h3>
               <Radio size={16} className="text-emerald-500 animate-bounce" />
            </div>
            <div className="flex-1 relative overflow-hidden bg-black/40 overflow-y-auto no-scrollbar">
               <div className="p-8">
                  <div className="flex flex-col gap-6">
                        {posts.map((post, i) => (
                           <div key={i} className="border-l-4 pl-6 py-5 space-y-3 bg-white/5 rounded-r-lg relative overflow-hidden" style={{ borderColor: `${theme.secondary}66` }}>
                               <div className="flex justify-between items-center text-[10px] font-black uppercase">
                                  <span style={{ color: theme.primary }}>{post.type}</span>
                                  <span className="text-white/40">{new Date(post.created_at).toLocaleDateString()}</span>
                               </div>
                               <p className="text-white/90 text-[13px] leading-relaxed font-bold line-clamp-2">"{post.content || post.description}"</p>
                               <div className="flex items-center gap-4 pt-1">
                                  <div className="text-[9px] font-black uppercase text-white/30">{post.industry}</div>
                                  {post.budget && <div className="text-[9px] font-black uppercase text-emerald-500">${post.budget}</div>}
                               </div>
                           </div>
                        ))}
                  </div>
               </div>
            </div>
         </div>

         {/* BOTTOM PANEL: SUGGESTION TELEMETRY DASHBOARD */}
         <div className="col-span-6 row-span-2 bg-black border-t border-x flex flex-col overflow-hidden" style={{ borderColor: `${theme.primary}22` }}>
            <div className="px-10 py-4 border-b flex items-center justify-between bg-black/60 shrink-0" style={{ borderColor: `${theme.primary}22` }}>
               <h3 className="uppercase flex items-center gap-4" style={getHeadingStyle('14px')}>
                 Industry Pulse
                 <div className="flex gap-4 opacity-80 text-[10px] items-center">
                    <div className="flex gap-2">
                       {Object.entries(metrics.industryDist).slice(0, 4).map(([name, count]) => (
                          <span key={name} className="text-emerald-500">{name}: {count}</span>
                       ))}
                    </div>
                 </div>
               </h3>
               <Terminal size={18} style={{ color: theme.primary }} className="animate-pulse" />
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar relative bg-black/40 p-6">
               <table className="w-full text-left border-collapse">
                  <thead>
                     <tr className="border-b text-[10px] uppercase font-black opacity-50" style={{ borderColor: `${theme.primary}44`, color: theme.primary }}>
                        <th className="pb-2">Node ID</th>
                        <th className="pb-2">Full Name</th>
                        <th className="pb-2">Industry</th>
                        <th className="pb-2">Last Activity</th>
                        <th className="pb-2">Status</th>
                     </tr>
                  </thead>
                  <tbody>
                     {users.length === 0 ? (
                        <tr><td colSpan={5} className="text-center py-4 text-[10px] text-white/40 uppercase">No Active Nodes</td></tr>
                     ) : users.map((u: any, i: number) => (
                        <tr key={i} className="border-b text-[11px] font-bold uppercase transition-colors hover:bg-white/5" style={{ borderColor: `${theme.primary}22`, color: theme.secondary }}>
                           <td className="py-3">{u.id?.slice(0, 8)}</td>
                           <td className="py-3">{u.full_name || 'ANONYMOUS'}</td>
                           <td className="py-3">{u.industry || 'UNCATEGORIZED'}</td>
                           <td className="py-3">ACTIVE</td>
                           <td className="py-3">
                              <span className="px-2 py-1 rounded text-[9px] font-black bg-emerald-500/20 text-emerald-500">
                                 ONLINE
                              </span>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>
      </div>

      {/*  FOOTER  */}
      <footer className="h-12 border-t bg-black px-10 flex items-center justify-between shrink-0 relative z-[110]" style={{ borderColor: `${theme.primary}22` }}>
         <div className="flex gap-12 text-[11px] font-black text-white/10 uppercase">
            <span>Active Time: 14:22:04</span>
            <span style={{ color: theme.headerRed }}>SYSTEM ROOT SECURED</span>
         </div>
         <div className="flex items-center gap-3 text-[12px] font-black uppercase animate-pulse" style={{ color: theme.primary }}>
            {isSecurityLocked ? "SYSTEM SECURE" : "OVERRIDE ACTIVE"}
         </div>
      </footer>
    </div>
  );
}

//  MICRO COMPONENTS 

function TopStat({ label, value, color }: any) {
  return (
    <div className="flex flex-col items-center">
       <span className="text-[10px] font-black mb-1 opacity-40 uppercase" style={{ color: "#FF0000" }}>{label}</span>
       <span className="text-[26px] font-black tabular-nums transition-colors" style={{ color }}>{value}</span>
    </div>
  );
}

function HackerBadge({ label, value }: any) {
  return (
    <div className="px-6 py-2 border-2 border-red-500/20 bg-black/60 rounded-lg flex items-center gap-4">
       <span className="text-[10px] font-black opacity-30 uppercase text-red-500">{label}</span>
       <span className="text-[16px] font-black text-white">{value}</span>
    </div>
  );
}

function DiagMetric({ label, value, color }: any) {
  return (
    <div className="justify-between flex items-center">
       <p className="text-[10px] font-black opacity-20 uppercase" style={{ color: "#FF0000" }}>{label}</p>
       <p className="text-[15px] font-black uppercase" style={{ color }}>{value}</p>
    </div>
  );
}

function RadarDot({ x, y, label, color, blink }: any) {
  return (
    <div className="absolute pointer-events-none" style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}>
       <motion.div 
         animate={blink ? { opacity: [0.4, 1, 0.4], scale: [1, 1.2, 1] } : { opacity: 0.8 }} 
         transition={{ duration: 1.5, repeat: Infinity }} 
         className="h-2 w-2 rounded-full shadow-[0_0_15px_currentColor]" 
         style={{ backgroundColor: color }} 
       />
       <div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-col items-center">
          <div className="h-px w-6 mb-1" style={{ backgroundColor: `${color}44` }} />
          <span className="text-[9px] font-black uppercase whitespace-nowrap drop-shadow-lg" style={{ color: color, textShadow: `0 0 10px ${color}66` }}>
             {label}
          </span>
       </div>
    </div>
  );
}


