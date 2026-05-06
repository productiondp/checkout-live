import { create } from 'zustand';
import { createClient } from '@/utils/supabase/client';

interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  type: 'TEXT' | 'MEDIA' | 'VOICE' | 'SYSTEM';
  created_at: string;
  reply_to_id?: string;
  metadata?: any;
}

interface Conversation {
  id: string;
  type: 'DM' | 'GROUP' | 'OPPORTUNITY' | 'MEETUP';
  title?: string;
  avatar_url?: string;
  last_message_at: string;
  unread_count?: number;
}

interface ChatState {
  conversations: Conversation[];
  activeId: string | null;
  messages: Record<string, ChatMessage[]>;
  typing: Record<string, string[]>; // conversationId -> userIds[]
  isLoading: boolean;
  
  // Overlay State (Chat Head)
  overlayChatId: string | null;
  isOverlayOpen: boolean;
  
  // Actions
  setConversations: (convs: Conversation[]) => void;
  setActiveId: (id: string | null) => void;
  addMessage: (convId: string, msg: ChatMessage) => void;
  setMessages: (convId: string, msgs: ChatMessage[]) => void;
  setTyping: (convId: string, userIds: string[]) => void;
  setLoading: (loading: boolean) => void;
  setOverlayChatId: (id: string | null) => void;
  setOverlayOpen: (open: boolean) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  conversations: [],
  activeId: null,
  messages: {},
  typing: {},
  isLoading: false,
  overlayChatId: null,
  isOverlayOpen: false,
  
  setConversations: (conversations) => set({ conversations }),
  
  setActiveId: (activeId) => set({ activeId }),

  setOverlayChatId: (overlayChatId) => set({ overlayChatId }),
  
  setOverlayOpen: (isOverlayOpen) => set({ isOverlayOpen }),
  
  addMessage: (convId, msg) => set((state) => {
    const existing = state.messages[convId] || [];
    
    // 1. HARD FIREWALL: Prevent exact ID duplicates (Absolute Must)
    if (existing.some(m => m.id === msg.id)) return state;

    // 2. Aggressive De-Duper (The "Final Boss" of Sync Logic)
    const isRealMessage = !msg.id.startsWith('temp-');
    const incomingTempId = msg.metadata?.tempId;

    // Search for a match (either by ID tag or by content+time)
    const duplicateIndex = existing.findIndex(m => {
      if (incomingTempId && m.id === incomingTempId) return true;
      if (m.id === msg.id) return true;
      
      return m.content.trim() === msg.content.trim() && 
             m.sender_id === msg.sender_id &&
             Math.abs(new Date(m.created_at).getTime() - new Date(msg.created_at).getTime()) < 60000;
    });

    if (duplicateIndex !== -1) {
      if (isRealMessage) {
        // Swap temp for real, or ignore if already real
        const newMessages = [...existing];
        newMessages[duplicateIndex] = msg;
        return { messages: { ...state.messages, [convId]: newMessages } };
      }
      return state; // Already have a version of this, ignore the temp attempt
    }

    return {
      messages: {
        ...state.messages,
        [convId]: [...existing, msg].sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )
      }
    };
  }),

  setMessages: (convId, msgs) => set((state) => ({
    messages: { ...state.messages, [convId]: msgs }
  })),

  setTyping: (convId, userIds) => set((state) => ({
    typing: { ...state.typing, [convId]: userIds }
  })),

  setLoading: (isLoading) => set({ isLoading }),
}));
