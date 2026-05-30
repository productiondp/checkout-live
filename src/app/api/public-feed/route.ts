import { createClient } from '@/utils/supabase/server';

export const runtime = 'edge';

/**
 * PUBLIC FEED API - EDGE CACHED
 * 
 * Fetches the global post feed with ultra-low latency.
 * Cached at Vercel Edge for 60s with SWR.
 */
export async function GET() {
  const supabase = createClient();

  try {
    const { data: posts, error } = await supabase
      .from('posts')
      .select(`
        *,
        profiles!posts_author_id_fkey(*)
      `)
      .eq('status', 'ACTIVE')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    return new Response(JSON.stringify(posts), {
      headers: {
        'Content-Type': 'application/json',
        //  Edge Caching Strategy:
        // s-maxage=60: Cache on Vercel Edge for 60 seconds
        // stale-while-revalidate=300: Serve stale data while revalidating for up to 5 minutes
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (err) {
    console.error('[API] Public Feed Error:', err);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
