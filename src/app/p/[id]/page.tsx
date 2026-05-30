import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import PublicPostView from './PublicPostView';

// Force dynamic rendering to ensure the shared post always has the latest data
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { id: string } }) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: post } = await supabase.from('posts').select('title, type, content').eq('id', params.id).single();
  
  if (!post) return { title: 'Post Not Found | Checkout' };
  
  return {
    title: `${post.title} | Checkout`,
    description: post.content || `Check out this exclusive ${post.type?.toLowerCase() || 'opportunity'} on the Checkout Network.`,
  };
}

export default async function PublicPostPage({ params }: { params: { id: string } }) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  
  // Fetch post with author profile attached using the clean relation we fixed earlier!
  const { data: post, error } = await supabase
    .from('posts')
    .select('*, profiles!posts_author_id_fkey(*)')
    .eq('id', params.id)
    .single();

  if (error || !post) {
    console.error("[PUBLIC_POST] Failed to fetch:", error);
    notFound();
  }

  // Format the profile data so the UniversalFeedCard can parse it perfectly
  const formattedPost = {
    ...post,
    author: post.profiles,
    authorName: post.profiles?.full_name || 'Checkout Member',
    avatar: post.profiles?.avatar_url,
  };

  return <PublicPostView post={formattedPost} />;
}
