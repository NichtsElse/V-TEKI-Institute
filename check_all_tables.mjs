import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SECRET_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAll() {
  const tables = ['organizations', 'users_profile', 'trainers', 'programs', 'batches', 'invoices', 'enrollments', 'payments', 'certificates', 'attendance_sessions', 'attendance_records', 'assessments', 'assessment_submissions', 'feedback'];
  for (const table of tables) {
    const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
    if (error) {
      console.error(`Error on ${table}:`, error.message);
    } else {
      console.log(`${table}: ${count}`);
    }
  }
}

checkAll();
