"use client";

import React, { useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight, Loader2, ShieldCheck, Zap, Users, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import UniversalFeedCard from '@/components/ui/UniversalFeedCard';
import { useAuth } from '@/hooks/useAuth';

import Image from 'next/image';

export default function PublicPostView({ post }: { post: any }) {
  const router = useRouter();
  const { state, isAuthResolved } = useAuth();

  useEffect(() => {
    if (isAuthResolved && state.tag === 'authenticated') {
      router.replace(`/home?post=${post.id}`);
    }
  }, [state.tag, isAuthResolved, router, post.id]);

  const handleSignupRedirect = () => {
    router.push('/?mode=signup');
  };

  if (!isAuthResolved || state.tag === 'authenticated') {
    return (
      <div className="min-h-screen bg-[#FDFDFF] flex items-center justify-center">
         <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
         >
            <Loader2 size={32} className="text-[#E53935]" />
         </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFDFF] font-sans flex flex-col relative overflow-hidden">
       {/* High-Fidelity Background Architecture */}
       <div className="absolute inset-0 z-0">
          <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-gradient-to-br from-red-500/10 to-transparent blur-[140px] rounded-full animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-gradient-to-tr from-indigo-500/10 to-transparent blur-[140px] rounded-full" />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.02] pointer-events-none" />
       </div>

       {/* Premium Navigation */}
       <nav className="h-[90px] px-6 lg:px-12 flex items-center justify-between sticky top-0 z-50 bg-white/40 backdrop-blur-xl border-b border-black/[0.03]">
          <Link href="/" className="group">
             <Image 
                src="/logo.png" 
                alt="Checkout Logo" 
                width={280} 
                height={70} 
                className="h-14 w-auto object-contain transition-transform group-hover:scale-105" 
                priority
             />
          </Link>
          <div className="flex items-center gap-6">
             <span className="hidden md:block text-[11px] font-black uppercase tracking-widest text-gray-400">Join the Elite Network</span>
             <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSignupRedirect}
                className="h-11 px-8 bg-[#E53935] hover:bg-[#B71C1C] text-white text-[11px] font-black uppercase tracking-widest rounded-xl transition-all shadow-xl shadow-red-500/20"
             >
                Join Network
             </motion.button>
          </div>
       </nav>

       <main className="flex-1 flex flex-col items-center pt-16 pb-32 px-4 z-10">
          {/* Viral Spotlight Header */}
          <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             className="text-center mb-16 space-y-6 max-w-3xl"
          >
             <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white border border-black/[0.05] shadow-sm">
                <div className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1D1D1F]">Network Spotlight</span>
             </div>
             
             <h1 className="text-4xl lg:text-6xl font-bold text-[#1D1D1F] tracking-tighter leading-[0.9] lg:px-12">
                Great things happen when <span className="text-[#E53935]">experts connect.</span>
             </h1>
             
             <p className="text-lg text-[#86868B] font-medium max-w-xl mx-auto leading-relaxed">
                You've been invited to view an exclusive opportunity from the Checkout Network. Join to respond.
             </p>
          </motion.div>

          {/* The Hero Card Spotlight */}
          <div className="w-full max-w-[740px] relative">
             <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="relative z-20 rounded-2xl p-1.5 bg-gradient-to-b from-white to-gray-50/50 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-white"
             >
                <div className="rounded-2xl overflow-hidden bg-white">
                   {/* Card is now FULLY VISIBLE and CLEAR, but actions are disabled */}
                   <UniversalFeedCard post={post} currentUserId="guest" isPublicPreview={true} />
                </div>
             </motion.div>

             {/* Dynamic CTA Banner below the card */}
             <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-12 bg-white/90 backdrop-blur-2xl p-10 rounded-2xl border border-black/[0.03] shadow-2xl w-full text-center relative z-30"
             >
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                   <div className="text-left space-y-2">
                      <h3 className="text-2xl font-bold text-[#1D1D1F]">Ready to join the conversation?</h3>
                      <p className="text-[#86868B] font-medium text-[15px] max-w-sm">
                         Connect directly with {post.authorName?.split(' ')[0] || 'this member'} and thousands of others on the OS.
                      </p>
                   </div>
                   
                   <motion.button 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleSignupRedirect}
                      className="h-16 px-12 bg-[#E53935] hover:bg-[#B71C1C] text-white font-black uppercase tracking-[0.2em] text-[11px] rounded-2xl transition-all flex items-center justify-center gap-4 shadow-2xl shadow-red-500/30 whitespace-nowrap"
                   >
                      Get Instant Access <ArrowRight size={18} />
                   </motion.button>
                </div>
             </motion.div>

             {/* Decorative Elements */}
             <div className="absolute -top-12 -right-12 h-32 w-32 bg-red-500/10 blur-3xl rounded-full" />
             <div className="absolute -bottom-12 -left-12 h-32 w-32 bg-indigo-500/10 blur-3xl rounded-full" />
          </div>

          {/* Trust Architecture Section */}
          <motion.div 
             initial={{ opacity: 0 }}
             whileInView={{ opacity: 1 }}
             viewport={{ once: true }}
             className="mt-24 grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-16 w-full max-w-4xl"
          >
             <div className="flex flex-col items-center gap-3 text-center">
                <div className="h-12 w-12 rounded-2xl bg-white border border-black/[0.05] flex items-center justify-center text-red-500 shadow-sm">
                   <ShieldCheck size={24} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Verified Pros</span>
             </div>
             <div className="flex flex-col items-center gap-3 text-center">
                <div className="h-12 w-12 rounded-2xl bg-white border border-black/[0.05] flex items-center justify-center text-indigo-500 shadow-sm">
                   <Zap size={24} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Instant Access</span>
             </div>
             <div className="flex flex-col items-center gap-3 text-center">
                <div className="h-12 w-12 rounded-2xl bg-white border border-black/[0.05] flex items-center justify-center text-amber-500 shadow-sm">
                   <Users size={24} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Global Network</span>
             </div>
             <div className="flex flex-col items-center gap-3 text-center">
                <div className="h-12 w-12 rounded-2xl bg-white border border-black/[0.05] flex items-center justify-center text-emerald-500 shadow-sm">
                   <Globe size={24} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Edge Ready</span>
             </div>
          </motion.div>
       </main>

       {/* Premium Footer Footer */}
       <footer className="py-12 border-t border-black/[0.03] text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">
             © 2026 Checkout Operating System • Built for Commerce
          </p>
       </footer>
    </div>
  );
}
