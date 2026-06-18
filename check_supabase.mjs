import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log("Fetching programs from Supabase...");
  const { data, error } = await supabase.from('programs').select('*');
  if (error) {
    console.error("Error fetching:", error);
  } else {
    console.log(`Success! Fetched ${data.length} programs.`);
    if (data.length > 0) {
      console.log("First program:", JSON.stringify(data[0], null, 2));
    }
  }
}

check();
