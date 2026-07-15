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

async function test() {
  console.log("Attempting insert with integer user_id...");
  const { data: insertRes, error: err3 } = await supabase.from('questions').insert({
    user_id: 1, // Invalid UUID syntax
    title: 'Test Title',
    level: 'High School',
    description: 'Test description',
  }).select();
  console.log("Insert Result:", insertRes, "Error:", err3);
}

test();
