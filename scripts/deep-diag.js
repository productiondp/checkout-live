const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
);

async function deepDiag() {
  console.log('=== DEEP DIAGNOSTIC ===\n');
  
  // 1. Check if we can reach Supabase at all
  console.log('1. Testing Supabase connectivity...');
  const { data: profiles, error: profErr } = await supabase
    .from('profiles')
    .select('id, role')
    .limit(3);
  
  if (profErr) {
    console.error('   PROFILES query failed:', profErr.message);
  } else {
    console.log('   PROFILES query OK. Found', profiles.length, 'rows');
    if (profiles.length > 0) {
      console.log('   Sample roles:', profiles.map(p => p.role));
    }
  }

  // 2. Try a single signup with maximum detail
  console.log('\n2. Attempting single PROFESSIONAL signup...');
  const ts = Date.now();
  const { data, error } = await supabase.auth.signUp({
    email: `deepdiag_${ts}@test.com`,
    password: 'TestPass123!',
    options: { data: { full_name: 'Deep Diag', role: 'PROFESSIONAL' } }
  });

  if (error) {
    console.error('   SIGNUP FAILED');
    console.error('   Error message:', error.message);
    console.error('   Error status:', error.status);
    console.error('   Error code:', error.code);
    console.error('   Full error:', JSON.stringify(error, null, 2));
  } else {
    console.log('   SIGNUP OK:', data.user?.id);
  }

  // 3. Check if there's a rate limit issue
  console.log('\n3. Checking auth health...');
  const { data: session, error: sessErr } = await supabase.auth.getSession();
  console.log('   Session check error:', sessErr?.message || 'None');

  // 4. Check the profiles table schema
  console.log('\n4. Querying profiles columns...');
  const { data: colData, error: colErr } = await supabase
    .from('profiles')
    .select('*')
    .limit(1);
  
  if (colErr) {
    console.error('   Schema query failed:', colErr.message);
  } else if (colData && colData.length > 0) {
    console.log('   Columns:', Object.keys(colData[0]).join(', '));
  } else {
    console.log('   No profile rows found');
  }
}

deepDiag();
