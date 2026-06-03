require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!supabaseUrl || !supabaseKey) {
  console.error("Missing supabase env vars");
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey);

async function backfill() {
  console.log('Fetching CREATOR profiles...');
  const { data: profiles, error } = await supabase.from('profiles').select('*').eq('role', 'CREATOR');
  if (error) {
    console.error('Error fetching profiles:', error);
    return;
  }
  
  console.log('Found ' + profiles.length + ' creators in profiles table.');
  
  for (const p of profiles) {
    const { error: upsertErr } = await supabase.from('creator_profiles').upsert({
      id: p.id,
      category: 'INFLUENCER',
      subcategories: p.skills || ['Creator'],
      bio: p.bio || 'Checkout Creator',
      location: p.location || 'Unknown'
    }, { onConflict: 'id' });
    
    if (upsertErr) {
      console.error('Error upserting ' + p.id + ':', upsertErr);
    } else {
      console.log('Successfully backfilled creator_profiles for ' + p.id);
    }
  }
  
  console.log('Backfill complete!');
}

backfill();
