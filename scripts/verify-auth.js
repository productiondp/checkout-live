const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
);

async function verifyAllRoles() {
  const roles = ['PROFESSIONAL', 'BUSINESS', 'STUDENT', 'ADVISOR', 'CREATOR'];
  const results = [];

  for (const role of roles) {
    const ts = Date.now();
    const email = `verify_${role.toLowerCase()}_${ts}@test.com`;
    const { data, error } = await supabase.auth.signUp({
      email,
      password: 'TestPass123!',
      options: { data: { full_name: `Verify ${role}`, role } }
    });

    const status = error ? `FAIL: ${error.message}` : 'OK';
    results.push({ role, status });
    console.log(`  ${role.padEnd(14)} => ${status}`);

    // Clean up: delete the test user if signup succeeded
    if (data?.user?.id) {
      // We can't delete via anon key, but at least we verified creation works
    }
  }

  console.log('\n--- SUMMARY ---');
  const failed = results.filter(r => r.status !== 'OK');
  if (failed.length === 0) {
    console.log('ALL ROLES PASS. User creation is fully operational.');
  } else {
    console.log(`${failed.length} ROLE(S) STILL FAILING:`);
    failed.forEach(f => console.log(`  - ${f.role}: ${f.status}`));
  }
}

console.log('=== CHECKOUT AUTH VERIFICATION ===\n');
verifyAllRoles();
