const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
);

async function test() {
  console.log("Checking connections table...");
  const { data: c, error: cErr } = await supabase.from('connections').select('id').limit(1);
  console.log("Connections error:", cErr?.message || "None");

  console.log("Checking messages columns...");
  const { data: m, error: mErr } = await supabase.from('messages').select('id, connection_id, receiver_id').limit(1);
  console.log("Messages error:", mErr?.message || "None");
}

test();
