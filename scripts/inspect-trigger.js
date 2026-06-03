const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
);

async function inspectTrigger() {
  console.log('=== TRIGGER INSPECTION ===\n');

  // Try to get the function source via information_schema
  // This won't work with anon key since pg_proc requires elevated access
  // Instead, let's try to understand the failure by checking what columns
  // the profiles table actually has versus what the trigger tries to insert

  // 1. Get all column info from profiles
  console.log('1. Profiles table structure (from a sample row):');
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .limit(1);
  
  if (data && data.length > 0) {
    const row = data[0];
    Object.entries(row).forEach(([key, val]) => {
      const type = val === null ? 'null' : typeof val;
      console.log(`   ${key.padEnd(25)} = ${type === 'object' ? JSON.stringify(val).substring(0, 50) : String(val).substring(0, 50)}`);
    });
  }

  // 2. Check for NOT NULL constraints by attempting an insert with minimal data
  // The handle_new_user trigger runs as SECURITY DEFINER, so RLS won't block it
  // But the embedding trigger (BEFORE INSERT) runs in the same transaction
  
  // 3. Check all migrations that may have modified the trigger
  console.log('\n2. The production trigger was working earlier today.');
  console.log('   PROFESSIONAL signup at 12:31 UTC - SUCCESS');
  console.log('   STUDENT signup at 12:32 UTC - SUCCESS');
  console.log('   BUSINESS signup at 12:34 UTC - SUCCESS');
  console.log('   PROFESSIONAL signup at 12:38+ UTC - ALL FAILING');
  console.log('');
  console.log('   CONCLUSION: Something changed on the production database');
  console.log('   between 12:34 UTC and 12:38 UTC.');
  console.log('');
  console.log('   The most likely cause is that the user ran the SQL from');
  console.log('   the implementation plan, which may have introduced a');
  console.log('   syntax error or referenced columns that do not exist');
  console.log('   in the production profiles table.');

  // 4. Check what columns the trigger references vs what exists
  console.log('\n3. Column compatibility check:');
  console.log('   Trigger inserts: id, full_name, role, avatar_url, city, location');
  
  if (data && data.length > 0) {
    const cols = Object.keys(data[0]);
    const triggerCols = ['id', 'full_name', 'role', 'avatar_url', 'city', 'location'];
    triggerCols.forEach(col => {
      const exists = cols.includes(col);
      console.log(`   ${col.padEnd(15)} => ${exists ? 'EXISTS' : 'MISSING !!!'}`);
    });
  }

  // 5. Check if email column has NOT NULL constraint
  console.log('\n4. Checking if email column exists (production has it, trigger doesn\'t set it):');
  if (data && data.length > 0) {
    const hasEmail = 'email' in data[0];
    console.log(`   email column exists: ${hasEmail}`);
    if (hasEmail) {
      console.log('   email value in sample:', data[0].email);
      console.log('');
      console.log('   *** POTENTIAL ROOT CAUSE ***');
      console.log('   The production profiles table has an "email" column.');
      console.log('   If it has a NOT NULL constraint, the trigger will fail');
      console.log('   because handle_new_user() does NOT insert an email value.');
    }
  }
}

inspectTrigger();
