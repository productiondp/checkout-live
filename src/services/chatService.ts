import { createClient } from '@/utils/supabase/client';
import { markMessagesAsReadAction } from '@/actions/chat';

const supabase = createClient();

export const ChatService = {
  // 1. CONVERSATION MANAGEMENT
  async getConversations(userId: string) {
    const { data: conns, error } = await supabase
      .from('connections')
      .select('id, sender_id, receiver_id, status, created_at')
      .in('status', ['ACCEPTED', 'PENDING'])
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);

    if (error) throw error;
    if (!conns || conns.length === 0) return [];

    // Collect all partner IDs
    const partnerIds = conns.map((c: any) => c.sender_id === userId ? c.receiver_id : c.sender_id);
    
    // Fetch profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', partnerIds);
      
    const profileMap = (profiles || []).reduce((acc: any, p: any) => ({ ...acc, [p.id]: p }), {});

    // Fetch latest message per connection in parallel
    const msgPromises = conns.map((c: any) => 
      supabase
        .from('messages')
        .select('connection_id, content, sender_id, created_at')
        .eq('connection_id', c.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
    );
    
    const msgResults = await Promise.allSettled(msgPromises);

    return conns.map((conn: any, index: number) => {
      const partnerId = conn.sender_id === userId ? conn.receiver_id : conn.sender_id;
      const partner = profileMap[partnerId];
      
      const msgRes = msgResults[index];
      const lastMsg = msgRes.status === 'fulfilled' && msgRes.value.data ? msgRes.value.data : null;

      return {
        id: conn.id,
        title: partner?.full_name || "Partner",
        avatar_url: partner?.avatar_url,
        last_message_content: lastMsg?.content || "No messages yet",
        last_message_at: lastMsg?.created_at || conn.created_at,
        last_message_sender_id: lastMsg?.sender_id,
        members: [
          { user_id: userId },
          { user_id: partnerId }
        ]
      };
    }).sort((a: any, b: any) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());
  },

  async syncLegacyConnections(userId: string) {
    // No-op for V1. We use connections as the single source of truth.
  },

  async ensureDirectConversation(userId: string, partnerId: string) {
    const { data } = await supabase
      .from('connections')
      .select('*')
      .or(`and(sender_id.eq.${userId},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${userId})`)
      .single();
      
    if (data) return data;
    throw new Error("You must connect with this user first before chatting.");
  },

  // 2. MESSAGING
  async sendMessage(convId: string, senderId: string, content: string, type: 'TEXT' | 'MEDIA' | 'VOICE' = 'TEXT', metadata: any = {}) {
    const { data: conn } = await supabase.from('connections').select('sender_id, receiver_id').eq('id', convId).single();
    if (!conn) throw new Error("Connection not found");
    
    const receiverId = conn.sender_id === senderId ? conn.receiver_id : conn.sender_id;

    const { data, error } = await supabase
      .from('messages')
      .insert({
        connection_id: convId,
        sender_id: senderId,
        receiver_id: receiverId,
        content,
        is_read: false
      })
      .select()
      .single();

    if (error) throw error;

    // For V1, since updated_at doesn't exist, we skip bumping the connection itself.
    // The conversation list sorts by latest message created_at anyway.

    return {
      ...data,
      metadata: metadata,
      type: 'TEXT'
    };
  },

  async getMessages(convId: string, limit = 50, offset = 0) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('connection_id', convId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    
    return (data || []).map((m: any) => ({
       ...m,
       metadata: m.metadata || {},
       type: m.type || 'TEXT'
    })).reverse();
  },

  // 3. TYPING & PRESENCE
  async setTypingStatus(convId: string, userId: string, isTyping: boolean) {
    // Stub for UI compatibility
  },

  // 4. READ RECEIPTS
  async markAsRead(convId: string, userId: string) {
    try {
      await markMessagesAsReadAction(convId, userId);
    } catch (e) {
      console.error("Failed to mark as read:", e);
    }
  }
};
