"use client";

import React, { useState } from "react";

import ConnectButton from "@/components/ui/ConnectButton";
import { analytics } from "@/utils/analytics";
import { useAuth } from "@/hooks/useAuth";
import { useConnections } from "@/hooks/useConnections";
import { createClient } from "@/utils/supabase/client";
import { 
  Zap, 
  Target, 
  Users, 
  Sparkles, 
  MapPin, 
  Clock, 
  Bookmark,
  Share2,
  Pencil,
  Trash2,
  MoreHorizontal,
  ShieldCheck,
  CheckCircle2,
  GraduationCap,
  Briefcase,
  User,
  Calendar,
  IndianRupee,
  AlertCircle,
  Tag,
  MessageSquare,
  Activity
} from "lucide-react";
import { TrustBadge } from "@/components/trust/TrustBadge";
import { TrustInsights } from "@/components/trust/TrustInsights";
import MeetupPreviewModal from "@/components/modals/MeetupPreviewModal";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

interface UniversalFeedCardProps {
  post: any;
  currentUserId?: string;
  isExpanded?: boolean;
  onExpand?: () => void;
  onAction?: (post: any) => void;
  onEdit?: (post: any) => void;
  onDelete?: (post: any) => void;
  isNew?: boolean;
  isPublicPreview?: boolean;
}

const TYPE_CONFIG: Record<string, {
  icon: any;
  label: string;
  accentColor: string;
  gradient: string;
  bgColor: string;
  chipBg: string;
  chipText: string;
  ctaLabel: string;
  ctaBg: string;
  glowColor: string;
}> = {
  REQUIREMENT: {
    icon: Target,
    label: "Requirement",
    accentColor: "#F59E0B",
    gradient: "from-[#F59E0B] to-[#D97706]",
    bgColor: "bg-amber-50/50",
    chipBg: "bg-[#F5F5F7]",
    chipText: "text-amber-600",
    ctaLabel: "Respond",
    ctaBg: "bg-amber-500 hover:bg-amber-600 shadow-lg shadow-amber-500/20",
    glowColor: "rgba(245, 158, 11, 0.1)",
  },
  PARTNER: {
    icon: Sparkles,
    label: "Partner",
    accentColor: "#4F46E5",
    gradient: "from-[#4F46E5] to-[#4338CA]",
    bgColor: "bg-indigo-50/50",
    chipBg: "bg-[#F5F5F7]",
    chipText: "text-indigo-600",
    ctaLabel: "Start Building",
    ctaBg: "bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20",
    glowColor: "rgba(79, 70, 229, 0.1)",
  },
  MEETUP: {
    icon: Users,
    label: "Meetup",
    accentColor: "#E53935",
    gradient: "from-[#E53935] to-[#C62828]",
    bgColor: "bg-red-50/50",
    chipBg: "bg-[#F5F5F7]",
    chipText: "text-[#E53935]",
    ctaLabel: "Join Meetup",
    ctaBg: "bg-black hover:bg-zinc-800 shadow-xl",
    glowColor: "rgba(229, 57, 53, 0.1)",
  },
};



function normalizeType(type: string): keyof typeof TYPE_CONFIG {
  const map: Record<string, string> = {
    LEAD: "REQUIREMENT",
    HIRING: "REQUIREMENT",
    NEED: "REQUIREMENT",
    PARTNER: "PARTNER",
    PARTNERSHIP: "PARTNER",
    COLLAB: "PARTNER",
    MEETUP: "MEETUP",
    REQUIREMENT: "REQUIREMENT",
    meetup: "MEETUP"
  };
  return (map[type?.toUpperCase()] || "REQUIREMENT") as keyof typeof TYPE_CONFIG;
}

const HighlightTitle = React.memo(({ text }: { text: string }) => {
  if (!text || typeof text !== 'string') return null;
  
  const sentence = text.length > 0 
    ? text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
    : "";
  
  if (!sentence) return null;

  const thinWords = ["i", "need", "a", "an", "the", "for", "of", "with", "and"];
  const words = sentence.split(" ");
  
  return (
    <span className="leading-tight tracking-tight">
      {words.map((word, i) => {
        const cleanWord = word.toLowerCase().replace(/[.,!?;:]/g, "");
        const isThin = thinWords.includes(cleanWord);
        
        return (
          <React.Fragment key={i}>
            <span className={cn(
               isThin ? "font-light text-[#1D1D1F]/40" : "font-bold text-[#1D1D1F]"
            )}>
              {word}
            </span>
            {i < words.length - 1 ? " " : ""}
          </React.Fragment>
        );
      })}
    </span>
  );
});

