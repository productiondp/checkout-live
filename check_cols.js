require('dotenv').config({path: '.env.local'});
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkCols() {
  const { data, error } = await supabase.from('creator_profiles').select('*').limit(1);
  if (error) console.error("Error:", error);
  else console.log("Cols:", Object.keys(data[0] || {}));
}
checkCols();
