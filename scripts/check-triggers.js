const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
);

async function checkTriggers() {
  console.log('=== TRIGGER & FUNCTION DIAGNOSTIC ===\n');

  // 1. Try to manually insert into profiles to see the exact error
  console.log('1. Attempting direct profile insert (should show exact error)...');
  const fakeId = '00000000-0000-0000-0000-000000000099';
  const { data: insertData, error: insertErr } = await supabase
    .from('profiles')
    .upsert({
      id: fakeId,
      full_name: 'Direct Test',
      role: 'PROFESSIONAL'
    }, { onConflict: 'id' });

  if (insertErr) {
    console.error('   Direct insert FAILED:', insertErr.message);
    console.error('   Code:', insertErr.code);
    console.error('   Details:', insertErr.details);
    console.error('   Hint:', insertErr.hint);
  } else {
    console.log('   Direct insert OK');
    // Clean up
    await supabase.from('profiles').delete().eq('id', fakeId);
  }

  // 2. Check if vector extension works
  console.log('\n2. Checking if vector extension exists...');
  const { data: vecData, error: vecErr } = await supabase.rpc('generate_simulated_embedding', {
    content: 'test'
  });
  if (vecErr) {
    console.error('   generate_simulated_embedding FAILED:', vecErr.message);
  } else {
    console.log('   generate_simulated_embedding OK, result length:', vecData?.length || 'unknown');
  }

  // 3. Check what the signup error log says by trying with the service role
  console.log('\n3. Testing signup with no metadata at all...');
  const ts = Date.now();
  const { data: noMetaData, error: noMetaErr } = await supabase.auth.signUp({
    email: `nometa_${ts}@test.com`,
    password: 'TestPass123!'
  });
  if (noMetaErr) {
    console.error('   No-metadata signup FAILED:', noMetaErr.message);
  } else {
    console.log('   No-metadata signup OK:', noMetaData.user?.id);
  }
}

checkTriggers();
