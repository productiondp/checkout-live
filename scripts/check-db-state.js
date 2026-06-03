const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
);

async function checkDbState() {
  console.log('=== DATABASE STATE CHECK ===\n');

  // 1. Count existing profiles
  const { count, error: cErr } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });
  console.log('1. Total profiles:', count, cErr ? `(Error: ${cErr.message})` : '');

  // 2. Count auth users via a different approach - check recently created profiles
  console.log('\n2. Recent profiles (last 24h):');
  const { data: recent, error: rErr } = await supabase
    .from('profiles')
    .select('id, full_name, role, created_at')
    .order('created_at', { ascending: false })
    .limit(10);
  
  if (rErr) {
    console.error('   Error:', rErr.message);
  } else {
    recent.forEach(p => console.log(`   ${p.created_at} | ${p.role.padEnd(14)} | ${p.full_name}`));
  }

  // 3. Check if onboarding_state table exists
  console.log('\n3. Checking onboarding_state table...');
  const { data: obData, error: obErr } = await supabase
    .from('onboarding_state')
    .select('*')
    .limit(1);
  console.log('   onboarding_state:', obErr ? `Error: ${obErr.message}` : `OK (${obData?.length} rows)`);

  // 4. Check focus_library table
  console.log('\n4. Checking focus_library table...');
  const { data: flData, error: flErr } = await supabase
    .from('focus_library')
    .select('*')
    .limit(1);
  console.log('   focus_library:', flErr ? `Error: ${flErr.message}` : `OK (${flData?.length} rows)`);

  // 5. Check if there are RLS policies blocking profile inserts
  console.log('\n5. Testing profile SELECT (should work with anon):');
  const { data: selData, error: selErr } = await supabase
    .from('profiles')
    .select('id')
    .limit(1);
  console.log('   SELECT:', selErr ? `Error: ${selErr.message}` : 'OK');

  // 6. Check if the trigger might be trying to insert into tables that don't exist
  console.log('\n6. Checking creator_profiles table...');
  const { data: cpData, error: cpErr } = await supabase
    .from('creator_profiles')
    .select('id')
    .limit(1);
  console.log('   creator_profiles:', cpErr ? `Error: ${cpErr.message}` : `OK (${cpData?.length} rows)`);

  console.log('\n7. Checking business_profiles table...');
  const { data: bpData, error: bpErr } = await supabase
    .from('business_profiles')
    .select('id')
    .limit(1);
  console.log('   business_profiles:', bpErr ? `Error: ${bpErr.message}` : `OK (${bpData?.length} rows)`);

  // 8. Wait 5 seconds and try signup again (rate limit cooldown)
  console.log('\n8. Waiting 5s for rate limit cooldown, then trying signup...');
  await new Promise(r => setTimeout(r, 5000));
  
  const ts = Date.now();
  const { data, error } = await supabase.auth.signUp({
    email: `cooldown_${ts}@test.com`,
    password: 'TestPass123!',
    options: { data: { full_name: 'Cooldown Test', role: 'PROFESSIONAL' } }
  });
  
  if (error) {
    console.error('   After cooldown - STILL FAILING:', error.message, `(status: ${error.status})`);
  } else {
    console.log('   After cooldown - SIGNUP OK:', data.user?.id);
  }
}

checkDbState();
