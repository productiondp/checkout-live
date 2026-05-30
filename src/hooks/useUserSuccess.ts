import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

export function useUserSuccess(userId: string | undefined) {
  const [insights, setInsights] = useState<string[]>([]);
  const supabase = createClient();

  useEffect(() => {
    if (!userId) return;

    // [SEC] INFRASTRUCTURE GUARD: Skip querying missing outcome_type column in V1
    return;
  }, [userId]);

  return insights;
}
