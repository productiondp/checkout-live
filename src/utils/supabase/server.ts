import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Database } from "@/types/supabase";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

export const createClient = (cookieStore?: Awaited<ReturnType<typeof cookies>>) => {
  const store = cookieStore ?? cookies();

  return createServerClient<Database>(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return store?.getAll?.() ?? []
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => store?.set?.(name, value, options))
          } catch {
            // ignore if cookieStore is unavailable (e.g., during static rendering)
          }
        },
      },
    },
  );
};
