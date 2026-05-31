"use server";

import { createClient } from "@supabase/supabase-js";

export async function markMessagesAsReadAction(convId: string, userId: string) {
  if (!convId || !userId) return { success: false, error: "Missing parameters" };

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
       console.error("Missing Supabase admin keys for server action");
       return { success: false, error: "Configuration error" };
    }
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { error } = await supabaseAdmin
      .from('messages')
      .update({ is_read: true })
      .eq('connection_id', convId)
      .eq('receiver_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error("markMessagesAsReadAction error:", error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    console.error("markMessagesAsReadAction error:", err);
    return { success: false, error: "Internal server error" };
  }
}
