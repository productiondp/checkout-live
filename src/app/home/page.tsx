import { cookies } from 'next/headers';
import HomeFeedClient from '@/components/home/HomeFeedClient';
import { createClient } from '@/utils/supabase/server';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

/**
 * SERVER-SIDE HOME FEED (Sentinel V.25 Protected)
 * 
 * Performs 3-layer hydration:
 * 1. Public Feed: Fetched from Edge Cache for instant delivery.
 * 2. User Profile: Fetched server-side to prevent client-side waterfall.
 * 3. Client Cache: Hydrated instantly on mount.
 */
export default async function Home() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  
  let initialPosts = [];
  let user = null;
  let initialProfile = null;

  try {
    // Resolve base URL for SSR fetch (Vercel support)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 
                    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'));

    //  Concurrent fetching for maximum speed
    const [postsRes, profileRes] = await Promise.all([
      // Fetch from our Edge API (cached at Vercel Edge)
      fetch(`${baseUrl}/api/public-feed`, {
        next: { revalidate: 60, tags: ['public-feed'] }
      }).catch(err => {
        console.warn("[HOME] Edge Feed fetch failed:", err.message);
        return null;
      }),
      // Fetch private identity
      supabase.auth.getUser().catch(err => {
        console.warn("[HOME] Auth check failed:", err.message);
        return { data: { user: null } };
      })
    ]);

    // Handle Feed Data
    if (postsRes && postsRes.ok) {
      initialPosts = await postsRes.json().catch(() => []);
    }
    
    // Handle Profile Data
    user = profileRes?.data?.user;
    if (user) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      initialProfile = data;
    }
  } catch (err) {
    console.error("[HOME] Critical Hydration Failure:", err);
  }

  return (
    <ProtectedRoute>
      <HomeFeedClient 
        initialPosts={initialPosts} 
        initialProfile={initialProfile} 
      />
    </ProtectedRoute>
  );
}
