"use client";

/**
 * DETERMINISTIC AUTHENTICATION PROVIDER (V16.5)
 * 
 * Features:
 * 1. UNIVERSAL TRIGGER: Every auth event triggers a terminal state resolution.
 * 2. PRODUCTION FAILSAFE: 6-second watchdog prevents any infinite loading.
 * 3. HARD REDIRECTS: Guarantees navigation even if the router encounters an internal hang.
 * 4. SURGICAL MUTEX: Serialization ensures atomic state updates.
 */

import React, { createContext, useContext, useState, ReactNode, useEffect, useRef, useMemo } from "react";
import { clearCache } from "@/lib/cache";
import { UserProfile } from "@/types/core";
import { createClient, runAuthSafe } from "@/utils/supabase/client";
import { useRouter, usePathname } from "next/navigation";
import { Session, User } from "@supabase/supabase-js";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { AuthState, AuthEvent } from "@/lib/auth-fsm";
import { monitoredTransition, metrics } from "@/lib/auth-monitor";
import { LiveOpsDashboard } from "@/devtools/live-ops/LiveOpsDashboard";

interface AuthContextType {
  state: AuthState;
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  isAuthResolved: boolean;
  logout: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => void;
  initAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);
const supabase = createClient();

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authState, setAuthState] = useState<{
    state: AuthState;
    isAuthResolved: boolean;
  }>({ state: { tag: 'initializing' }, isAuthResolved: false });

  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const router = useRouter();
  const pathname = usePathname();
  const sessionAuthorityRef = useRef<string | null>(null);
  const isResolvingRef = useRef(false);

  const dispatch = (event: AuthEvent) => {
    setAuthState(prev => {
      const nextState = monitoredTransition(prev.state, event);
      return {
        state: nextState,
        isAuthResolved: prev.isAuthResolved
      };
    });
  };

  /**
   * 1. AUTH INITIALIZATION & EVENT LISTENER
   */
  useEffect(() => {
    let mounted = true;

    const startSystem = async () => {
      if (isResolvingRef.current) return;
      try {
        await runAuthSafe(async () => {
          if (!mounted) return;
          try {
            const { data: { session: initialSession } } = await Promise.race([
              supabase.auth.getSession(),
              new Promise((_, reject) => setTimeout(() => reject(new Error('BOOT_TIMEOUT')), 3000))
            ]) as any;
            
            await resolveSession(initialSession);
          } catch (e) {
            console.error("[AUTH] Boot Failure:", e);
            setAuthState({ state: { tag: 'unauthenticated' }, isAuthResolved: true });
          }
        }, { label: 'INITIAL_BOOT' });
      } catch (err) {
        setAuthState(prev => ({ ...prev, isAuthResolved: true }));
      }
    };

    startSystem();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!mounted) return;

      runAuthSafe(async () => {
        if (!mounted) return;
        await resolveSession(currentSession);
      }, { label: `AUTH_CHANGE_${event}` });
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  /**
   * [SEC] AUTH FAILSAFE (V16.30)
   */
  useEffect(() => {
    if (authState.isAuthResolved) return;
    const failsafe = setTimeout(() => {
      if (!authState.isAuthResolved) {
        console.error('[AUTH FAILSAFE] Forced resolution triggered.');
        setAuthState({ state: { tag: 'unauthenticated' }, isAuthResolved: true });
      }
    }, 5000);
    return () => clearTimeout(failsafe);
  }, [authState.isAuthResolved]);

  /**
   * 2. SESSION RESOLUTION
   */
  const resolveSession = async (currentSession: Session | null) => {
    const timestamp = () => new Date().toISOString();
    
    // Concurrency Lock
    if (isResolvingRef.current && currentSession?.access_token === sessionAuthorityRef.current) {
      console.log('[RESOLVE] Redundant request ignored.');
      return;
    }
    
    isResolvingRef.current = true;
    try {
      if (!currentSession) {
        sessionAuthorityRef.current = 'GUEST';
        setAuthState({ state: { tag: 'unauthenticated' }, isAuthResolved: true });
        return;
      }

      sessionAuthorityRef.current = currentSession.access_token;
      setSession(currentSession);

      const { data, error } = await Promise.race([
        supabase.from('profiles').select('*').eq('id', currentSession.user.id).maybeSingle(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('PROFILE_TIMEOUT')), 2500))
      ]) as any;

      if (error) throw error;
      setProfile(data);
      setUser(currentSession.user);

      //  HYDRATION GATE: If profile is missing (new signup), use metadata
      const hydratedProfile: Partial<UserProfile> = data || {
        id: currentSession.user.id,
        full_name: currentSession.user.user_metadata?.full_name || "New Member",
        role: currentSession.user.user_metadata?.role as any || "PROFESSIONAL",
        onboarding_completed: false,
        avatar_url: currentSession.user.user_metadata?.avatar_url || "",
        expertise: [],
        intents: [],
        bio: ""
      };
      
      if (!data) setProfile(hydratedProfile as UserProfile);

      // [SEC] DETERMINISTIC ONBOARDING CHECK
      // Must have a profile AND have completed the onboarding steps
      const nextTag = (hydratedProfile.onboarding_completed) ? 'authenticated' : 'onboarding';
      
      setAuthState({ 
        state: { tag: nextTag as any }, 
        isAuthResolved: true 
      });
      
    } catch (e: any) {
      setAuthState({ state: { tag: 'onboarding' }, isAuthResolved: true });
    } finally {
      isResolvingRef.current = false;
    }
  };

  const logout = async () => {
    try {
      await runAuthSafe(async () => {
        setAuthState({ state: { tag: 'unauthenticated' }, isAuthResolved: false });
        
        // Prevent signOut from hanging longer than the 5s watchdog
        await Promise.race([
          supabase.auth.signOut(),
          new Promise(resolve => setTimeout(resolve, 3000))
        ]);
        
        clearCache();
        setAuthState({ state: { tag: 'unauthenticated' }, isAuthResolved: true });
      }, { priority: 'high', label: 'LOGOUT' });
    } catch (e) {
      console.warn("[AUTH] Logout error/timeout caught:", e);
      // Force unauthenticated state locally so the user is still successfully logged out visually
      setAuthState({ state: { tag: 'unauthenticated' }, isAuthResolved: true });
    }
  };

  const login = async (email: string, password: string) => {
    await runAuthSafe(async () => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (data.session) await resolveSession(data.session);
    }, { priority: 'high', label: 'LOGIN' });
  };

  const updateProfile = (data: Partial<UserProfile>) => {
    setProfile(prev => {
      const updated = prev ? { ...prev, ...data } : { ...data } as UserProfile;
      if (data.onboarding_completed) {
        setAuthState({ state: { tag: 'authenticated' }, isAuthResolved: true });
      }
      return updated;
    });
  };

  const initAuth = async () => {
    await runAuthSafe(async () => {
      const { data: { session: s } } = await supabase.auth.getSession();
      await resolveSession(s);
    }, { label: 'MANUAL_INIT' });
  };

  const value = useMemo(() => ({
    state: authState.state, 
    session, 
    user, 
    profile, 
    isAuthResolved: authState.isAuthResolved, 
    logout, 
    login, 
    updateProfile, 
    initAuth
  }), [session, user, profile, authState]);

  if (!authState.isAuthResolved) {
    return <LoadingScreen />;
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

/**
 *  DETERMINISTIC ROUTE GUARD HOOK
 */
export function useAuthGuard(required: 'authenticated' | 'unauthenticated' | 'onboarding') {
  const { state, isAuthResolved } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    hasRedirectedRef.current = false;
  }, [pathname]);

  useEffect(() => {
    if (!isAuthResolved || state.tag === 'initializing') return;
    
    // [SEC] SELF-HEALING: Reset redirect lock if still on wrong page after 2s
    const recovery = setTimeout(() => {
      hasRedirectedRef.current = false;
    }, 2000);

    if (hasRedirectedRef.current) return () => clearTimeout(recovery);

    // Guest trying to access protected route (Home or Onboarding)
    if ((required === 'authenticated' || required === 'onboarding') && state.tag === 'unauthenticated') {
      if (pathname === '/') return;
      console.log('[GUARD] Unauthenticated user on protected route. Redirecting to /');
      hasRedirectedRef.current = true;
      router.replace('/');

      //  HARD REDIRECT FALLBACK
      setTimeout(() => {
        if (window.location.pathname !== '/') window.location.href = '/';
      }, 2000);
      return;
    }

    // Authenticated user trying to access landing/guest page
    if (required === 'unauthenticated' && state.tag === 'authenticated') {
      if (pathname === '/home') return;
      console.log('[GUARD] Authenticated user on guest route. Redirecting to /home');
      hasRedirectedRef.current = true;
      router.replace('/home');

      //  HARD REDIRECT FALLBACK
      setTimeout(() => {
        if (window.location.pathname !== '/home') window.location.href = '/home';
      }, 2000);
      return;
    }

    // [SEC] ONBOARDING COMPLETION REDIRECT
    // If user is on onboarding but already finished, send to home
    if (required === 'onboarding' && state.tag === 'authenticated') {
      console.log('[GUARD] Onboarding complete. Redirecting to /home');
      hasRedirectedRef.current = true;
      router.replace('/home');
      return;
    }

    // New user needs onboarding
    if (state.tag === 'onboarding' && required !== 'onboarding') {
      if (pathname === '/onboarding') return; // [SEC] Prevent self-redirect loop
      
      console.log('[GUARD] User needs onboarding. Waiting for cookie sync...');
      hasRedirectedRef.current = true;
      
      //  COOKIE SYNC DELAY (Allow Supabase to write cookies before redirect)
      setTimeout(() => {
        console.log('[GUARD] Redirecting to /onboarding');
        router.replace('/onboarding');
      }, 150);

      //  HARD REDIRECT FALLBACK
      setTimeout(() => {
        const current = window.location.pathname;
        if (current !== '/onboarding' && !current.startsWith('/onboarding')) {
          console.log('[GUARD] Hard redirect fallback triggered');
          window.location.href = '/onboarding';
        }
      }, 800);
      return;
    }
  }, [state.tag, isAuthResolved, required, router, pathname]);

  return { loading: state.tag === 'initializing' || !isAuthResolved, state };
}

export function useRequiredUser() {
  const { user, state, isAuthResolved } = useAuth();
  if (state.tag === 'initializing' || !isAuthResolved) return { user: null, loading: true };
  if (!user || state.tag !== 'authenticated') throw new Error('User not authenticated');
  return { user, loading: false };
}
