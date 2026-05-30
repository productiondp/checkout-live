"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  ArrowRight,
  Mail,
  Lock,
  User,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  Chrome,
  Eye,
  EyeOff,
  Sparkles
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { analytics } from "@/utils/analytics";
import AuthSubmissionStatus, { AuthSubmissionState } from "./AuthSubmissionStatus";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

type AuthMode = "signin" | "signup";
type Role = "Business" | "Professional" | "Student" | "Advisor" | "Creator";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: AuthMode;
}

export default function AuthModal({ isOpen, onClose, initialMode = "signin" }: AuthModalProps) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [role, setRole] = useState<Role>("Business");
  const [isLoading, setIsLoading] = useState(false);
  const [submissionState, setSubmissionState] = useState<AuthSubmissionState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: ""
  });
  const [resendTimer, setResendTimer] = useState(0);
  const [signupAttempts, setSignupAttempts] = useState(0);
  const [lastSignupTime, setLastSignupTime] = useState(0);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode, isOpen]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => setResendTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    //  FRONTEND GUARD: Anti-Spam UX
    const now = Date.now();
    if (mode === "signup") {
      if (now - lastSignupTime < 10000) {
        setError("Please wait a few seconds before trying again.");
        return;
      }
      if (signupAttempts >= 5 && now - lastSignupTime < 300000) {
        setError("Too many signup attempts. Please wait 5 minutes.");
        return;
      }
    }

    setIsLoading(true);
    setError(null);
    const supabase = createClient();

    //  SUBMISSION WATCHDOG (5s)
    const watchdog = setTimeout(() => {
      if (isLoading) {
        setIsLoading(false);
        setSubmissionState('FAILED');
        setError("The authentication mesh is taking too long to respond. Please try again.");
      }
    }, 5000);

    try {
      // Direct call - only show overlay if it takes > 300ms
      const overlayTimeout = setTimeout(() => {
        if (!isSuccess) setSubmissionState('VERIFYING');
      }, 300);

      if (mode === "signup") {
        if (!formData.fullName || formData.fullName.length < 2) {
          throw new Error("Please enter your full name.");
        }
        
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.fullName,
              role: role.toUpperCase(),
            },
          },
        });
        
        if (signUpError) throw signUpError;
        
        setSignupAttempts(prev => prev + 1);
        setLastSignupTime(now);
        
        // Auto-Signin fallback if no session
        if (!authData.session) {
          await supabase.auth.signInWithPassword({
            email: formData.email,
            password: formData.password,
          });
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });
        if (signInError) throw signInError;
      }

      clearTimeout(overlayTimeout);
      clearTimeout(watchdog);
      setSubmissionState('SUCCESS');
      setIsSuccess(true);
      
      setTimeout(() => {
        setSubmissionState(null);
        onClose();
      }, 500);

    } catch (err: any) {
      console.error("[AUTH] Submission Failure:", err);
      clearTimeout(watchdog);
      setSubmissionState('FAILED');
      setError(err.message || "Credential verification failed.");
    } finally {
      setIsLoading(false);
      // Ensure we don't stay stuck in VERIFYING if an error occurred
      if (submissionState !== 'SUCCESS' && submissionState !== 'FAILED') {
        setSubmissionState(null);
      }
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    const supabase = createClient();
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(formData.email);
      if (error) throw error;
      setResetSent(true);
    } catch (err: any) {
      setError(err.message || "Failed to send reset link.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      {/* Cinematic Backdrop */}
      <div
        className="absolute inset-0 bg-[#0a0a0a]/90 backdrop-blur-xl animate-in fade-in duration-700"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-[480px] bg-[#1a1a1a] rounded-lg shadow-[0_0_100px_-20px_rgba(229,57,53,0.3)] border border-white/5 overflow-hidden animate-in zoom-in-95 fade-in duration-500">

        {/* Subtle Ambient Glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-[#E53935]/10 rounded-full blur-[80px]" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-8 right-8 text-white/40 hover:text-white transition-all hover:rotate-90 z-30 p-2 rounded-full hover:bg-white/5"
        >
          <X size={20} />
        </button>

        {/* Content Container */}
        <div className="p-10 lg:p-12 space-y-8 relative z-10">

          {/* Header */}
          <div className="space-y-2 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E53935]/10 border border-[#E53935]/20 text-[#E53935] text-[9px] font-black uppercase  mb-2">
              Join the Network
            </div>
            <h2 className="text-4xl font-black text-white ">
              {isResetting ? "Reset Password" : mode === "signin" ? "Welcome Back" : "Create Account"}
            </h2>
            <p className="text-white/40 font-bold text-[13px]">
              {resetSent 
                ? "Recovery link sent." 
                : isResetting 
                  ? "Enter your email to reset your password."
                  : mode === "signin"
                    ? "Sign in to your local account."
                    : "Join the local business network."
              }
            </p>
          </div>

          {resetSent ? (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="bg-[#E53935]/5 border border-[#E53935]/20 rounded-lg p-8 text-center">
                   <div className="h-20 w-20 bg-[#E53935] rounded-lg mx-auto flex items-center justify-center text-white shadow-[0_0_40px_-10px_#E53935] mb-6">
                      <Mail size={32} />
                   </div>
                   <h3 className="text-xl font-black text-white mb-2 uppercase">Reset Link Sent</h3>
                   <p className="text-white/40 text-[13px] font-medium leading-relaxed mb-6">
                      We've sent a reset link to {formData.email}. Access it to reset your password.
                   </p>
                </div>
               <button 
                 onClick={() => { setResetSent(false); setIsResetting(false); }}
                 className="w-full py-4 bg-white/5 border border-white/5 rounded-lg text-[11px] font-black uppercase text-white/40 hover:text-white transition-all"
               >
                  Back to Sign In
               </button>
            </div>
          ) : isResetting ? (
            <form onSubmit={handleResetPassword} className="space-y-6">
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3 text-red-500 text-[13px] font-bold">
                  <AlertCircle size={16} /> {error}
                </div>
              )}
              <div className="relative group">
                <div className="absolute inset-y-0 left-5 flex items-center text-white/20 group-focus-within:text-[#E53935]">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Recovery Email"
                  className="w-full bg-white/5 border border-white/5 rounded-lg py-4 pl-14 pr-6 text-[14px] font-bold text-white outline-none focus:border-[#E53935]/50 transition-all placeholder:text-white/20"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-5 bg-white text-black rounded-lg font-black text-[11px] uppercase  hover:bg-[#E53935] hover:text-white transition-all shadow-2xl flex items-center justify-center gap-4"
              >
                {isLoading ? "Sending..." : "Send Reset Link"}
              </button>
              <button
                type="button"
                onClick={() => setIsResetting(false)}
                className="w-full text-center text-[10px] font-black uppercase text-white/30 hover:text-white transition-all"
              >
                Cancel
              </button>
            </form>
          ) : (
            <>
          {/* Intent Detection - Frictionless Style */}
          <div className="space-y-3">
             <p className="text-[10px] font-black uppercase text-white/20 tracking-widest ml-1">What do you want to do?</p>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole("Professional")}
                  className={cn(
                    "h-16 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all",
                    role === "Professional" ? "bg-[#E53935] border-[#E53935] text-white shadow-xl shadow-red-500/20" : "bg-white/5 border-white/5 text-white/40 hover:border-white/10"
                  )}
                >
                   <Briefcase size={18} />
                   <span className="text-[10px] font-black uppercase tracking-tight">Find work</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole("Advisor")}
                  className={cn(
                    "h-16 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all",
                    role === "Advisor" ? "bg-[#E53935] border-[#E53935] text-white shadow-xl shadow-red-500/20" : "bg-white/5 border-white/5 text-white/40 hover:border-white/10"
                  )}
                >
                   <Sparkles size={18} />
                   <span className="text-[10px] font-black uppercase tracking-tight">Offer help</span>
                </button>
             </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3 text-red-500 text-[13px] font-bold animate-in fade-in slide-in-from-top-2">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            {isSuccess && (
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-3 text-green-500 text-[13px] font-bold animate-in fade-in slide-in-from-top-2">
                <CheckCircle2 size={16} />
                Login successful. Redirecting...
              </div>
            )}

            <div className="space-y-3">
              {mode === "signup" && (
                <div className="relative group">
                  <div className="absolute inset-y-0 left-5 flex items-center text-white/20 group-focus-within:text-[#E53935] transition-colors">
                    <User size={18} />
                  </div>
                  <input
                    type="text"
                    name="fullName"
                    required
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="Full Name"
                    className="w-full bg-white/5 border border-white/5 rounded-lg py-4 pl-14 pr-6 text-[14px] font-bold text-white outline-none focus:border-[#E53935]/50 focus:ring-4 focus:ring-[#E53935]/10 transition-all placeholder:text-white/20"
                  />
                </div>
              )}

              <div className="relative group">
                <div className="absolute inset-y-0 left-5 flex items-center text-white/20 group-focus-within:text-[#E53935] transition-colors">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Email Address"
                  className="w-full bg-white/5 border border-white/5 rounded-lg py-4 pl-14 pr-6 text-[14px] font-bold text-white outline-none focus:border-[#E53935]/50 focus:ring-4 focus:ring-[#E53935]/10 transition-all placeholder:text-white/20"
                />
              </div>

              <div className="relative group">
                <div className="absolute inset-y-0 left-5 flex items-center text-white/20 group-focus-within:text-[#E53935] transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Password"
                  className="w-full bg-white/5 border border-white/5 rounded-lg py-4 pl-14 pr-12 text-[14px] font-bold text-white outline-none focus:border-[#E53935]/50 focus:ring-4 focus:ring-[#E53935]/10 transition-all placeholder:text-white/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-5 flex items-center text-white/20 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {mode === "signin" && (
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => setIsResetting(true)}
                    className="text-[10px] font-black uppercase text-white/20 hover:text-[#E53935] transition-all"
                  >
                    Forgot Password?
                  </button>
                </div>
              )}
            </div>

            {/* CTA */}
            <button
              type="submit"
              disabled={isLoading || isSuccess}
              className={`w-full py-5 rounded-lg font-black text-[13px] uppercase  shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-4 mt-2 overflow-hidden relative group ${isLoading || isSuccess ? "bg-white/10 text-white/30 cursor-wait" : "bg-white text-black hover:bg-[#E53935] hover:text-white"
                }`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
              <span>{mode === "signin" ? "Sign In" : "Join Now"}</span>
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

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

          {/* Social Access */}
          <div className="relative pt-2">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-white/5"></div>
            </div>
            <div className="relative flex justify-center text-[10px] font-black uppercase">
              <span className="px-4 bg-[#1a1a1a] text-white/20 ">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <button 
              disabled 
              className="py-4 bg-white/5 border border-white/5 rounded-lg cursor-not-allowed opacity-50 text-[11px] font-black uppercase flex items-center justify-center gap-3 text-white group relative"
            >
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-white text-black text-[9px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                Coming soon
              </div>
              <Chrome size={16} className="text-[#E53935]" />
              Google
            </button>
          </div>

          {/* Toggle Mode */}
          <div className="text-center pt-2">
            <button
              onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setIsResetting(false); }}
              className="text-[11px] font-black uppercase text-white/30 hover:text-[#E53935] transition-all"
            >
              {mode === "signin" ? "No account? Join Now" : "Registered? Sign In Instead"}
            </button>
          </div>
          </>
          )}
        </div>
      </div>
    </div>
  );
}
