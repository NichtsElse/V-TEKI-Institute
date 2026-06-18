import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log("Fetching payments from Supabase...");
  const { data, error } = await supabase.from('payments').select('*');
  if (error) {
    console.error("Error fetching payments:", error);
  } else {
    console.log(`Success! Fetched ${data.length} payments.`);
  }

  console.log("Fetching programs from Supabase...");
  const { data: pData, error: pError } = await supabase.from('programs').select('*');
  if (pError) {
    console.error("Error fetching programs:", pError);
  } else {
    console.log(`Success! Fetched ${pData.length} programs.`);
  }
}

check();
