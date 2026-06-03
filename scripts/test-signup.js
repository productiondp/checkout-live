const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
);

async function testSignup() {
  console.log("Testing BUSINESS...");
  let ts = Date.now();
  let res = await supabase.auth.signUp({
    email: `testbusiness_${ts}@example.com`, password: 'password123',
    options: { data: { full_name: 'Test', role: 'BUSINESS' } }
  });
  console.log("BUSINESS error:", res.error?.message || "None");
}

testSignup();
