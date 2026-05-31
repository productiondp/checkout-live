"use client";

import React, { useState } from "react";
import { 
  Star, 
  X, 
  ShieldCheck, 
  Zap, 
  Sparkles,
  MessageSquare,
  Award
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";
import { DEFAULT_AVATAR } from "@/utils/constants";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
  onSuccess: () => void;
}

import { useAuth } from "@/hooks/useAuth";

export default function ReviewModal({ isOpen, onClose, booking, onSuccess }: ReviewModalProps) {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const supabase = createClient();

  if (!isOpen || !booking) return null;

  const handleSubmit = async () => {
    if (rating === 0) {
      alert("Please provide a performance score.");
      return;
    }

    setIsSubmitting(true);

    if (!user) {
      alert("Authentication required.");
      setIsSubmitting(false);
      return;
    }

    // 1. Submit Rating
    const { error } = await supabase
      .from('ratings')
      .insert([{
        receiver_id: booking.advisor_id,
        sender_id: user.id,
        booking_id: booking.id,
        score: rating,
        comment: comment
      }]);

    if (error) {
      alert("Submission failed: " + error.message);
    } else {
      // 2. Mark booking as COMPLETED if not already
      await supabase
        .from('bookings')
        .update({ status: 'COMPLETED' })
        .eq('id', booking.id);

      onSuccess();
      onClose();
    }
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-[#292828]/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="w-full max-w-lg bg-white rounded-2xl p-10 md:p-12 shadow-4xl animate-in zoom-in-95 duration-500 overflow-hidden relative z-10">
        
        {/* FIXED CLOSE BUTTON */}
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 h-12 w-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:text-black hover:bg-slate-100 transition-all z-50 shadow-sm"
        >
          <X size={24} />
        </button>

        <div className="text-center mb-10 relative z-10">
          <p className="text-[10px] font-black uppercase text-[#292828]/40  mb-4">Reviewing Session With</p>
          <div className="flex items-center justify-center gap-4 mb-4">
             <div className="h-16 w-16 rounded-lg overflow-hidden shadow-lg border-2 border-slate-50">
                <img src={booking.advisor?.avatar_url || DEFAULT_AVATAR} className="w-full h-full object-cover grayscale" alt="" />
             </div>
             <div className="text-left">
                <h3 className="text-xl font-black text-[#292828] leading-tight">{booking.advisor?.full_name || "Expert Advisor"}</h3>
                <span className="text-[10px] font-bold text-[#E53935] uppercase  flex items-center gap-1">
                   <ShieldCheck size={10} /> Verified Session
                </span>
             </div>
          </div>
        </div>

        <div className="space-y-10 relative z-10">
          {/* STAR RATING AREA */}
          <div className="flex flex-col items-center">
             <span className="text-[9px] font-black uppercase text-slate-400 mb-6 ">Performance Score</span>
             <div className="flex gap-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                    className="transition-all active:scale-90"
                  >
                    <Star 
                      size={36} 
                      className={cn(
                        "transition-all duration-300",
                        (hoverRating || rating) >= star 
                           ? "text-yellow-400 fill-yellow-400 drop-shadow-lg" 
                           : "text-slate-200"
                      )} 
                    />
                  </button>
                ))}
             </div>
             <p className="mt-4 text-[11px] font-bold text-[#292828]/60 italic h-4">
                 {rating === 5 ? "Exceptional Value" : 
                  rating === 4 ? "High Performance" : 
                  rating === 3 ? "Standard Delivery" : 
                  rating === 2 ? "Below Threshold" : 
                  rating === 1 ? "Needs Improvement" : ""}
             </p>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block  flex items-center gap-2">
               <MessageSquare size={12} /> Session Feedback
            </label>
            <textarea 
              rows={3} 
              placeholder="Describe the impact of this advisory session..." 
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full p-6 bg-slate-50 border border-slate-200 rounded-lg font-medium text-[#292828] outline-none focus:border-[#E53935] transition-all placeholder:text-slate-300" 
            />
          </div>
          
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full h-16 bg-[#292828] text-white rounded-2xl font-black text-xs uppercase  shadow-2xl hover:bg-[#E53935] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
          >
             {isSubmitting ? "Submitting..." : (
                <>Submit Review <Zap size={18} className="fill-white" /></>
             )}
          </button>
        </div>
      </div>
    </div>
  );
}
