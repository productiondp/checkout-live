const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPosts() {
  const { data, error } = await supabase.from('posts').select('id, profiles!posts_author_id_fkey(id, full_name)').limit(1);
  console.log("Posts:");
  console.log(JSON.stringify(data, null, 2));
  if (error) console.error("Error:", error);
}

checkPosts();
