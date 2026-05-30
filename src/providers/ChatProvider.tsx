"use client";

import React, { createContext, useContext, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useChatStore } from '@/stores/chatStore';
import { ChatService } from '@/services/chatService';

const supabase = createClient();

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { addMessage, setConversations, setTyping, activeId } = useChatStore();

  // 1. Initial Load
  useEffect(() => {
    if (!user?.id) return;

    const loadData = async () => {
      try {
        // Sync existing connections to the new system
        await ChatService.syncLegacyConnections(user.id);
        
        const convs = await ChatService.getConversations(user.id);
        setConversations(convs);
      } catch (err) {
        console.error("Chat Init Error:", err);
      }
    };

    loadData();
  }, [user?.id, setConversations]);

  // 2. Realtime Subscriptions
  useEffect(() => {
    if (!user?.id) return;

    // Listen for NEW MESSAGES in ALL conversations the user is part of
    const messageSub = supabase
      .channel(`chat_messages_${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages'
      }, (payload) => {
        const msg = payload.new as any;
        if (msg.sender_id === user.id || msg.receiver_id === user.id) {
          addMessage(msg.connection_id, msg);
          ChatService.getConversations(user.id).then(setConversations);
        }
      })
      .subscribe();

    // Listen for NEW CONNECTIONS
    const connSub = supabase
      .channel('chat_connections')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'connections'
      }, () => {
        ChatService.getConversations(user.id).then(setConversations);
      })
      .subscribe();

    // Listen for READ RECEIPTS
    const readSub = supabase
      .channel('chat_read_receipts')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages'
      }, () => {
        ChatService.getConversations(user.id).then(setConversations);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(messageSub);
      supabase.removeChannel(connSub);
      supabase.removeChannel(readSub);
    };
  }, [user?.id, addMessage, setConversations, activeId, setTyping]);

  return <>{children}</>;
}