HighlightTitle.displayName = "HighlightTitle";

const UniversalFeedCard = React.memo(({
  post,
  currentUserId,
  isExpanded,
  onExpand,
  onAction,
  onEdit,
  onDelete,
  isNew,
  isPublicPreview = false,
}: UniversalFeedCardProps) => {
  const [showMenu, setShowMenu] = React.useState(false);
  const [bookmarked, setBookmarked] = React.useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const router = useRouter();

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showMenu]);

  if (!post) return null;

  const { 
    type, title, authorName, author, avatar, time, location, matchScore, 
    badge, rank, context, relevanceLabel, relevanceSignals, distance 
  } = post;
  
  const nType = normalizeType(type);
  const isOwner = currentUserId === (author?.id || post.author_id);
  const cfg = TYPE_CONFIG[nType];
  
  const relevanceColor = 
    relevanceLabel === "Best opportunity" ? "emerald" :
    relevanceLabel === "Also useful for you" ? "red" : "slate";

  const score = matchScore || 50;
  const circumference = 2 * Math.PI * 18;

  const { user: authUser } = useAuth();
   const [participantCount, setParticipantCount] = React.useState(0);
   const [maxSlots, setMaxSlots] = React.useState(post.max_slots || 0);
   const [joinStatus, setJoinStatus] = React.useState<'IDLE' | 'JOINED' | 'FULL' | 'REQUESTED'>('IDLE');
   const [isJoining, setIsJoining] = React.useState(false);
   const [activeSignals, setActiveSignals] = React.useState<any[]>([]);
   const [isPreviewOpen, setIsPreviewOpen] = React.useState(false);
   const [countdown, setCountdown] = React.useState<string | null>(null);
 
   React.useEffect(() => {
     if (nType === 'MEETUP' && post.id && authUser) {
       const fetchMeetupData = async () => {
         const { MeetupService } = await import("@/services/meetup-service");
         const { conversionLearning } = await import("@/utils/conversion-learning");
         
         const status = await MeetupService.getMeetupStatus(post.id, authUser.id);
         setParticipantCount(status.count);
         setMaxSlots(status.maxSlots);
         setJoinStatus(status.status as any);

         if (post.dateTime) {
           const meetupTime = new Date(post.dateTime).getTime();
           const now = new Date().getTime();
           const diff = meetupTime - now;
           if (diff > 0 && diff < 86400000) {
              const hours = Math.floor(diff / 3600000);
              const minutes = Math.floor((diff % 3600000) / 60000);
              setCountdown(`${hours}:${minutes.toString().padStart(2, '0')}:00`);
           }
         }

         const available = [
           { type: 'SEAT_URGENCY', active: status.maxSlots > 0 && (status.count / status.maxSlots) >= 0.6 },
           { type: 'SOCIAL_PROOF', active: status.count >= 3 },
           { type: 'TIME_SENSITIVITY', active: post.metadata?.timeline === 'Today' }
         ];
         
         const selected = conversionLearning.selectSignals(available as any);
         setActiveSignals(selected);
         
         conversionLearning.trackImpression(post.id, selected);
       };
       fetchMeetupData();
     }
   }, [post.id, authUser?.id, nType]);
  
  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/p/${post.id}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: title,
          text: `Check out this ${cfg.label} opportunity on Checkout: ${title}`,
          url: shareUrl
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        // We could use a toast here, but simple alert fallback for desktop
        alert("Link copied to clipboard!");
      }
    } catch (err) {
      console.log("User cancelled share or error:", err);
    }
  };

  const handleJoin = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!authUser || isJoining || joinStatus === 'FULL') return;

    if (joinStatus === 'JOINED') {
      const { data: meetup } = await supabase.from('posts').select('room_id').eq('id', post.id).single();
      if (meetup?.room_id) {
        router.push(`/chat?room=${meetup.room_id}`);
      } else {
        alert("Group chat is being prepared. Check back in a moment.");
      }
      return;
    }

    setIsPreviewOpen(true);
  };

  const handleInteraction = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (authUser?.base_tag && post.base_tag) {
      analytics.trackInteraction(authUser.base_tag, post.base_tag, 'CLICK');
    }
  };

  const isTopPriority = post.tier === 1 && post.actionScore > 0.8;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, shadow: "0 25px 50px -12px rgba(0, 0, 0, 0.08)" }}
      onClick={(e) => {
        handleInteraction(e);
        if (nType === 'MEETUP') setIsPreviewOpen(true);
        else onExpand?.();
      }}
      className={cn(
        "group relative rounded-2xl border overflow-hidden transition-all duration-700 bg-white cursor-pointer",
        isOwner 
          ? "border-[#E53935]/10" 
          : isTopPriority
            ? "border-[#E53935]/20 shadow-[0_30px_70px_rgba(229,57,53,0.06)]"
            : "border-black/[0.04] hover:border-black/[0.1] shadow-sm",
        isExpanded && "ring-8 ring-[#E53935]/5"
      )}
    >
      {isOwner && (
        <div className="absolute top-0 right-0 px-5 py-2 bg-[#F5F5F7] text-[#86868B] text-[9px] font-black uppercase tracking-[0.2em] z-20 rounded-bl-2xl border-l border-b border-black/[0.03]">
           {post.hasNewActivity ? "New Activity" : "My Post"}
        </div>
      )}

      {!isOwner && (
        <div className={cn("absolute left-0 top-0 bottom-0 w-1.5 opacity-40 transition-all duration-500 group-hover:opacity-100", cfg.gradient.includes('amber') ? "bg-amber-500" : "bg-[#E53935]")} />
      )}

      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
           <div className="flex items-center gap-4">
              <div className="relative">
                 <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl overflow-hidden bg-slate-50 border border-black/[0.03] shadow-inner transition-transform duration-500 group-hover:scale-105">
                    {avatar 
                      ? <img src={avatar} className="h-full w-full object-cover" alt="" />
                      : <div className="h-full w-full flex items-center justify-center bg-slate-100"><User size={24} className="text-slate-300" /></div>
                    }
                 </div>
                 {post.author_profile?.metadata?.subscription_tier === "ADVISOR" && (
                    <div className="absolute -top-1.5 -right-1.5 h-6 w-6 bg-[#E53935] rounded-full border-4 border-white flex items-center justify-center shadow-lg">
                       <ShieldCheck size={12} className="text-white" />
                    </div>
                 )}
              </div>
              <div>
                 <div className="flex items-center gap-2.5 mb-0.5">
                    <h4 className="text-[16px] font-black uppercase tracking-tight text-[#1D1D1F]">
                       {post.author_profile?.username || post.author_profile?.full_name || authorName || "Member"}
                    </h4>
                    <span className="px-2 py-1 bg-slate-100 text-slate-500 text-[8px] font-bold tracking-wide rounded-md">
                       {rank || post.author_profile?.role || "Member"}
                    </span>
                 </div>
                  <div className="flex items-center gap-3.5 text-[10px] font-bold text-[#86868B] tracking-wide">
                    <span className="flex items-center gap-1.5">
                       <Clock size={11} className={cn("text-[#E53935]/40", isNew && "text-emerald-500 animate-pulse")} /> 
                       {isNew ? <span className="text-emerald-500 font-black">Just now</span> : time}
                    </span>
                    <div className="h-1 w-1 rounded-full bg-slate-200" />
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (post.metadata?.geo) {
                          router.push(`/map?lat=${post.metadata.geo.lat}&lng=${post.metadata.geo.lng}`);
                        } else {
                          router.push(`/map?search=${encodeURIComponent(location || "Trivandrum")}`);
                        }
                      }}
                      className="flex items-center gap-1.5 cursor-pointer hover:text-[#E53935] transition-colors"
                    >
                       <MapPin size={11} className="text-[#E53935]/40" /> {location || "Remote"}
                       {distance !== undefined && distance !== null && (
                         <span className="text-[#34C759] font-black">  {distance < 1 ? "< 1 km" : `${distance.toFixed(1)} km`}</span>
                       )}
                    </div>
                  </div>
              </div>
           </div>

           {!isOwner && (
              <div className="flex flex-col items-end">
                 <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-black/[0.02] rounded-full">
                    <div className="flex gap-0.5">
                       {[1,2,3,4,5].map(i => (
                          <div key={i} className={cn("h-1.5 w-1.5 rounded-full", i <= Math.ceil(score/20) ? "bg-[#E53935]" : "bg-slate-200")} />
                       ))}
                    </div>
                    <span className="text-[9px] font-bold text-[#1D1D1F] tracking-wide">{score}% Match</span>
                 </div>
                 {relevanceLabel && (
                    <span className="text-[7px] font-bold text-[#E53935] tracking-wide mt-1.5 mr-1.5">{relevanceLabel}</span>
                 )}
              </div>
           )}
        </div>

        <div className="space-y-4 mb-6">
           <div className="space-y-2.5">
              <div className="flex items-center gap-2.5">
                 <div className={cn("px-2.5 py-1 rounded-md text-[9px] font-bold tracking-wide border", cfg.chipBg, cfg.chipText, "border-black/[0.03]")}>
                    {cfg.label}
                 </div>
                 {post.nudge && (
                    <div className="text-[9px] font-bold text-[#34C759] tracking-wide flex items-center gap-1.5">
                       <Zap size={9} className="fill-[#34C759]" /> {post.nudge}
                    </div>
                 )}
              </div>
              <h3 className="text-lg sm:text-xl lg:text-2xl text-[#1D1D1F] leading-tight transition-colors duration-500">
                 <HighlightTitle text={title} />
              </h3>
           </div>
           
           {post.content && post.content.trim() !== title.trim() && (
              <p className="text-[13px] sm:text-[14px] font-medium text-[#86868B] leading-relaxed max-w-2xl line-clamp-2">
                 {post.content}
              </p>
           )}
        </div>

        <div className="flex flex-wrap gap-2.5 mb-6 pb-6 border-b border-black/[0.03]">
           {nType === "REQUIREMENT" && (
              <>
                 {post.budget && <MetaChip icon={IndianRupee} label={post.budget} isPrimary />}
                 {post.urgency && <MetaChip icon={Activity} label={post.urgency} />}
                 {post.skills_required?.map((s: string) => <MetaChip key={s} icon={Tag} label={s} />)}
              </>
           )}
           {nType === "MEETUP" && (
              <>
                 <MetaChip icon={Calendar} label={post.dateTime ? `Today  ${post.dateTime.split(' ')[1]}` : "Strategic Timing"} isPrimary />
                 <MetaChip icon={Users} label={`${maxSlots - participantCount} spots left`} />
                 {post.metadata?.meetup_type === 'ADVISOR' && <MetaChip icon={ShieldCheck} label="Advisor-led" className="bg-[#E53935]/5 text-[#E53935] border-[#E53935]/10" />}
                 {countdown && <MetaChip icon={Clock} label={`Starts in ${countdown}`} className="bg-amber-50 text-amber-600 border-amber-100" />}
              </>
           )}
           {nType === "PARTNER" && (
              <>
                 <MetaChip icon={Sparkles} label={post.partnershipType || "Collab"} isPrimary />
                 <MetaChip icon={Briefcase} label={post.industry || "Market"} />
              </>
           )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
           {!isOwner ? (
              <div className="flex items-center gap-2.5 px-4 py-2.5 bg-emerald-50/50 border border-emerald-100 rounded-xl self-start sm:self-auto">
                 <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[9px] font-bold text-emerald-700 tracking-wide">Active Partner</span>
              </div>
           ) : <div />}

            <div className="flex items-center gap-2.5 w-full sm:w-auto ml-auto justify-end">
               <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleShare}
                  className="h-10 w-10 rounded-lg border border-black/[0.05] text-[#86868B] flex items-center justify-center hover:bg-slate-50 transition-all shrink-0"
               >
                  <Share2 size={14} />
               </motion.button>

               {!isOwner ? (
                  <div className="flex items-center gap-2 min-w-0">
                     <div className="flex items-center gap-2">
                        <motion.button
                           whileTap={{ scale: 0.9 }}
                           onClick={(e) => { e.stopPropagation(); setBookmarked(!bookmarked); }}
                           className={cn(
                              "h-10 w-10 rounded-lg border flex items-center justify-center transition-all shrink-0",
                              bookmarked ? "bg-amber-500 border-amber-500 text-white" : "border-black/[0.05] text-[#86868B] hover:bg-slate-50"
                           )}
                        >
                           <Bookmark size={14} fill={bookmarked ? "currentColor" : "none"} />
                        </motion.button>
                        {nType !== 'MEETUP' && (
                           <ConnectButton 
                              targetId={author?.id || post.author_id} 
                              size="sm"
                              disabled={isPublicPreview}
                           />
                        )}
                     </div>

                     <motion.button
                        whileHover={isPublicPreview ? {} : { scale: 1.02 }}
                        whileTap={isPublicPreview ? {} : { scale: 0.98 }}
                        onClick={isPublicPreview ? undefined : handleJoin}
                        disabled={isPublicPreview}
                        className={cn(
                           "h-10 px-6 sm:px-8 rounded-lg text-[10px] font-black tracking-widest text-white transition-all shadow-lg min-w-0",
                           isPublicPreview ? "bg-gray-200 text-gray-400 shadow-none cursor-not-allowed" : (
                              nType === 'MEETUP' 
                                ? (joinStatus === 'JOINED' ? "bg-emerald-600 shadow-emerald-600/20" : "bg-black shadow-black/10")
                                : "bg-[#E53935] shadow-red-500/20"
                           )
                        )}
                     >
                        <div className="flex items-center justify-center gap-2 min-w-0">
                           {nType === 'MEETUP' ? <Users size={14} className="shrink-0" /> : <MessageSquare size={14} className="shrink-0" />}
                           <span className="truncate">
                              {isPublicPreview ? "Join Now" : (
                                nType === 'MEETUP' ? (
                                   joinStatus === 'JOINED' ? "Chat Open" : 
                                   joinStatus === 'REQUESTED' ? "Pending" : 
                                   joinStatus === 'FULL' ? "Full" : "Join"
                                ) : "Respond"
                              )}
                           </span>
                        </div>
                     </motion.button>
                  </div>
               ) : (
                  <div className="flex items-center gap-2">
                     <button 
                        onClick={(e) => { e.stopPropagation(); onEdit?.(post); }}
                        className="h-10 px-6 rounded-lg border border-black/[0.05] text-[10px] font-black tracking-widest text-[#86868B] hover:bg-slate-50 transition-all"
                     >
                        Edit
                     </button>
                     <button 
                        onClick={(e) => { e.stopPropagation(); setShowConfirmDelete(true); }}
                        className="h-10 px-6 rounded-lg border border-red-100 text-[10px] font-black tracking-widest text-red-500 hover:bg-red-50 transition-all"
                     >
                        Delete
                     </button>
                  </div>
               )}
            </div>
        </div>
      </div>

      {/* DELETE CONFIRMATION OVERLAY */}
      <AnimatePresence>
         {showConfirmDelete && (
            <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="absolute inset-0 z-[100] bg-white/95 backdrop-blur-md flex flex-col items-center justify-center p-10 text-center"
            >
               <h4 className="text-2xl font-black uppercase italic tracking-tighter mb-4">Delete Post?</h4>
               <div className="flex gap-4 w-full max-w-xs">
                  <button onClick={() => setShowConfirmDelete(false)} className="flex-1 h-14 rounded-2xl bg-slate-100 text-slate-500 text-[11px] font-black uppercase tracking-widest">Keep</button>
                  <button onClick={() => onDelete?.(post)} className="flex-1 h-14 rounded-2xl bg-[#E53935] text-white text-[11px] font-black uppercase tracking-widest shadow-xl shadow-red-500/20">Remove</button>
               </div>
            </motion.div>
         )}
      </AnimatePresence>
      {/* MEETUP PREVIEW MODAL */}
      <MeetupPreviewModal 
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        meetup={post}
        currentUserId={authUser?.id}
        onJoinSuccess={(newStatus, roomId) => {
          setJoinStatus(newStatus as any);
          if (newStatus === 'JOINED') setParticipantCount(prev => prev + 1);
        }}
      />
    </motion.div>
  );
});

UniversalFeedCard.displayName = "UniversalFeedCard";
export default UniversalFeedCard;

const MetaChip = React.memo(({ icon: Icon, label, isPrimary, className }: { icon: any; label: string; isPrimary?: boolean; className?: string }) => {
  return (
    <div className={cn(
       "inline-flex items-center gap-2.5 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all border",
       isPrimary 
         ? "bg-slate-50 border-black/[0.03] text-[#1D1D1F]" 
         : "bg-white border-black/[0.02] text-[#86868B]",
       className
    )}>
       <Icon size={13} className={isPrimary ? "text-[#E53935]" : "text-slate-300"} />
       {label}
    </div>
  );
});

MetaChip.displayName = "MetaChip";
