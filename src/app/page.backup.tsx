"use client";
import React, { useState, Suspense, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import LandingHeader from "@/components/layout/LandingHeader";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  User,
  Briefcase,
  Award,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Loader2,
  Terminal,
  Search,
  Users,
  PlayCircle,
  BookOpen,
  ChevronRight,
  X,
  Lock as LockIcon,
  ShieldCheck as ShieldIcon
} from "lucide-react";
import AuthSubmissionStatus, { AuthSubmissionState } from "@/components/auth/AuthSubmissionStatus";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";
import { useAuth, useAuthGuard } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";

type AuthMode = "signin" | "signup";
type Role = "Business" | "Professional" | "Student" | "Advisor";

const ROLES: { value: Role; icon: any; desc: string }[] = [
  { value: "Business", icon: Briefcase, desc: "Hire and grow" },
  { value: "Professional", icon: User, desc: "Work and help" },
  { value: "Advisor", icon: ShieldCheck, desc: "Give advice" },
  { value: "Student", icon: Award, desc: "Learn and grow" },
];

function AuthContent() {
  const { state, isAuthResolved, login, signup } = useAuth();

  //  DECENTRALIZED GUEST GUARD
  useAuthGuard('unauthenticated');
  
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<AuthMode>((searchParams.get("mode") as AuthMode) || "signup");
  const [role, setRole] = useState<Role>("Business");
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "", fullName: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [submissionState, setSubmissionState] = useState<AuthSubmissionState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isRoleOpen, setIsRoleOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const supabase = createClient();

  useEffect(() => { setMounted(true); }, []);

  //  ROLE DROP-DOWN FLASH ANIMATION 
  useEffect(() => {
    if (mode === "signup" && mounted) {
      setIsRoleOpen(true);
      const timer = setTimeout(() => setIsRoleOpen(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [mode, mounted]);

  //  STRATEGIC PRELOADER (V1.0)
  useEffect(() => {
    if (mounted) {
      fetch('/api/public-feed').catch(() => {});
    }
  }, [mounted]);

  if (!mounted) return null;

  const friendlyAuthError = (err: any): string => {
    const msg = (err?.message || "").toLowerCase();
    const code = err?.code || "";
    if (msg.includes("invalid login credentials") || msg.includes("invalid credentials") || msg.includes("invalid email or password") || code === "invalid_credentials")
      return "Email or password is incorrect. Please try again.";
    if (msg.includes("email not confirmed") || msg.includes("confirm your email") || code === "email_not_confirmed")
      return "Please confirm your email address to continue.";
    return err?.message || "An error occurred. Please try again.";
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    setError(null);

    const watchdog = setTimeout(() => {
      if (isLoading) {
        setIsLoading(false);
        setSubmissionState('FAILED');
        setError("Authentication is taking longer than expected. Please check your connection.");
      }
    }, 5000);

    try {
      const overlayTimer = setTimeout(() => {
        if (!isSuccess) setSubmissionState('VERIFYING');
      }, 300);

      if (mode === "signup") {
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: { data: { full_name: formData.fullName || "New Member", role: role.toUpperCase() } },
        });
        if (signUpError) throw signUpError;
        
        if (authData.user) {
          await supabase.from("profiles").upsert({
            id: authData.user.id,
            full_name: formData.fullName || "New Member",
            role: role.toUpperCase(),
            location: "Trivandrum",
          });
        }
        if (!authData.session) await login(formData.email, formData.password);
      } else {
        await login(formData.email, formData.password);
      }
      setTimeout(() => setSubmissionState(null), 500);
    } catch (err: any) {
      const isAlreadyRegistered = err.message?.toLowerCase().includes("already registered");
      if (isAlreadyRegistered) {
        setSubmissionState(null);
        try { await login(formData.email, formData.password); return; } catch (loginErr) {}
      }
      console.error("[AUTH] Nuclear Failure:", err);
      clearTimeout(watchdog);
      setSubmissionState('FAILED');
      setError(friendlyAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#000000] font-sans selection:bg-[#E53935]/10 relative overflow-x-hidden">
      <LandingHeader 
         onJoinClick={() => setMode("signup")} 
         onSigninClick={() => setMode("signin")} 
      />

      <main className="pt-[90px] lg:pt-[130px] pb-16 lg:pb-[78px] overflow-x-hidden">
         <div className="max-w-[1128px] mx-auto px-6 flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-[95px]">
            <div className="w-full lg:w-1/2 space-y-6 lg:space-y-8 order-2 lg:order-1">
               <h1 className="text-4xl md:text-6xl lg:text-7xl tracking-tighter leading-[0.9] lg:leading-[0.85] mb-4 lg:mb-8 text-center lg:text-left">
                  <span className="font-thin text-black/60 uppercase">Connect. Grow.</span> <br />
                  <span className="font-bold text-[#E53935] uppercase">Succeed.</span>
               </h1>

               {mounted && (
                 <AnimatePresence mode="wait">
                    {!isAuthResolved ? (
                      <motion.div
                        key="verifying"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="w-full max-w-[400px] mx-auto lg:mx-0 py-8 lg:py-10 flex flex-col items-center gap-6 lg:gap-8 text-center"
                      >
                        <div className="relative h-20 w-20 lg:h-28 lg:w-28 flex items-center justify-center">
                          <motion.div
                            animate={{ scale: [1, 1.08, 1], opacity: [0.15, 0.3, 0.15] }}
                            transition={{ duration: 3, repeat: Infinity }}
                            className="absolute inset-0 bg-[#E53935] rounded-full blur-2xl"
                          />
                          <div className="relative h-16 w-16 lg:h-20 lg:w-20 rounded-2xl lg:rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center shadow-lg shadow-red-100">
                            <ShieldCheck size={24} className="text-[#E53935] relative z-10" strokeWidth={2} />
                          </div>
                        </div>
                        <div className="space-y-2 lg:space-y-3">
                          <motion.h2 className="text-2xl lg:text-[28px] font-black uppercase tracking-tighter leading-none italic text-[#E53935]">Verifying Identity</motion.h2>
                          <p className="text-[9px] lg:text-[10px] font-black text-black/20 uppercase tracking-[0.3em]">Connecting to the secure network</p>
                        </div>
                      </motion.div>
                    ) : submissionState ? (
                      <motion.div
                        key="submitting"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="w-full max-w-[400px] mx-auto lg:mx-0 py-8 lg:py-10 flex flex-col items-center gap-6 lg:gap-8 text-center"
                      >
                        <div className="relative h-20 w-20 lg:h-28 lg:w-28 flex items-center justify-center">
                          <motion.div
                            animate={{ scale: [1, 1.08, 1], opacity: [0.1, 0.25, 0.1] }}
                            transition={{ duration: 3, repeat: Infinity }}
                            className={`absolute inset-0 rounded-full blur-2xl ${submissionState === 'FAILED' ? 'bg-red-500' : 'bg-[#E53935]'}`}
                          />
                          <div className="relative h-16 w-16 lg:h-20 lg:w-20 rounded-2xl lg:rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center shadow-lg shadow-red-100">
                            {submissionState === 'FAILED' ? <X size={24} className="text-[#E53935]" strokeWidth={2.5} /> : <ShieldCheck size={24} className="text-[#E53935] relative z-10 animate-pulse" strokeWidth={2} />}
                          </div>
                        </div>
                        <div className="space-y-2 lg:space-y-3">
                          <h2 className="text-2xl lg:text-[28px] font-black uppercase tracking-tighter leading-none italic text-[#E53935]">{submissionState === 'FAILED' ? (mode === 'signup' ? 'Setup Failed' : 'Login Failed') : 'Verifying Identity'}</h2>
                          <p className="text-[9px] lg:text-[10px] font-black text-black/20 uppercase tracking-[0.3em]">{submissionState === 'FAILED' ? 'Review the details below and try again' : 'Connecting to the secure network'}</p>
                          {error && <div className="bg-red-50 border border-red-100 text-[#E53935] px-4 py-2 rounded-xl text-[9px] lg:text-[10px] font-bold uppercase tracking-wider inline-block">{error}</div>}
                        </div>
                        {submissionState === 'FAILED' && <button onClick={() => { setSubmissionState(null); setError(null); }} className="h-12 px-8 bg-[#1A1A1A] text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-black transition-all">Try Again</button>}
                      </motion.div>
                    ) : !isSuccess ? (
                      <motion.div key="form" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 w-full max-w-[400px] mx-auto lg:mx-0">
                         <form onSubmit={handleSubmit} className="space-y-4">
                            {mode === "signup" && (
                               <div className="space-y-4">
                                  <div className="space-y-1.5 relative">
                                     <label className="text-[11px] lg:text-[12px] font-bold text-gray-900 ml-1">I am a...</label>
                                     <div className="relative">
                                        <button 
                                          type="button" 
                                          onClick={() => setIsRoleOpen(!isRoleOpen)} 
                                          className="w-full h-12 lg:h-14 px-5 lg:px-6 border border-gray-200 rounded-xl lg:rounded-2xl hover:border-black focus:border-[#E53935] outline-none transition-all bg-white font-bold text-[12px] lg:text-[13px] flex items-center justify-between group"
                                        >
                                          <div className="flex items-center gap-3">
                                            <div className="text-[#E53935]">
                                              {(() => { 
                                                const activeRole = ROLES.find(r => r.value === role); 
                                                const Icon = activeRole?.icon || User; 
                                                return <Icon size={18} />; 
                                              })()}
                                            </div>
                                            <span>{role}</span>
                                          </div>
                                          <ChevronRight size={14}  className={cn("transition-transform", isRoleOpen ? "-rotate-90" : "rotate-90")} />
                                        </button>
                                        <AnimatePresence>
                                          {isRoleOpen && (
                                            <motion.div 
                                              initial={{ opacity: 0, y: -10 }} 
                                              animate={{ opacity: 1, y: 0 }} 
                                              exit={{ opacity: 0, y: -10 }} 
                                              className="absolute top-[115%] inset-x-0 bg-white border border-gray-100 rounded-2xl shadow-2xl z-[60] py-2 overflow-hidden"
                                            >
                                              {ROLES.map(r => (
                                                <button 
                                                  key={r.value} 
                                                  type="button" 
                                                  onClick={() => { setRole(r.value); setIsRoleOpen(false); }} 
                                                  className={cn(
                                                    "w-full px-5 py-3 flex items-center gap-3 hover:bg-red-50 transition-colors text-left", 
                                                    role === r.value ? "bg-red-50 text-[#E53935]" : "text-gray-700"
                                                  )}
                                                >
                                                  <r.icon size={18} className={role === r.value ? "text-[#E53935]" : "text-gray-400"} />
                                                  <div className="flex flex-col">
                                                    <span className="text-[12px] lg:text-[13px] font-bold">{r.value}</span>
                                                    <span className="text-[9px] lg:text-[10px] opacity-60 font-medium">{r.desc}</span>
                                                  </div>
                                                </button>
                                              ))}
                                            </motion.div>
                                          )}
                                        </AnimatePresence>
                                     </div>
                                  </div>
                                  <div className="space-y-1.5">
                                    <label className="text-[11px] lg:text-[12px] font-bold text-gray-900 ml-1">Full name</label>
                                    <input type="text" name="fullName" value={formData.fullName} onChange={handleInput} placeholder="John Doe" className="w-full h-11 lg:h-12 px-5 bg-white border border-gray-300 rounded-lg focus:border-[#E53935] outline-none transition-all font-medium text-sm lg:text-[14px]" required />
                                  </div>
                               </div>
                            )}
                            <div className="space-y-1.5"><label className="text-[11px] lg:text-[12px] font-bold text-gray-900 ml-1">Email</label><input type="email" name="email" value={formData.email} onChange={handleInput} placeholder="name@company.com" className="w-full h-11 lg:h-12 px-5 bg-white border border-gray-300 rounded-lg focus:border-[#E53935] outline-none transition-all font-medium text-sm lg:text-[14px]" required /></div>
                            <div className="space-y-1.5"><label className="text-[11px] lg:text-[12px] font-bold text-gray-900 ml-1">Password</label><div className="relative group"><input type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleInput} placeholder="••••••" className="w-full h-11 lg:h-12 px-5 bg-white border border-gray-300 rounded-lg focus:border-[#E53935] outline-none transition-all font-medium text-sm lg:text-[14px] pr-12" required /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#E53935] transition-all p-1">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></div>
                            {error && <p className="text-red-600 text-[10px] lg:text-xs font-bold px-1">{error}</p>}
                            <button type="submit" disabled={isLoading} className="w-full h-12 lg:h-14 bg-[#E53935] text-white font-bold rounded-xl shadow-lg hover:bg-[#D32F2F] transition-all flex items-center justify-center gap-3 mt-4 lg:mt-6">{isLoading ? <Loader2 size={18} className="animate-spin" /> : (mode === "signup" ? "Agree & join" : "Sign in")}</button>
                         </form>
                         <p className="text-[11px] lg:text-xs text-center text-gray-500">{mode === "signup" ? "Already on Checkout?" : "New to Checkout?"} <button onClick={() => setMode(mode === "signup" ? "signin" : "signup")} className="text-[#E53935] font-bold hover:underline ml-1">{mode === "signup" ? "Sign in" : "Join now"}</button></p>
                      </motion.div>
                    ) : <div className="py-10 space-y-4 text-center lg:text-left"><CheckCircle2 size={48} className="text-[#E53935] mx-auto lg:mx-0" /><h2 className="text-2xl font-bold">Welcome!</h2><p className="text-gray-500">Going to your dashboard...</p></div>}
                 </AnimatePresence>
               )}
            </div>

            <div className="hidden lg:block w-1/2">
               <img src="/antigravity-hero.png" alt="Professional Networking" className="w-full h-auto" />
            </div>
         </div>
      </main>

      <section className="bg-[#FFFFFF] border-t border-black/[0.04] py-12 lg:py-24">
         <div className="max-w-[1128px] mx-auto px-6">
            <div className="mb-8 lg:mb-10 text-center lg:text-left">
               <p className="text-[9px] lg:text-[10px] font-black uppercase tracking-[0.2em] lg:tracking-[0.25em] text-[#E53935] mb-2 lg:mb-3">Discover the Network</p>
               <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#1D1D1F] tracking-tighter leading-tight">Find the right people,<br className="hidden lg:block" /> businesses and opportunities.</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
               {[
                 { label: "Engineering", icon: "⚙️" }, { label: "Business Dev", icon: "📈" }, { label: "Finance", icon: "💰" }, { label: "Sales", icon: "🤝" },
                 { label: "Marketing", icon: "📣" }, { label: "Design", icon: "🎨" }, { label: "Human Resources", icon: "👥" }, { label: "Operations", icon: "🏗️" }
               ].map((topic) => (
                  <button key={topic.label} className="p-4 lg:p-5 bg-[#FBFBFD] border border-black/[0.05] rounded-xl lg:rounded-2xl font-black text-[11px] lg:text-[12px] uppercase tracking-widest text-[#1D1D1F]/60 hover:bg-white hover:border-[#E53935]/20 hover:text-[#E53935] transition-all text-left flex items-center gap-3 group">
                     <span className="text-lg lg:text-xl group-hover:scale-110 transition-transform">{topic.icon}</span>{topic.label}
                  </button>
               ))}
            </div>
         </div>
      </section>

      <footer className="bg-[#FBFBFD] border-t border-black/[0.05] py-10 lg:py-14">
         <div className="max-w-[1128px] mx-auto px-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-8 lg:mb-10">
               {[
                 { title: "General", links: ["What is Checkout", "Help Center", "Press", "Blog"] },
                 { title: "Browse", links: ["Learning", "Jobs", "Salary", "Mobile"] },
                 { title: "Business", links: ["Talent", "Marketing", "Sales", "Learning"] },
                 { title: "Support", links: ["Privacy Policy", "User Agreement", "Cookie Policy", "Copyright Policy"] }
               ].map((sec) => (
                 <div key={sec.title} className="space-y-3 lg:space-y-4">
                    <h4 className="text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-[#1D1D1F]">{sec.title}</h4>
                    <ul className="space-y-2 lg:space-y-3 text-[10px] lg:text-[11px] text-[#86868B] font-bold uppercase tracking-wider">
                       {sec.links.map(l => <li key={l}><Link href={l === "What is Checkout" ? "/what-is-checkout" : "#"} className="hover:text-[#E53935] transition-colors">{l}</Link></li>)}
                    </ul>
                 </div>
               ))}
            </div>
            <div className="pt-6 lg:pt-8 border-t border-black/[0.05] flex flex-col sm:flex-row items-center justify-between gap-4 text-[8px] lg:text-[9px] text-[#86868B] font-black uppercase tracking-widest text-center sm:text-left">
               <span>© Checkout 2026 · All Rights Reserved</span>
               <div className="flex gap-4 lg:gap-6"><span className="cursor-pointer hover:text-[#E53935] transition-colors">Accessibility</span><span className="cursor-pointer hover:text-[#E53935] transition-colors">Community Guidelines</span></div>
            </div>
         </div>
      </footer>
    </div>
  );
}

export default function AuthPage() { return (<Suspense fallback={null}><AuthContent /></Suspense>); }
