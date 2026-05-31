"use client";
import React, { useState, useEffect } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Link from "next/link";
import { 
  Settings, 
  User, 
  Bell, 
  Shield, 
  Smartphone, 
  Globe, 
  ArrowLeft, 
  ChevronRight,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Target
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { analytics } from "@/utils/analytics";

export default function SettingsHub() {
  return (
    <ProtectedRoute>
      <SettingsContent />
    </ProtectedRoute>
  );
}

function SettingsContent() {
  const { user: authUser, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (authUser) {
      analytics.trackScreen('SETTINGS', authUser.id);
      setIsLoading(false);
    }
  }, [authUser]);

  const handleLogout = async () => {
    await logout();
  };

  const sections = [
    { id: 'taxonomy', icon: Target, label: "Professional Identity", desc: "Set your industry and focus areas", href: "/settings/taxonomy" },
    { id: 'privacy', icon: User, label: "Account Privacy", desc: "Manage who sees your profile data" },
    { id: 'notifications', icon: Bell, label: "Simple Notifications", desc: "Control how you hear from people" },
    { id: 'security', icon: Shield, label: "Security & Safety", desc: "Two-factor and trusted devices" },
    { id: 'hub', icon: Globe, label: "Regional Settings", desc: "Set your default business hub" },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FDFDFF] flex items-center justify-center">
        <div className="h-10 w-10 border-4 border-[#292828]/10 border-t-[#E53935] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFDFF] selection:bg-[#E53935]/10 pb-40 lg:pb-20">
      <div className="max-w-[800px] mx-auto px-6 pt-16 lg:pt-24">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between mb-12">
          <Link href="/home" className="inline-flex items-center gap-2 text-[10px] font-black uppercase text-[#292828]/40 hover:text-[#E53935] transition-all group">
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
          </Link>
          <div className="px-3 py-1 bg-[#292828]/5 rounded-full text-[9px] font-black uppercase text-[#292828]/40 border border-[#292828]/5">
            City: {authUser?.city || 'Trivandrum'}
          </div>
        </div>
        
        {/* Header Block */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-8 mb-16 p-10 bg-white rounded-2xl border border-[#292828]/5 shadow-premium group relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-[#E53935]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
           <div className="h-24 w-24 bg-[#292828] text-white rounded-lg flex items-center justify-center shadow-2xl transition-all group-hover:rotate-6 group-hover:scale-105">
              <Settings size={48} className="animate-spin-slow" />
           </div>
           <div>
              <h1 className="text-4xl lg:text-5xl font-black text-[#292828] uppercase ">Settings</h1>
              <p className="text-[13px] font-bold text-[#666666] mt-2">Manage your profile settings and network identity.</p>
           </div>
        </div>

        {message && (
          <div className={cn(
            "mb-8 p-4 rounded-lg flex items-center gap-3 text-[13px] font-bold animate-in slide-in-from-top-2",
            message.type === 'success' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-red-50 text-red-600 border border-red-100"
          )}>
            {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            {message.text}
          </div>
        )}

        {/* Sections */}
        <div className="grid grid-cols-1 gap-4 mb-20">
           {sections.map(s => {
             const content = (
               <div className="w-full bg-white border border-[#292828]/5 rounded-lg p-8 flex items-center justify-between group hover:border-[#E53935]/20 hover:shadow-2xl hover:shadow-slate-200/40 transition-all text-left relative overflow-hidden active:scale-[0.99]">
                  <div className="flex items-center gap-6 relative z-10">
                     <div className="h-16 w-16 bg-[#292828]/5 rounded-lg flex items-center justify-center text-[#292828] group-hover:bg-[#E53935] group-hover:text-white transition-all shadow-sm">
                        <s.icon size={26} />
                     </div>
                     <div>
                        <h3 className="text-xl font-black text-[#292828] uppercase ">{s.label}</h3>
                        <p className="text-[13px] font-medium text-slate-200 mt-1">{s.desc}</p>
                     </div>
                  </div>
                  <ChevronRight size={24} className="text-[#292828]/20 group-hover:text-[#292828] group-hover:translate-x-1 transition-all z-10" />
               </div>
             );

             if (s.href) {
               return <Link key={s.id} href={s.href}>{content}</Link>;
             }

             return (
               <button key={s.id} onClick={() => {}} className="w-full">
                 {content}
               </button>
             );
           })}

           {/* Emergency Actions */}
           <div className="mt-8 pt-8 border-t border-[#292828]/5 space-y-4">
              <p className="px-4 text-[10px] font-black text-[#292828]/20 uppercase  mb-4">Account Controls</p>
              
              <Link href="/profile" className="w-full bg-white border border-[#292828]/5 rounded-lg p-6 flex items-center justify-between group hover:bg-[#292828] transition-all">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-[#292828]/5 flex items-center justify-center text-[#292828] group-hover:bg-white/10 group-hover:text-white transition-all"><User size={20} /></div>
                  <span className="text-sm font-bold text-[#292828] group-hover:text-white uppercase transition-all">Edit Profile</span>
                </div>
                <ChevronRight size={20} className="text-[#292828]/20 group-hover:text-white/40 transition-all" />
              </Link>

              <button 
                onClick={handleLogout}
                className="w-full bg-red-500/5 border border-red-500/10 rounded-lg p-6 flex items-center justify-between group hover:bg-[#E53935] transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center text-[#E53935] group-hover:bg-white/20 group-hover:text-white transition-all"><LogOut size={20} /></div>
                  <span className="text-sm font-bold text-[#E53935] group-hover:text-white uppercase transition-all">Logout</span>
                </div>
                <div className="px-3 py-1.5 bg-red-500/10 rounded-lg group-hover:bg-white/10">
                   <p className="text-[9px] font-black text-[#E53935] group-hover:text-white uppercase">Security</p>
                </div>
              </button>
           </div>
        </div>

        {/* Footer Audit */}
        <div className="mt-20 text-center pb-20">
           <p className="text-[10px] font-black text-[#292828]/10 uppercase  mb-2">Checkout Operating System V.7</p>
           <p className="text-[9px] font-bold text-slate-300 uppercase">Authorized Access Only</p>
        </div>
      </div>
    </div>
  );
}


