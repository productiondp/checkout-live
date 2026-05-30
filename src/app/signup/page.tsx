"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { 
  Briefcase, 
  User, 
  ShieldCheck, 
  Award, 
  Loader2, 
  ArrowRight,
  ChevronRight,
  Mail,
  Lock,
  Sparkles,
  PlayCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import AuthSubmissionStatus, { AuthSubmissionState } from "@/components/auth/AuthSubmissionStatus";

type Role = "Business" | "Professional" | "Student" | "Advisor" | "Creator";

const ROLES: { value: Role; icon: any; desc: string }[] = [
  { value: "Business", icon: Briefcase, desc: "Hire and grow" },
  { value: "Professional", icon: User, desc: "Work and help" },
  { value: "Creator", icon: PlayCircle, desc: "Build your brand" },
  { value: "Advisor", icon: ShieldCheck, desc: "Give advice" },
  { value: "Student", icon: Award, desc: "Learn and grow" },
];

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [role, setRole] = useState<Role>("Business");
  const [formData, setFormData] = useState({ email: "", password: "", fullName: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [submissionState, setSubmissionState] = useState<AuthSubmissionState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || !supabase) return;
    setIsLoading(true);
    setSubmissionState('SECURING');
    setError(null);

    const supabase = createClient();

    try {
      setSubmissionState('VERIFYING');

      const dbRole = role === "Business" ? "Business Owner" : role;
      
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            role: dbRole
          }
        }
      });

      if (signUpError) throw signUpError;
      
      setSubmissionState('SYNCING');
      
      // Auto-Signin fallback
      if (!authData.session) {
        await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });
      }

      setSubmissionState('SUCCESS');
      setIsSuccess(true);
      
      setTimeout(() => {
        setSubmissionState(null);
      }, 800);

    } catch (err: any) {
      setSubmissionState('FAILED');
      setError(err.message || "Signup failed.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-6">
          <div className="h-20 w-20 bg-red-50 rounded-full flex items-center justify-center mx-auto">
            <Sparkles className="text-red-500" size={32} />
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tighter">Welcome!</h1>
          <p className="text-gray-400 font-medium">Going to your dashboard...</p>
          <Loader2 className="animate-spin text-red-500 mx-auto" size={24} />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFDFF] font-sans selection:bg-red-500/10 flex">
      {/* Left Panel: Branding */}
      <div className="hidden lg:flex w-1/2 bg-black relative overflow-hidden items-center justify-center p-20">
        <div className="absolute inset-0 bg-grid-white opacity-5" />
        <div className="absolute top-[-10%] right-[-10%] h-[500px] w-[500px] bg-red-500/10 blur-[120px] rounded-full animate-pulse" />
        
        <div className="relative z-10 space-y-8">
           <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-white/40 text-[10px] font-black uppercase tracking-widest">
              <div className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
              Join the Ecosystem
           </div>
           <h1 className="text-7xl font-black text-white leading-none uppercase italic tracking-tighter">
             Scale <br />
             <span className="text-red-500">Faster</span> <br />
             Together.
           </h1>
           <p className="text-white/40 text-xl max-w-md font-medium leading-tight uppercase">
             Connect with 8k+ nodes in a verified network of builders and advisors.
           </p>
        </div>
      </div>

      {/* Right Panel: Signup Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-20 overflow-y-auto">
        <div className="w-full max-w-md space-y-10">
          <header className="space-y-4">
             <h2 className="text-4xl font-black uppercase tracking-tighter italic">Create Account</h2>
             <p className="text-gray-400 font-medium uppercase text-xs tracking-widest">Start your journey today</p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-6">
               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Full Name</label>
                  <div className="relative">
                     <User className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                     <input 
                       name="fullName"
                       required
                       onChange={handleInput}
                       className="w-full h-16 bg-gray-50 border border-gray-100 rounded-xl pl-14 pr-6 font-bold text-sm outline-none focus:border-red-500 focus:bg-white transition-all shadow-sm"
                       placeholder="Enter your name"
                     />
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Work Email</label>
                  <div className="relative">
                     <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                     <input 
                       name="email"
                       type="email"
                       required
                       onChange={handleInput}
                       className="w-full h-16 bg-gray-50 border border-gray-100 rounded-xl pl-14 pr-6 font-bold text-sm outline-none focus:border-red-500 focus:bg-white transition-all shadow-sm"
                       placeholder="you@company.com"
                     />
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Secure Password</label>
                  <div className="relative">
                     <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                     <input 
                       name="password"
                       type="password"
                       required
                       onChange={handleInput}
                       className="w-full h-16 bg-gray-50 border border-gray-100 rounded-xl pl-14 pr-6 font-bold text-sm outline-none focus:border-red-500 focus:bg-white transition-all shadow-sm"
                       placeholder=""
                     />
                  </div>
               </div>
            </div>

            <div className="space-y-4">
               <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Select your role</label>
               <div className="grid grid-cols-2 gap-3">
                  {ROLES.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setRole(r.value)}
                      className={cn(
                        "p-5 rounded-xl border text-left transition-all relative group",
                        role === r.value 
                          ? "bg-red-50 border-red-500/20 text-red-500 shadow-lg shadow-red-500/5" 
                          : "bg-white border-gray-100 text-gray-400 hover:border-gray-300"
                      )}
                    >
                      <r.icon size={20} className="mb-2" />
                      <div className="text-[10px] font-black uppercase tracking-wider">{r.value}</div>
                      <div className="text-[8px] font-medium uppercase opacity-60">{r.desc}</div>
                    </button>
                  ))}
               </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-500 text-xs font-black uppercase italic tracking-wider animate-in fade-in slide-in-from-top-2">
                {error}
              </div>
            )}

            <div className="space-y-6 pt-4">
              <button 
                type="submit"
                disabled={isLoading}
                className="w-full h-20 bg-black text-white rounded-xl font-black uppercase text-xs tracking-[0.2em] flex items-center justify-center gap-4 hover:bg-red-500 transition-all shadow-2xl active:scale-95 disabled:opacity-50 group"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    Complete Signup
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>

              <AnimatePresence>
                {submissionState && (
                  <AuthSubmissionStatus 
                    state={submissionState} 
                    error={error}
                    onRetry={() => {
                      setSubmissionState(null);
                      setError(null);
                    }}
                  />
                )}
              </AnimatePresence>

              <p className="text-center text-[10px] font-black uppercase text-gray-400 tracking-widest">
                Already have an account? <button type="button" onClick={() => router.push("/")} className="text-black hover:text-red-500 transition-colors">Sign In</button>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}


