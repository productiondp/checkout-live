"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface NotificationContextType {
  unreadMessagesCount: number;
  pendingRequestsCount: number;
  refreshCounts: () => Promise<void>;
  setActiveChatId: (id: string | null) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  
  const supabase = createClient();
  const syncChannel = useRef<BroadcastChannel | null>(null);

  //  TAB SYNC (BroadcastChannel) 
  useEffect(() => {
    syncChannel.current = new BroadcastChannel("checkout_notifications_sync");
    syncChannel.current.onmessage = (event) => {
      const { type, data } = event.data;
      if (type === "UPDATE_COUNTS") {
        setUnreadMessagesCount(data.unreadMessagesCount);
        setPendingRequestsCount(data.pendingRequestsCount);
      }
    };
    return () => syncChannel.current?.close();
  }, []);

  const broadcastCounts = useCallback((unread: number, pending: number) => {
    try {
      if (syncChannel.current) {
        syncChannel.current.postMessage({
          type: "UPDATE_COUNTS",
          data: { unreadMessagesCount: unread, pendingRequestsCount: pending }
        });
      }
    } catch (err) {
      if (!(err instanceof Error && err.name === 'InvalidStateError')) {
        console.warn("Broadcast Error:", err);
      }
    }
  }, []);

  const fetchCounts = useCallback(async () => {
    if (!user?.id || user.id === 'null' || user.id === 'undefined') {
      setUnreadMessagesCount(0);
      setPendingRequestsCount(0);
      return;
    }

    try {
      // 1. Unread Messages Count (Standard Query fallback)
      const { count: unreadCount, error: unreadErr } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .eq('is_read', false);
      
      if (unreadErr) throw unreadErr;
      setUnreadMessagesCount(Number(unreadCount) || 0);

      // 2. Pending Requests Count (Smart Join to avoid Ghost counts)
      const { data: rawConns } = await supabase
        .from('connections')
        .select('id, profiles!sender_id(id)')
        .eq('status', 'PENDING')
        .eq('receiver_id', user.id);
      
      const pendingCount = rawConns?.filter((c: any) => c.profiles).length || 0;
      setPendingRequestsCount(pendingCount);
      broadcastCounts(unreadCount, pendingCount);
    } catch (err) {
      console.error("Notification Sync Error:", err);
    }
  }, [user?.id, supabase, broadcastCounts]);

  //  TAB FOCUS REFRESH 
  useEffect(() => {
    const handleFocus = () => fetchCounts();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [fetchCounts]);

  useEffect(() => {
    if (!user?.id || user.id === 'null' || user.id === 'undefined') {
      setUnreadMessagesCount(0);
      setPendingRequestsCount(0);
      return;
    }

    fetchCounts();

    //  SIMPLIFIED REALTIME (Truth Fetch)
    const channel = supabase
      .channel(`global_notifications_${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages'
      }, () => fetchCounts())
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'connections'
      }, () => fetchCounts())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchCounts, supabase]);

  return (
    <NotificationContext.Provider value={{ 
      unreadMessagesCount, 
      pendingRequestsCount, 
      refreshCounts: fetchCounts,
      setActiveChatId
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}
