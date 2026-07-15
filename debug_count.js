import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envPath = './.env';
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  if (line.includes('=')) {
    const [key, ...rest] = line.split('=');
    env[key.trim()] = rest.join('=').trim();
  }
});

const supabase = createClient(env['VITE_SUPABASE_URL'], env['VITE_SUPABASE_ANON_KEY']);

async function debug() {
  // Count all questions
  const { data, error } = await supabase.from('questions').select('id, title, user_id, created_at').order('id');
  console.log("Total questions:", data?.length);
  data?.forEach(q => console.log(`  #${q.id}: "${q.title}" by ${q.user_id} at ${q.created_at}`));
  if (error) console.log("Error:", error);
}

debug();
